import React from "react";
import { Camera, Circle, Layers, Cpu, ImageOff, Pencil } from "lucide-react";
import { styles } from "./styles";
import { SectionTitle } from "./ui";

export default function ProductList({ products, activeProductId, onSelect, onEditProduct }) {
  return (
    <aside style={styles.colLeft}>
      <SectionTitle icon={<Layers size={15} />}>Produse</SectionTitle>
      <div style={styles.productList}>
        {products.map((p) => {
          const active = p.id === activeProductId;
          return (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              role="button"
              tabIndex={0}
              className="prod-btn"
              style={{
                ...styles.productBtn,
                ...(active ? styles.productBtnActive : {}),
                cursor: "pointer",
              }}
            >
              <span style={{ ...styles.productBtnHead, justifyContent: "space-between" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <Circle
                    size={9}
                    fill={p.hasCamera ? "#16a34a" : "#cbd5e1"}
                    color={p.hasCamera ? "#16a34a" : "#cbd5e1"}
                  />
                  <span style={styles.productName}>{p.name}</span>
                </span>
                <button
                  style={styles.editBtn}
                  title="Editează produsul"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProduct && onEditProduct(p);
                  }}
                >
                  <Pencil size={12} />
                </button>
              </span>
              <span style={styles.productCode}>{p.code}</span>
              <span style={styles.rowTags}>
                <span style={styles.modelTag}>
                  <Cpu size={11} /> {p.model}
                </span>
                <span style={p.hasCamera ? styles.camTag : styles.noCamTag}>
                  {p.hasCamera ? <Camera size={11} /> : <ImageOff size={11} />}
                  {p.hasCamera ? "Cameră" : "Fără cameră"}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
