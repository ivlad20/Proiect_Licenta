import React, { useState } from "react";
import { LogIn, Activity } from "lucide-react";
import { supabase } from "../supabaseClient";

// Ecran de autentificare. Conturile se creeaza din Supabase (Authentication ->
// Users); inregistrarea publica e dezactivata, deci nu poate intra oricine.
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr("Email sau parolă greșite.");
  };

  return (
    <div style={s.page}>
      <form style={s.card} onSubmit={onSubmit}>
        <div style={s.brand}>
          <div style={s.mark}><Activity size={20} strokeWidth={2.4} color="#fff" /></div>
          <div>
            <div style={s.title}>PolyInspect</div>
            <div style={s.sub}>Control vizual asamblare</div>
          </div>
        </div>

        <label style={s.label}>Email</label>
        <input
          style={s.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nume@exemplu.com"
          autoComplete="username"
          required
        />

        <label style={s.label}>Parolă</label>
        <input
          style={s.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {err && <div style={s.err}>{err}</div>}

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
          <LogIn size={16} /> {loading ? "Se conectează…" : "Autentificare"}
        </button>
      </form>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#f1f5f9", color: "#0f172a", fontFamily: "system-ui, sans-serif", padding: 20,
  },
  card: {
    width: "100%", maxWidth: 360, background: "#fff", borderRadius: 16,
    border: "1px solid #e2e8f0", boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
    padding: 28, display: "flex", flexDirection: "column",
  },
  brand: { display: "flex", alignItems: "center", gap: 12, marginBottom: 22 },
  mark: {
    width: 42, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    display: "grid", placeItems: "center",
  },
  title: { fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 1 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6, marginTop: 12 },
  input: {
    border: "1px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14,
    outline: "none", color: "#0f172a",
  },
  err: {
    marginTop: 14, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca",
    borderRadius: 9, padding: "8px 12px", fontSize: 13,
  },
  btn: {
    marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: "#2563eb", color: "#fff", border: "none", borderRadius: 10,
    padding: "11px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
};
