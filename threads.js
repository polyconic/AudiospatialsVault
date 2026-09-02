/* ==================================================================
   THE THREAD

   Renders the discussion under one piece. Flat rows come out of the
   database; the nesting is rebuilt here from parent_id, because a
   thread is only ever a list that knows who it was replying to.

   Nothing user-written is ever put through innerHTML. Handles and
   bodies go in as text nodes, always, no exceptions — this is the one
   place on the site where a stranger's input reaches the page.
   ================================================================== */

const Thread = (() => {

  const MAX_INDENT = 5;   // deeper replies keep threading but stop stepping
                          // right, or a long argument walks off a phone screen

  /* ---------- time ---------------------------------------------------- */
  function ago(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s <  45) return "just now";
    if (s <  90) return "a minute ago";
    const m = s / 60;
    if (m <  60) return Math.round(m) + " minutes ago";
    const h = m / 60;
    if (h <  24) return Math.round(h) + (Math.round(h) === 1 ? " hour ago" : " hours ago");
    const d = h / 24;
    if (d <  30) return Math.round(d) + (Math.round(d) === 1 ? " day ago" : " days ago");
    const mo = d / 30;
    if (mo < 12) return Math.round(mo) + (Math.round(mo) === 1 ? " month ago" : " months ago");
    const y = d / 365;
    return Math.round(y) + (Math.round(y) === 1 ? " year ago" : " years ago");
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls)  n.className   = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- flat rows to a tree -------------------------------------
     Replies whose parent is missing are re-parented to the root rather
     than dropped, so a comment can never become invisible because of a
     gap in the data.
     -------------------------------------------------------------------- */
  function tree(rows) {
    const byId = new Map(rows.map(r => [r.id, { ...r, kids: [] }]));
    const roots = [];
    for (const node of byId.values()) {
      const parent = node.parent_id != null ? byId.get(node.parent_id) : null;
      (parent ? parent.kids : roots).push(node);
    }
    return roots;
  }

  function countAll(node) {
    return node.kids.reduce((n, k) => n + 1 + countAll(k), 0);
  }


  function mount(root, slug) {
    root.classList.add("thread");
    root.textContent = "";

    const head    = el("div", "thhead");
    const heading = el("span", "thcount", "loading the thread");
    head.append(heading);
    if (VaultDB.mode === "local") {
      head.append(el("span", "thlocal", "local only — not published"));
    }

    const list    = el("div", "thlist");
    const compose = composer(slug, null, () => refresh());

    root.append(head, compose, list);

    let mineSet = VaultDB.mine();

    /* Which branches the reader has collapsed. Held by comment id and
       not persisted — a collapse is a reading gesture, not a setting. */
    const collapsed = new Set();

    /* Replies open right now. Kept across a refresh so a live update
       arriving mid-sentence does not wipe what you are typing. */
    const replying  = new Map();

    async function refresh() {
      let rows;
      try {
        rows = await VaultDB.list(slug);
      } catch (e) {
        heading.textContent = "";
        list.textContent = "";
        list.append(el("div", "thempty", "The thread could not be loaded. " + e.message));
        return;
      }

      mineSet = VaultDB.mine();

      const live = rows.filter(r => !r.deleted_at).length;
      heading.textContent =
        live === 0 ? "no comments yet" :
        live === 1 ? "1 comment"       : live + " comments";

      list.textContent = "";
      const roots = tree(rows);

      if (!roots.length) {
        list.append(el("div", "thempty",
          "Nothing here yet. If it is a work in progress, say what is working."));
        return;
      }
      for (const node of roots) list.append(render(node, 0));
    }

    function render(node, depth) {
      const wrap = el("div", "cwrap");
      wrap.style.setProperty("--step", depth <= MAX_INDENT ? 1 : 0);

      const isGone = !!node.deleted_at;
      const isMine = mineSet.has(node.id) && !isGone;
      const hidden = collapsed.has(node.id);
      const kidsN  = countAll(node);

      const row  = el("div", "comment" + (isGone ? " gone" : ""));

      /* The rail is both the visual thread line and the collapse
         control, which is how a Reddit thread behaves and the reason
         long threads stay readable on a small screen. */
      const rail = el("button", "crail");
      rail.type = "button";
      rail.setAttribute("aria-label", hidden ? "expand" : "collapse");
      rail.addEventListener("click", () => {
        if (collapsed.has(node.id)) collapsed.delete(node.id);
        else collapsed.add(node.id);
        refresh();
      });

      const body = el("div", "cbody");

      const meta = el("div", "cmeta");
      const tog  = el("button", "ctoggle", hidden ? "[+]" : "[–]");
      tog.type = "button";
      tog.addEventListener("click", () => {
        if (collapsed.has(node.id)) collapsed.delete(node.id);
        else collapsed.add(node.id);
        refresh();
      });
      meta.append(tog);
      meta.append(el("span", "chandle" + (isMine ? " me" : ""),
                     isGone ? "[removed]" : node.handle));
      const when = el("span", "cwhen", ago(node.created_at));
      when.title = new Date(node.created_at).toLocaleString();
      meta.append(when);
      if (hidden && kidsN) {
        meta.append(el("span", "ckids",
          "· " + kidsN + (kidsN === 1 ? " reply hidden" : " replies hidden")));
      }
      body.append(meta);

      if (!hidden) {
        const text = el("div", "ctext");
        if (isGone) {
          text.classList.add("cgone");
          text.textContent = "comment removed";
        } else {
          /* Paragraph breaks are the only formatting. Everything else
             is a text node — no markdown, no links, nothing that could
             carry markup in from a stranger. */
          for (const para of node.body.split(/\n{2,}/)) {
            const p = el("p", null);
            para.split(/\n/).forEach((line, i) => {
              if (i) p.append(document.createElement("br"));
              p.append(document.createTextNode(line));
            });
            text.append(p);
          }
        }
        body.append(text);

        if (!isGone) {
          const acts = el("div", "cacts");
          const rep  = el("button", "cact", "reply");
          rep.type = "button";
          rep.addEventListener("click", () => {
            if (replying.has(node.id)) {
              replying.get(node.id).remove();
              replying.delete(node.id);
            } else {
              const box = composer(slug, node.id, () => {
                replying.delete(node.id);
                refresh();
              }, () => {
                replying.delete(node.id);
                refresh();
              });
              replying.set(node.id, box);
              acts.after(box);
              const ta = box.querySelector("textarea");
              if (ta) ta.focus();
            }
          });
          acts.append(rep);

          if (isMine) {
            const del = el("button", "cact cdel", "delete");
            del.type = "button";
            del.addEventListener("click", async () => {
              if (!confirm("Delete this comment? Replies to it stay.")) return;
              try { await VaultDB.remove(node.id); } catch (e) { alert(e.message); }
              refresh();
            });
            acts.append(del);
          }
          body.append(acts);
        }
      }

      row.append(rail, body);
      wrap.append(row);

      if (!hidden) {
        for (const kid of node.kids) wrap.append(render(kid, depth + 1));
      }
      return wrap;
    }

    /* ---------- the box you type in ----------------------------------- */
    function composer(slug, parent, onDone, onCancel) {
      const form = el("form", "compose" + (parent ? " reply" : ""));

      const nameRow = el("div", "crow");
      const name = el("input", "cname");
      name.type = "text";
      name.placeholder = "a name";
      name.maxLength = 32;
      name.value = VaultDB.handle();
      nameRow.append(name);

      const ta = el("textarea", "ctext-in");
      ta.placeholder = parent ? "reply" : "what do you make of it";
      ta.rows = parent ? 3 : 4;
      ta.maxLength = 5000;

      const acts = el("div", "cformacts");
      const send = el("button", "csend", parent ? "reply" : "post");
      send.type = "submit";
      acts.append(send);
      if (onCancel) {
        const cancel = el("button", "cact", "cancel");
        cancel.type = "button";
        cancel.addEventListener("click", onCancel);
        acts.append(cancel);
      }
      const err = el("div", "cerr");
      acts.append(err);

      form.append(nameRow, ta, acts);

      /* Enter sends only with a modifier. A plain Enter has to stay a
         newline — people write paragraphs about work in progress. */
      ta.addEventListener("keydown", e => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          form.requestSubmit();
        }
      });

      form.addEventListener("submit", async e => {
        e.preventDefault();
        err.textContent = "";
        const h = name.value.trim();
        const b = ta.value.trim();
        if (!h) { err.textContent = "A name first."; name.focus(); return; }
        if (!b) { err.textContent = "Say something."; ta.focus(); return; }

        send.disabled = true;
        send.textContent = "sending";
        try {
          VaultDB.handle(h);
          await VaultDB.post({ slug, parent, handle: h, body: b });
          ta.value = "";
          onDone();
        } catch (ex) {
          err.textContent = ex.message;
        } finally {
          send.disabled = false;
          send.textContent = parent ? "reply" : "post";
        }
      });

      return form;
    }

    refresh();

    const stop = VaultDB.subscribe(slug, () => refresh());
    window.addEventListener("beforeunload", stop);
    return { refresh, stop };
  }

  return { mount, ago };
})();
