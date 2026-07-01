// Stiluri partajate de toate componentele dashboard-ului.
export const WS_BASE = "ws://localhost:8765";

// Gateway-ul de inspectie (butonul "Inspecteaza"). Configurabil din .env:
//   VITE_GATEWAY_URL=http://localhost:9000
export const GATEWAY_BASE =
  import.meta.env.VITE_GATEWAY_URL || "http://localhost:9000";

export const styles = {
  page: { minHeight: "100vh", background: "#f1f5f9", color: "#0f172a",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: 16, boxSizing: "border-box" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff",
    border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 20px", marginBottom: 16, flexWrap: "wrap", gap: 16 },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: { width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    color: "#fff", display: "grid", placeItems: "center" },
  brandName: { fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" },
  brandSub: { fontSize: 11.5, color: "#64748b", marginTop: 1 },
  topStats: { display: "flex", gap: 26 },
  topStat: { textAlign: "right" },
  topStatValue: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" },
  topStatLabel: { fontSize: 11, color: "#64748b", marginTop: 1 },

  grid: { display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: 16, alignItems: "start" },
  colLeft: { display: "flex", flexDirection: "column", gap: 10 },
  colCenter: { display: "flex", flexDirection: "column", gap: 16, minWidth: 0 },
  colRight: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16,
    display: "flex", flexDirection: "column", gap: 14 },

  sectionTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.06em", color: "#475569" },
  sectionIcon: { color: "#2563eb", display: "flex" },

  productList: { display: "flex", flexDirection: "column", gap: 8 },
  productBtn: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12,
    cursor: "pointer", display: "flex", flexDirection: "column", gap: 6, textAlign: "left", transition: "all .15s" },
  productBtnActive: { borderColor: "#2563eb", boxShadow: "0 0 0 3px rgba(37,99,235,0.12)" },
  productBtnHead: { display: "flex", alignItems: "center", gap: 8 },
  productName: { fontWeight: 600, fontSize: 13.5 },
  productCode: { fontSize: 11, color: "#94a3b8", fontFamily: "monospace" },
  rowTags: { display: "flex", gap: 6, flexWrap: "wrap" },
  modelTag: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#64748b",
    background: "#f1f5f9", padding: "2px 7px", borderRadius: 6 },
  camTag: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#16a34a",
    background: "#dcfce7", padding: "2px 7px", borderRadius: 6 },
  noCamTag: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#94a3b8",
    background: "#f1f5f9", padding: "2px 7px", borderRadius: 6 },

  feedCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" },
  feedHeader: { display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 16px", borderBottom: "1px solid #e2e8f0" },
  feedHeaderLeft: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  liveBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: "#dc2626", color: "#fff",
    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em" },
  connBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: "#f1f5f9", color: "#64748b",
    fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6 },
  noCamBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: "#f1f5f9", color: "#64748b",
    fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6 },
  feedTitle: { fontWeight: 600, fontSize: 14 },
  feedProd: { color: "#94a3b8", fontSize: 12, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  iconBtn: { width: 32, height: 32, display: "grid", placeItems: "center", background: "#f1f5f9",
    border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", color: "#475569" },
  feedViewport: { position: "relative", background: "#0f172a", aspectRatio: "16/9",
    display: "grid", placeItems: "center", overflow: "hidden" },
  feedImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    objectFit: "contain", display: "block" },
  feedEmpty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "#64748b",
    fontSize: 12.5, textAlign: "center", padding: 24, maxWidth: 420 },
  feedFooter: { display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px", gap: 16, flexWrap: "wrap" },
  feedMetrics: { display: "flex", gap: 22 },
  miniStat: { textAlign: "right" },
  miniStatValue: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" },
  miniStatLabel: { fontSize: 10.5, color: "#64748b", marginTop: 1 },

  refCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 },
  refBody: { display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" },
  refInfo: { flex: 1, minWidth: 200 },
  refCode: { fontFamily: "monospace", color: "#94a3b8", fontSize: 12, marginTop: 4 },
  refDesc: { fontSize: 13, color: "#475569", lineHeight: 1.5, marginTop: 10 },
  refMeta: { display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "#64748b" },

  partsCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 },
  partsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginTop: 12 },
  partCard: { border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, textAlign: "center", transition: "all .15s" },
  partCode: { fontFamily: "monospace", fontSize: 11, color: "#94a3b8", marginTop: 4 },

  imageSlot: { position: "relative", borderRadius: 10, overflow: "hidden", background: "#f1f5f9",
    border: "1px solid #e2e8f0" },
  slotImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  slotEdit: { position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 7,
    background: "rgba(255,255,255,0.92)", border: "1px solid #e2e8f0", display: "grid", placeItems: "center",
    cursor: "pointer", color: "#475569" },
  slotEmpty: { width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer",
    color: "#94a3b8", borderRadius: "inherit" },

  uploadLarge: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "#94a3b8",
    background: "transparent", border: "2px dashed #334155", borderRadius: 12, padding: "32px 40px",
    cursor: "pointer", fontSize: 13 },
  uploadSmall: { display: "inline-flex", alignItems: "center", gap: 7, color: "#2563eb",
    background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 12px",
    cursor: "pointer", fontSize: 12.5, fontWeight: 600 },

  nameWrap: { display: "inline-flex", alignItems: "center", gap: 6 },
  nameEdit: { width: 22, height: 22, borderRadius: 6, background: "#f1f5f9", border: "1px solid #cbd5e1",
    display: "grid", placeItems: "center", cursor: "pointer", color: "#475569", opacity: 0.7, transition: "opacity .12s" },
  editBtn: { width: 24, height: 24, borderRadius: 6, background: "#f1f5f9", border: "1px solid #cbd5e1",
    display: "grid", placeItems: "center", cursor: "pointer", color: "#475569", flexShrink: 0 },
  editWrap: { display: "inline-flex", alignItems: "center", gap: 6 },
  editInput: { border: "1px solid #2563eb", borderRadius: 7, padding: "4px 8px", outline: "none", maxWidth: 220 },
  editSave: { width: 28, height: 28, borderRadius: 7, background: "#2563eb", color: "#fff", border: "none",
    display: "grid", placeItems: "center", cursor: "pointer" },

  partName: { fontWeight: 600, fontSize: 12.5, marginTop: 8 },

  settingsNote: { fontSize: 11.5, color: "#94a3b8", fontStyle: "italic", margin: 0, lineHeight: 1.4 },
  settingBlock: { display: "flex", flexDirection: "column", gap: 10, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" },
  settingRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  settingLabel: { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color: "#334155" },
  settingHint: { fontSize: 11, color: "#94a3b8", margin: 0 },
  toggle: { width: 42, height: 24, borderRadius: 12, background: "#cbd5e1", border: "none", cursor: "pointer",
    position: "relative", transition: "background .15s", padding: 0 },
  toggleOn: { background: "#2563eb" },
  toggleKnob: { position: "absolute", top: 2, left: 2, width: 20, height: 20, borderRadius: "50%",
    background: "#fff", transition: "transform .15s" },
  toggleKnobOn: { transform: "translateX(18px)" },
  sliderRow: { display: "flex", flexDirection: "column", gap: 6 },
  sliderHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sliderVal: { fontSize: 12, fontWeight: 700, color: "#2563eb" },
  range: { width: "100%", accentColor: "#2563eb" },
  placeholderSetting: { display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 9,
    fontSize: 12.5, color: "#94a3b8" },
};

export const dashboardCss = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.9s linear infinite; }
  .prod-btn:hover { border-color: #cbd5e1; }
  .icon-btn:hover { background: #e2e8f0; }
  .part-card:hover { border-color: #2563eb; box-shadow: 0 2px 8px rgba(37,99,235,0.1); }
  .upload-btn:hover { filter: brightness(0.97); }
  .slot-empty:hover { color: #2563eb; background: #eff6ff; }
  .name-wrap:hover .name-edit { opacity: 1; }
  @media (max-width: 1100px) {
    .dash-grid { grid-template-columns: 1fr !important; }
  }
`;
