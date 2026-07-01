import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import App from "./App";
import Login from "./components/Login";

// Poarta de acces: verifica daca exista o sesiune Supabase.
//  - undefined = inca se incarca (evitam un flash de login);
//  - null      = neautentificat -> aratam ecranul de login;
//  - sesiune   -> aratam dashboard-ul, cu functia de deconectare.
export default function AuthGate() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{
        minHeight: "100vh", display: "grid", placeItems: "center",
        background: "#f1f5f9", color: "#64748b", fontFamily: "system-ui, sans-serif",
      }}>
        Se încarcă…
      </div>
    );
  }

  if (!session) return <Login />;

  const auth = {
    email: session.user?.email,
    signOut: () => supabase.auth.signOut(),
  };

  return <App auth={auth} />;
}
