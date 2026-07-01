import { GATEWAY_BASE } from "../components/styles";

// Declanseaza o inspectie pentru un produs. Gateway-ul ia singur ultimul cadru
// ROI din feed_server (nu trimitem imaginea din browser), ruleaza inferenta si
// salveaza rezultatul in Supabase. Intoarce rezultatul inspectiei.
export async function runInspection(productId) {
  const res = await fetch(`${GATEWAY_BASE}/inspect/${productId}`, {
    method: "POST",
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).error || "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Eroare gateway (${res.status})`);
  }
  return res.json();
}
