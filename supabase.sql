-- ===================================================================
-- AUDIOSPATIALS VAULT — discourse schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor →
-- New query → paste → Run). It is safe to re-run.
--
-- The pieces themselves are NOT in here. They live in station.js as
-- static data, same as Delilah's Vault. The only thing the database
-- ever holds is what people say about them.
--
-- Identity model: there are no accounts. Each browser mints a random
-- token once and keeps it in localStorage. The token is never stored
-- and never transmitted in readable form — only its SHA-256 lands in
-- the table. That is enough to prove "I wrote this" when deleting,
-- and useless to anyone reading the table, because you cannot walk
-- back from the hash to a random 128-bit value.
-- ===================================================================

create extension if not exists pgcrypto with schema extensions;


-- ---------- the thread --------------------------------------------
-- One flat table. Nesting is parent_id pointing at another row, which
-- is all a Reddit thread actually is. Depth is not stored; it falls
-- out of the chain and is computed when rendering.
create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  piece_slug  text        not null,
  parent_id   bigint      references public.comments(id) on delete cascade,
  handle      text        not null,
  body        text        not null,
  author_hash text        not null,
  created_at  timestamptz not null default now(),
  -- soft delete: the row survives so its replies keep their place in
  -- the tree, exactly like a [deleted] comment on Reddit.
  deleted_at  timestamptz
);

create index if not exists comments_piece_idx  on public.comments (piece_slug, created_at);
create index if not exists comments_parent_idx on public.comments (parent_id);
create index if not exists comments_author_idx on public.comments (author_hash, created_at desc);


-- ---------- who may do what ----------------------------------------
-- Reading is open to everyone. Writing is not: anon has no insert,
-- update or delete at all, and can only go through the two functions
-- below, which validate and rate-limit before touching anything.
alter table public.comments enable row level security;

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select using (true);

revoke insert, update, delete on public.comments from anon, authenticated;

-- Granted explicitly rather than relying on the project's "automatically
-- expose new tables" setting, which should be OFF: with it on, every table
-- added later is reachable from the public anon key by default, and the one
-- you forget about is the one that matters. This schema says exactly what it
-- exposes, and nothing else in the database is reachable.
grant select on public.comments to anon, authenticated;


-- ---------- posting -------------------------------------------------
-- security definer so it can write to a table the caller cannot.
-- Every rule about what counts as a valid comment lives here, where
-- the client cannot route around it.
create or replace function public.post_comment(
  p_slug   text,
  p_parent bigint,
  p_handle text,
  p_body   text,
  p_token  text
) returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash   text;
  v_depth  int;
  v_recent int;
  v_id     bigint;
begin
  p_handle := btrim(p_handle);
  p_body   := btrim(p_body);

  if p_token is null or length(p_token) < 16 then
    raise exception 'bad token' using errcode = '22023';
  end if;
  if length(p_handle) < 1 or length(p_handle) > 32 then
    raise exception 'A name has to be 1 to 32 characters.' using errcode = '22023';
  end if;
  if length(p_body) < 1 then
    raise exception 'Say something first.' using errcode = '22023';
  end if;
  if length(p_body) > 5000 then
    raise exception 'That is over the 5000 character limit.' using errcode = '22023';
  end if;

  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  -- rate limit, per browser, not per handle — changing your displayed
  -- name does not get you a fresh allowance.
  select count(*) into v_recent
    from public.comments
   where author_hash = v_hash
     and created_at > now() - interval '1 minute';
  if v_recent >= 3 then
    raise exception 'Slow down a moment.' using errcode = '22023';
  end if;

  select count(*) into v_recent
    from public.comments
   where author_hash = v_hash
     and created_at > now() - interval '1 hour';
  if v_recent >= 40 then
    raise exception 'That is enough for one hour.' using errcode = '22023';
  end if;

  -- a reply must attach to a real comment on the same piece, and the
  -- chain has to stay finite.
  if p_parent is not null then
    with recursive chain as (
      select id, parent_id, piece_slug, 1 as depth
        from public.comments where id = p_parent
      union all
      select c.id, c.parent_id, c.piece_slug, chain.depth + 1
        from public.comments c join chain on c.id = chain.parent_id
    )
    select max(depth) into v_depth from chain where piece_slug = p_slug;

    if v_depth is null then
      raise exception 'That comment is gone.' using errcode = '22023';
    end if;
    if v_depth >= 12 then
      raise exception 'This branch cannot go any deeper.' using errcode = '22023';
    end if;
  end if;

  insert into public.comments (piece_slug, parent_id, handle, body, author_hash)
       values (p_slug, p_parent, p_handle, p_body, v_hash)
    returning id into v_id;

  return v_id;
end;
$$;


-- ---------- unposting -----------------------------------------------
-- Soft delete only, and only your own: the hash of the token you send
-- has to match the hash stored on the row.
create or replace function public.delete_comment(
  p_id    bigint,
  p_token text
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  if p_token is null or length(p_token) < 16 then
    return false;
  end if;

  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  update public.comments
     set deleted_at = now(),
         body       = '',
         handle     = ''
   where id = p_id
     and author_hash = v_hash
     and deleted_at is null;

  return found;
end;
$$;


grant execute on function public.post_comment(text, bigint, text, text, text) to anon, authenticated;
grant execute on function public.delete_comment(bigint, text)                 to anon, authenticated;


-- ---------- live threads ---------------------------------------------
-- Lets an open thread fill in under the reader without a refresh, which
-- is the whole point of leaving the stream running in a tab.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end
$$;
