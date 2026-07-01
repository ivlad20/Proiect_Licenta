import { supabase } from "../supabaseClient";
import { signedUrl } from "./productsApi";

// Aduce inspectiile cu defect care au o poza salvata pentru un produs, cele mai
// recente primele, impreuna cu URL-ul semnat al fiecarei imagini din Storage.
export async function loadDefectScans(productId, limit = 24) {
  const { data, error } = await supabase
    .from("inspections")
    .select("id, scanned_at, passed, match_score, defect_rate, image_path")
    .eq("product_id", productId)
    .not("image_path", "is", null)
    .order("scanned_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Eroare la citirea inspecțiilor cu defect:", error.message);
    return [];
  }

  const out = [];
  for (const r of data || []) {
    out.push({
      id: r.id,
      scannedAt: r.scanned_at,
      passed: r.passed,
      matchScore: r.match_score,
      defectRate: r.defect_rate,
      img: await signedUrl(r.image_path),
    });
  }
  return out;
}

// Statisticile unui produs: cate inspectii, cate au trecut, cate respinse, rata (%).
export async function loadInspectionStats(productId) {
  const empty = { inspected: 0, passed: 0, failed: 0, errorRate: 0 };
  const { data, error } = await supabase
    .from("inspections")
    .select("passed")
    .eq("product_id", productId);

  if (error) {
    console.error("Eroare la citirea statisticilor:", error.message);
    return empty;
  }

  const inspected = data.length;
  const passed = data.filter((r) => r.passed).length;
  const failed = inspected - passed;
  const errorRate = inspected ? Math.round((failed / inspected) * 1000) / 10 : 0;
  return { inspected, passed, failed, errorRate };
}

// Statistici globale (toate produsele), pentru bara de sus:
// cate inspectii s-au facut azi si rata de eroare medie pe intreg sistemul.
export async function loadGlobalStats() {
  const empty = { inspectedToday: 0, errorRate: 0 };
  const { data, error } = await supabase
    .from("inspections")
    .select("passed, scanned_at");

  if (error) {
    console.error("Eroare la citirea statisticilor globale:", error.message);
    return empty;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const inspectedToday = data.filter((r) => new Date(r.scanned_at) >= startOfDay).length;

  const total = data.length;
  const failed = data.filter((r) => !r.passed).length;
  const errorRate = total ? Math.round((failed / total) * 1000) / 10 : 0;
  return { inspectedToday, errorRate };
}
