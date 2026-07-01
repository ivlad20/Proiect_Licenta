import React from "react";
import { ImageOff } from "lucide-react";
import { styles } from "./styles";
import { MiniStat, UploadButton } from "./ui";

// Produse fara camera: in loc de feed live se incarca o poza de verificat.
export default function UploadCheckCard({ product, onUpload }) {
  return (
    <div style={styles.feedCard}>
      <div style={styles.feedHeader}>
        <div style={styles.feedHeaderLeft}>
          <span style={styles.noCamBadge}>
            <ImageOff size={12} /> Fără cameră
          </span>
          <span style={styles.feedTitle}>{product.name}</span>
          <span style={styles.feedProd}>· verificare din poză</span>
        </div>
      </div>
      <div style={styles.feedViewport}>
        {product.checkImg ? (
          <img src={product.checkImg} alt="Poză de verificat" style={styles.feedImg} />
        ) : (
          <UploadButton large onUpload={onUpload} label="Încarcă o poză pentru verificare" />
        )}
      </div>
      {product.checkImg && (
        <div style={styles.feedFooter}>
          <UploadButton onUpload={onUpload} label="Înlocuiește poza" />
          <div style={styles.feedMetrics}>
            <MiniStat label="Stare" value="Gata de analiză" accent="#2563eb" />
          </div>
        </div>
      )}
    </div>
  );
}
