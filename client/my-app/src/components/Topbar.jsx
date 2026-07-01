import React from "react";
import { Activity, LogOut } from "lucide-react";
import { styles } from "./styles";
import { TopStat } from "./ui";

export default function Topbar({ products, auth, stats }) {
  const s = stats || { inspectedToday: 0, errorRate: 0 };

  return (
    <header style={styles.topbar}>
      <div style={styles.brand}>
        <div style={styles.brandMark}>
          <Activity size={18} strokeWidth={2.4} />
        </div>
        <div>
          <div style={styles.brandName}>PolyInspect</div>
          <div style={styles.brandSub}>Control vizual asamblare · Industry 4.0</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={styles.topStats}>
          <TopStat label="Produse cu cameră" value={products.filter((p) => p.hasCamera).length} />
          <TopStat label="Inspectate azi" value={s.inspectedToday} />
          <TopStat label="Rată eroare medie" value={`${s.errorRate}%`} />
        </div>

        {auth && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 16,
            borderLeft: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 12.5, color: "#64748b", maxWidth: 160,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {auth.email}
            </span>
            <button
              onClick={auth.signOut}
              title="Deconectare"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff",
                border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 11px",
                fontSize: 12.5, color: "#475569", cursor: "pointer", fontWeight: 600 }}
            >
              <LogOut size={14} /> Ieșire
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
