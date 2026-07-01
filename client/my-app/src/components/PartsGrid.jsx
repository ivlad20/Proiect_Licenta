import React from "react";
import { Layers, Pencil } from "lucide-react";
import { styles } from "./styles";
import { SectionTitle } from "./ui";

// Grila cu piesele din ansamblu. Fiecare container are un singur buton de
// editare care deschide dialogul centrat (poza + cod + denumire).
export default function PartsGrid({ product, onEditPart }) {
  return (
    <div style={styles.partsCard}>
      <SectionTitle icon={<Layers size={15} />}>
        Piese din ansamblu ({product.parts.length})
      </SectionTitle>
      <div style={styles.partsGrid}>
        {product.parts.map((part, idx) => (
          <div key={part.code} className="part-card" style={styles.partCard}>
            <div style={{ position: "relative" }}>
              <div style={imgBox}>
                {part.img ? (
                  <img src={part.img} alt={part.name} style={imgFill} />
                ) : (
                  <span style={{ fontSize: 10.5, color: "#94a3b8" }}>fără imagine</span>
                )}
              </div>
              <button
                style={{ ...styles.editBtn, position: "absolute", top: 6, right: 6 }}
                title="Editează piesa"
                onClick={() => onEditPart(idx)}
              >
                <Pencil size={12} />
              </button>
            </div>
            <div style={{ fontWeight: 600, fontSize: 12.5, marginTop: 6 }}>{part.name}</div>
            <div style={styles.partCode}>{part.code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const imgBox = {
  width: "100%", height: 110, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc",
  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
};
const imgFill = { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" };
