/* ==================================================================
   CONNECTION

   The two values below are the only configuration this site has.
   Get them from your Supabase project: Dashboard → Project Settings →
   API. Paste the Project URL and the `anon` `public` key.

   The anon key is meant to be public — it ships in every request from
   every visitor's browser and there is no way to hide it in a static
   site. It is safe here because it grants nothing on its own: the
   table refuses writes from anon entirely, and everything a visitor
   can do goes through the two validated functions in supabase.sql.
   Never paste the `service_role` key into this file. That one is a
   master key and it would be readable by anyone viewing source.

   Leave these empty and the site runs in LOCAL MODE: threads are kept
   in your own browser's localStorage and go no further. Useful for
   working on the layout without touching the real database.
   ================================================================== */

const CONFIG = {
  supabaseUrl:     "",
  supabaseAnonKey: "",
};
