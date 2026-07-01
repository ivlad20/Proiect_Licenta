import React, { useEffect, useState } from "react";
import { ImageOff, AlertTriangle, ZoomIn, X } from "lucide-react";
import { loadDefectScans } from "../data/inspectionsApi";

// Galerie cu pozele produselor neconforme salvate in Storage, pentru produsul activ.
// Se reincarca la schimbarea produsului si dupa fiecare inspectie noua (refreshKey).
export default function DefectGallery({ product, refreshKey }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(null); // scanul deschis in popup (sau null)

  // Inchide popup-ul cu tasta Escape.
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key === "Escape") setZoom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadDefectScans(product.id).then((s) => {
      if (!alive) return;
      setScans(s);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [product.id, refreshKey]);

  const card = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  };

  return (
    <section style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <AlertTriangle size={16} color="#ea580c" />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
          Produse neconforme salvate
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 600,
            color: "#64748b",
          }}
        >
          {scans.length} {scans.length === 1 ? "imagine" : "imagini"}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 24, color: "#94a3b8", fontSize: 13 }}>Se încarcă…</div>
      ) : scans.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 24,
            color: "#94a3b8",
            fontSize: 13,
          }}
        >
          <ImageOff size={18} /> Nicio poză cu defect salvată pentru acest produs.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {scans.map((s) => (
            <figure key={s.id} style={{ margin: 0 }}>
              <div style={{ position: "relative" }}>
                <img
                  src={s.img}
                  alt="Produs neconform"
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid #fecaca",
                    display: "block",
                  }}
                />
                <button
                  onClick={() => setZoom(s)}
                  title="Mărește imaginea"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    display: "grid",
                    placeItems: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    color: "#fff",
                    background: "rgba(15,23,42,0.6)",
                  }}
                >
                  <ZoomIn size={16} />
                </button>
              </div>
              <figcaption
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "#64748b",
                  lineHeight: 1.4,
                }}
              >
                {new Date(s.scannedAt).toLocaleString("ro-RO")}
                <br />
                <span style={{ color: "#dc2626", fontWeight: 600 }}>
                  rată defecte {s.defectRate}%
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* Popup centrat cu poza marita */}
      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15,23,42,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 14,
              padding: 12,
              maxWidth: "90vw",
              maxHeight: "90vh",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <button
              onClick={() => setZoom(null)}
              title="Închide"
              style={{
                position: "absolute",
                top: -14,
                right: -14,
                display: "grid",
                placeItems: "center",
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                color: "#fff",
                background: "#0f172a",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }}
            >
              <X size={18} />
            </button>
            <img
              src={zoom.img}
              alt="Produs neconform mărit"
              style={{
                display: "block",
                maxWidth: "86vw",
                maxHeight: "80vh",
                borderRadius: 8,
                objectFit: "contain",
              }}
            />
            <div
              style={{
                marginTop: 8,
                fontSize: 12.5,
                color: "#64748b",
                textAlign: "center",
              }}
            >
              {new Date(zoom.scannedAt).toLocaleString("ro-RO")} ·{" "}
              <span style={{ color: "#dc2626", fontWeight: 600 }}>
                rată defecte {zoom.defectRate}%
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
