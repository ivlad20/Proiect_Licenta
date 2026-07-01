import { createClient } from "@supabase/supabase-js";

// Valorile vin din fisierul .env (vezi .env.example).
// Cheia "anon" e publica prin design - e ok sa fie in frontend.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "Lipsesc VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Creează fișierul .env în client/my-app."
  );
}

export const supabase = createClient(url, anonKey);
