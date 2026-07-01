import React from "react";
import { CheckCircle2, Cpu, Layers, Pencil } from "lucide-react";
import { styles } from "./styles";
import { SectionTitle } from "./ui";

// Imaginea de referinta a ansamblului corect. Editarea (poza + numar piese) se
// face dintr-un singur buton care deschide dialogul centrat.
// Numele si codul se editeaza din lista de produse (stanga).
export default function ReferenceCard({ product, onEdit }) {
  return (
    <div style={styles.refCard}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionTitle icon={<CheckCircle2 size={15} />}>Referință ansamblu corect</SectionTitle>
        <button style={styles.editBtn} title="Editează ansamblul" onClick={onEdit}>
          <Pencil size={12} />
        </button>
      </div>
      <div style={styles.refBody}>
        <div style={imgBox(260, 180)}>
          {product.referenceImg ? (
            <img src={product.referenceImg} alt="Referință" style={imgFill} />
          ) : (
            <span style={{ fontSize: 12, color: "#94a3b8" }}>fără imagine</span>
          )}
        </div>
        <div style={styles.refInfo}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{product.name}</div>
          <div style={styles.refCode}>{product.code}</div>
          <p style={styles.refDesc}>
            Imaginea de referință pentru ansamblul corect. Sistemul compară fiecare piesă
            detectată cu această configurație.
          </p>
          <div style={styles.refMeta}>
            <span><Cpu size={12} /> {product.model}</span>
            <span><Layers size={12} /> {product.parts.length} piese</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const imgBox = (w, h) => ({
  width: w, height: h, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc",
  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
});
const imgFill = { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" };
