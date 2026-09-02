/* ==================================================================
   THE RECORD

   Everything that talks to storage. Two interchangeable backings sit
   behind one API:

     supabase — the real thing, shared by everyone
     local    — localStorage, private to this browser

   Which one is in use depends only on whether config.js has been
   filled in. The rest of the site never asks, so the whole interface
   can be built and tested with no database in existence.
   ================================================================== */

const VaultDB = (() => {

  /* ---------- who you are ------------------------------------------
     No accounts, so identity is a random value this browser mints once
     and keeps. It is the only thing that proves a comment is yours, so
     clearing site data really does mean losing the ability to delete
     what you wrote — there is deliberately no recovery path, because
     any recovery path would be an account.
     ------------------------------------------------------------------ */
  const TOKEN_KEY  = "asv.token";
  const HANDLE_KEY = "asv.handle";

  function token() {
    let t = null;
    try { t = localStorage.getItem(TOKEN_KEY); } catch (e) { /* private mode */ }
    if (!t) {
      t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2))
        + "-" + Date.now().toString(36);
      try { localStorage.setItem(TOKEN_KEY, t); } catch (e) {}
    }
    return t;
  }

  function handle(next) {
    if (next !== undefined) {
      try { localStorage.setItem(HANDLE_KEY, next); } catch (e) {}
      return next;
    }
    try { return localStorage.getItem(HANDLE_KEY) || ""; } catch (e) { return ""; }
  }

  /* Comments this browser wrote. Kept client-side so the delete link
     can appear on your own comments without the server ever having to
     say which rows belong to whom — that answer would let anyone map
     a thread back to its authors. */
  const MINE_KEY = "asv.mine";
  function mine() {
    try { return new Set(JSON.parse(localStorage.getItem(MINE_KEY) || "[]")); }
    catch (e) { return new Set(); }
  }
  function claim(id) {
    const s = mine(); s.add(id);
    try { localStorage.setItem(MINE_KEY, JSON.stringify([...s])); } catch (e) {}
  }


  /* ---------- local backing ------------------------------------------ */
  const LOCAL_KEY = "asv.local.comments";

  const local = {
    mode: "local",

    _all() {
      try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); }
      catch (e) { return []; }
    },
    _save(rows) {
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows)); } catch (e) {}
      window.dispatchEvent(new CustomEvent("apv:local-change"));
    },

    async list(slug) {
      return this._all()
        .filter(r => r.piece_slug === slug)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },

    async counts() {
      const out = {};
      for (const r of this._all()) {
        if (r.deleted_at) continue;
        out[r.piece_slug] = (out[r.piece_slug] || 0) + 1;
      }
      return out;
    },

    async post({ slug, parent, handle, body }) {
      const rows = this._all();
      const row = {
        id:         rows.reduce((m, r) => Math.max(m, r.id), 0) + 1,
        piece_slug: slug,
        parent_id:  parent ?? null,
        handle:     handle.trim(),
        body:       body.trim(),
        created_at: new Date().toISOString(),
        deleted_at: null,
      };
      rows.push(row);
      this._save(rows);
      claim(row.id);
      return row.id;
    },

    async remove(id) {
      const rows = this._all();
      const row  = rows.find(r => r.id === id);
      if (!row || row.deleted_at) return false;
      row.deleted_at = new Date().toISOString();
      row.body = ""; row.handle = "";
      this._save(rows);
      return true;
    },

    subscribe(slug, cb) {
      const fn = () => cb();
      window.addEventListener("apv:local-change", fn);
      return () => window.removeEventListener("apv:local-change", fn);
    },
  };


  /* ---------- supabase backing ---------------------------------------- */
  function remote(client) {
    return {
      mode: "supabase",

      async list(slug) {
        const { data, error } = await client
          .from("comments")
          .select("id,piece_slug,parent_id,handle,body,created_at,deleted_at")
          .eq("piece_slug", slug)
          .order("created_at", { ascending: true });
        if (error) throw new Error(error.message);
        return data || [];
      },

      /* One column for every row, tallied here. Cheap while the vault is
         small; if it ever stops being small this becomes a view. */
      async counts() {
        const { data, error } = await client
          .from("comments")
          .select("piece_slug")
          .is("deleted_at", null);
        if (error) throw new Error(error.message);
        const out = {};
        for (const r of data || []) out[r.piece_slug] = (out[r.piece_slug] || 0) + 1;
        return out;
      },

      async post({ slug, parent, handle, body }) {
        const { data, error } = await client.rpc("post_comment", {
          p_slug:   slug,
          p_parent: parent ?? null,
          p_handle: handle,
          p_body:   body,
          p_token:  token(),
        });
        if (error) throw new Error(error.message);
        claim(data);
        return data;
      },

      async remove(id) {
        const { data, error } = await client.rpc("delete_comment", {
          p_id: id, p_token: token(),
        });
        if (error) throw new Error(error.message);
        return !!data;
      },

      subscribe(slug, cb) {
        const ch = client
          .channel("piece:" + slug)
          .on("postgres_changes",
              { event: "*", schema: "public", table: "comments",
                filter: "piece_slug=eq." + slug },
              () => cb())
          .subscribe();
        return () => client.removeChannel(ch);
      },
    };
  }


  /* ---------- pick one ------------------------------------------------ */
  let backing = local;

  if (typeof CONFIG !== "undefined" && CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) {
    if (window.supabase && window.supabase.createClient) {
      backing = remote(window.supabase.createClient(
        CONFIG.supabaseUrl, CONFIG.supabaseAnonKey,
        { auth: { persistSession: false } }
      ));
    } else {
      console.warn("[vault] configured for supabase but the client library " +
                   "did not load — falling back to local threads.");
    }
  }

  return {
    get mode() { return backing.mode; },
    list:      (...a) => backing.list(...a),
    counts:    (...a) => backing.counts(...a),
    post:      (...a) => backing.post(...a),
    remove:    (...a) => backing.remove(...a),
    subscribe: (...a) => backing.subscribe(...a),
    handle, mine,
  };
})();
