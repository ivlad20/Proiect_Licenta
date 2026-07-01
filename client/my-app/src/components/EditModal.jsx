import React, { useRef, useState } from "react";
import { X, Upload } from "lucide-react";

// Dialog generic de editare, centrat pe pagina.
// fields: [{ key, label, type: "text" | "number" | "image", value?, preview? }]
// onSave primeste un obiect { key: valoare }, iar pentru imagini { dataUrl, file }.
export default function EditModal({ title, fields, onClose, onSave }) {
  const [draft, setDraft] = useState(() => {
    const d = {};
    fields.forEach((f) => {
      d[f.key] = { value: f.value ?? "", file: null, preview: f.preview ?? null };
    });
    return d;
  });
  const fileInputs = useRef({});

  const set = (key, patch) =>
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const pickImage = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(key, { preview: reader.result, file });
    reader.readAsDataURL(file);
  };

  const save = () => {
    const out = {};
    fields.forEach((f) => {
      if (f.type === "image") {
        out[f.key] = { dataUrl: draft[f.key].preview, file: draft[f.key].file };
      } else {
        out[f.key] = draft[f.key].value;
      }
    });
    onSave(out);
    onClose();
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.head}>
          <span style={m.title}>{title}</span>
          <button style={m.closeBtn} onClick={onClose} title="Închide">
            <X size={16} />
          </button>
        </div>

        <div style={m.body}>
          {fields.map((f) => (
            <div key={f.key} style={m.field}>
              <label style={m.label}>{f.label}</label>
              {f.type === "image" ? (
                <div style={m.imageRow}>
                  <div style={m.preview}>
                    {draft[f.key].preview ? (
                      <img src={draft[f.key].preview} alt={f.label} style={m.previewImg} />
                    ) : (
                      <span style={m.previewEmpty}>fără imagine</span>
                    )}
                  </div>
                  <button
                    style={m.uploadBtn}
                    onClick={() => fileInputs.current[f.key] && fileInputs.current[f.key].click()}
                  >
                    <Upload size={14} /> Schimbă poza
                  </button>
                  <input
                    ref={(el) => (fileInputs.current[f.key] = el)}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => pickImage(f.key, e)}
                  />
                </div>
              ) : (
                <input
                  style={m.input}
                  type={f.type === "number" ? "number" : "text"}
                  value={draft[f.key].value}
                  onChange={(e) => set(f.key, { value: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        <div style={m.footer}>
          <button style={m.cancelBtn} onClick={onClose}>Anulează</button>
          <button style={m.saveBtn} onClick={save}>Salvează</button>
        </div>
      </div>
    </div>
  );
}

const m = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20,
  },
  card: {
    background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420,
    boxShadow: "0 20px 50px rgba(2,6,23,0.25)", overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  head: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "15px 18px", borderBottom: "1px solid #e2e8f0",
  },
  title: { fontWeight: 700, fontSize: 15, color: "#0f172a" },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer", color: "#64748b",
    display: "grid", placeItems: "center", padding: 2,
  },
  body: { padding: 18, display: "flex", flexDirection: "column", gap: 14, maxHeight: "70vh", overflowY: "auto" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#475569" },
  input: {
    border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 11px", fontSize: 14,
    outline: "none", color: "#0f172a",
  },
  imageRow: { display: "flex", alignItems: "center", gap: 12 },
  preview: {
    width: 120, height: 90, borderRadius: 8, border: "1px solid #e2e8f0",
    background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", flexShrink: 0,
  },
  previewImg: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" },
  previewEmpty: { fontSize: 11, color: "#94a3b8" },
  uploadBtn: {
    display: "inline-flex", alignItems: "center", gap: 6, background: "#f1f5f9",
    border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px", fontSize: 13,
    color: "#475569", cursor: "pointer", fontWeight: 600,
  },
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 18px",
    borderTop: "1px solid #e2e8f0",
  },
  cancelBtn: {
    background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 14px",
    fontSize: 13.5, color: "#475569", cursor: "pointer", fontWeight: 600,
  },
  saveBtn: {
    background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px",
    fontSize: 13.5, cursor: "pointer", fontWeight: 600,
  },
};
