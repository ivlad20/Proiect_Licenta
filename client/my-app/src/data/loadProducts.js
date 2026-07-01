import { supabase } from "../supabaseClient";
import { signedUrl } from "./productsApi";

// Citeste produsele + piesele din Supabase si le aduce in forma folosita de UI.
// Statisticile (inspected/passed/failed/errorRate) le calculam mai tarziu din
// tabelul "inspections"; deocamdata pornesc de la 0.
export async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, code, model, has_camera, reference_image_path, " +
        "parts ( code, name, reference_image_path, sort_order )"
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("Eroare la citirea produselor din Supabase:", error.message);
    return [];
  }

  const mapped = (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    model: p.model,
    hasCamera: p.has_camera,
    errorRate: 0,
    inspected: 0,
    passed: 0,
    failed: 0,
    referenceImg: null,
    checkImg: null,
    _refPath: p.reference_image_path, // temporar, pentru URL-ul semnat
    parts: (p.parts || [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((pt) => ({
        code: pt.code,
        name: pt.name,
        img: null,
        _imgPath: pt.reference_image_path, // temporar, pentru URL-ul semnat
      })),
  }));

  // Generam URL-uri semnate pentru imaginile de referinta deja salvate
  // (atat pentru produs, cat si pentru fiecare piesa).
  await Promise.all(
    mapped.map(async (p) => {
      if (p._refPath) p.referenceImg = await signedUrl(p._refPath);
      delete p._refPath;
      await Promise.all(
        p.parts.map(async (pt) => {
          if (pt._imgPath) pt.img = await signedUrl(pt._imgPath);
          delete pt._imgPath;
        })
      );
    })
  );

  return mapped;
}
