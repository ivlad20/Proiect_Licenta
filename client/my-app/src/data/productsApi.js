import { supabase } from "../supabaseClient";

const BUCKET = "products";

function extFromFile(file) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(file?.name || "");
  return (m ? m[1] : "jpg").toLowerCase();
}

// Urca imaginea de referinta a produsului in Storage si salveaza calea in DB.
// Intoarce { path } la succes sau { error } la esec.
export async function uploadProductReference(productId, file) {
  // Retinem calea veche ca sa o stergem dupa ce o urcam pe cea noua.
  const { data: prod } = await supabase
    .from("products")
    .select("reference_image_path")
    .eq("id", productId)
    .maybeSingle();
  const oldPath = prod?.reference_image_path || null;

  const path = `reference/${productId}/ref_${Date.now()}.${extFromFile(file)}`;

  const up = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file?.type || "image/jpeg" });
  if (up.error) {
    console.error("Upload în Storage eșuat:", up.error.message);
    return { error: up.error.message };
  }

  const upd = await supabase
    .from("products")
    .update({ reference_image_path: path })
    .eq("id", productId);
  if (upd.error) {
    console.error("Salvarea căii în DB a eșuat:", upd.error.message);
    return { error: upd.error.message };
  }

  // Stergem imaginea veche din Storage (daca exista).
  if (oldPath && oldPath !== path) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  return { path };
}

// Urca imaginea de referinta a unei PIESE si salveaza calea in tabelul parts.
export async function uploadPartReference(productId, partCode, file) {
  // Retinem calea veche ca sa o stergem dupa upload.
  const { data: part } = await supabase
    .from("parts")
    .select("reference_image_path")
    .eq("product_id", productId)
    .eq("code", partCode)
    .maybeSingle();
  const oldPath = part?.reference_image_path || null;

  const safeCode = encodeURIComponent(partCode);
  const path = `reference/${productId}/parts/${safeCode}_${Date.now()}.${extFromFile(file)}`;

  const up = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file?.type || "image/jpeg" });
  if (up.error) {
    console.error("Upload piesă în Storage eșuat:", up.error.message);
    return { error: up.error.message };
  }

  const upd = await supabase
    .from("parts")
    .update({ reference_image_path: path })
    .eq("product_id", productId)
    .eq("code", partCode);
  if (upd.error) {
    console.error("Salvarea căii piesei în DB a eșuat:", upd.error.message);
    return { error: upd.error.message };
  }

  // Stergem imaginea veche din Storage (daca exista).
  if (oldPath && oldPath !== path) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  return { path };
}

// Redenumeste o piesa in baza de date.
export async function renamePart(productId, partCode, name) {
  const { error } = await supabase
    .from("parts")
    .update({ name })
    .eq("product_id", productId)
    .eq("code", partCode);
  if (error) {
    console.error("Redenumirea piesei a eșuat:", error.message);
    return { error: error.message };
  }
  return { ok: true };
}

// Schimba codul produsului (produsul e identificat prin id, nu prin cod).
export async function renameProductCode(productId, code) {
  const { error } = await supabase.from("products").update({ code }).eq("id", productId);
  if (error) {
    console.error("Schimbarea codului produsului a eșuat:", error.message);
    return { error: error.message };
  }
  return { ok: true };
}

// Schimba codul unei piese (caut dupa codul vechi in cadrul produsului).
export async function renamePartCode(productId, oldCode, newCode) {
  const { error } = await supabase
    .from("parts")
    .update({ code: newCode })
    .eq("product_id", productId)
    .eq("code", oldCode);
  if (error) {
    console.error("Schimbarea codului piesei a eșuat:", error.message);
    return { error: error.message };
  }
  return { ok: true };
}

// Redenumeste produsul in baza de date.
export async function renameProduct(productId, name) {
  const { error } = await supabase.from("products").update({ name }).eq("id", productId);
  if (error) {
    console.error("Redenumirea produsului a eșuat:", error.message);
    return { error: error.message };
  }
  return { ok: true };
}

// Update pe mai multe coloane ale unui produs deodata (ex. name, code, model).
export async function updateProductFields(productId, fields) {
  const { error } = await supabase.from("products").update(fields).eq("id", productId);
  if (error) {
    console.error("Update produs eșuat:", error.message);
    return { error: error.message };
  }
  return { ok: true };
}

// Update pe mai multe coloane ale unei piese (caut dupa codul vechi).
export async function updatePartFields(productId, oldCode, fields) {
  const { error } = await supabase
    .from("parts")
    .update(fields)
    .eq("product_id", productId)
    .eq("code", oldCode);
  if (error) {
    console.error("Update piesă eșuat:", error.message);
    return { error: error.message };
  }
  return { ok: true };
}

// Adauga o piesa noua la un produs.
export async function addPart(productId, code, name, sortOrder) {
  const { error } = await supabase
    .from("parts")
    .insert({ product_id: productId, code, name, sort_order: sortOrder });
  if (error) {
    console.error("Adăugarea piesei a eșuat:", error.message);
    return { error: error.message };
  }
  return { ok: true };
}

// Sterge o piesa (dupa cod, in cadrul produsului).
export async function deletePart(productId, code) {
  const { error } = await supabase
    .from("parts")
    .delete()
    .eq("product_id", productId)
    .eq("code", code);
  if (error) {
    console.error("Ștergerea piesei a eșuat:", error.message);
    return { error: error.message };
  }
  return { ok: true };
}

// URL semnat (temporar) pentru a afisa o imagine privata din Storage.
export async function signedUrl(path, expiresIn = 3600) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) {
    console.error("Generarea URL-ului semnat a eșuat:", error.message);
    return null;
  }
  return data.signedUrl;
}
