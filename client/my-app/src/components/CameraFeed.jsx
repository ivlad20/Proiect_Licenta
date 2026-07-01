import React, { useState, useRef, useEffect } from "react";
import {
  Circle,
  Maximize2,
  Plug,
  PlugZap,
  ScanLine,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { styles, WS_BASE } from "./styles";
import { MiniStat } from "./ui";
import { runInspection } from "../data/inspectApi";
import { loadInspectionStats } from "../data/inspectionsApi";

// Cat timp fara niciun frame nou pana consideram ca nu mai e semnal.
const FRAME_TIMEOUT_MS = 2000;

// ROI: latura patratului = ROI_FRAC x latura scurta a cadrului, centrat.
// IMPORTANT: tine aceeasi valoare ca in LabVIEW (IMAQ Extract), ca dreptunghiul
// de pe dashboard sa corespunda exact cu zona trimisa la model.
const ROI_FRAC = 0.6;

// Flux live de la camera prin WebSocket: ws://localhost:8765/<product_id>
// Optimizare: cadrele NU trec prin state React (ar declansa un re-render per cadru).
// Le scriem direct in elementul <img> printr-un ref. Doar starea (connecting/live/
// error), care se schimba rar, trece prin state.
export default function CameraFeed({ product, onInspected }) {
  const [status, setStatus] = useState("connecting"); // connecting | live | error
  const [imgAspect, setImgAspect] = useState(16 / 9); // raportul real al cadrului
  const [vp, setVp] = useState({ w: 0, h: 0 }); // dimensiunile reale ale viewport-ului
  const [inspecting, setInspecting] = useState(false); // inspectie in curs?
  const [result, setResult] = useState(null); // rezultatul ultimei inspectii
  const [inspectErr, setInspectErr] = useState(null); // eroare la inspectie
  // Statistici reale, citite din Supabase (tabelul inspections) pentru produsul activ.
  const [stats, setStats] = useState({ inspected: 0, passed: 0, failed: 0, errorRate: 0 });
  const viewportRef = useRef(null);
  const imgRef = useRef(null); // referinta la <img>, ca sa-i setam src direct
  const lastFrameRef = useRef(null); // ultimul cadru, pentru re-montarea imaginii
  const pendingRef = useRef(false); // avem deja o pictare programata pe urmatorul frame?
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const watchdogRef = useRef(null);
  const closedRef = useRef(false);

  useEffect(() => {
    closedRef.current = false;
    lastFrameRef.current = null;
    setStatus("connecting");

    const url = `${WS_BASE}/${product.id}`;

    // Watchdog: daca nu vine niciun frame in FRAME_TIMEOUT_MS -> fara semnal.
    const kickWatchdog = () => {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = setTimeout(() => {
        if (closedRef.current) return;
        setStatus("error");
      }, FRAME_TIMEOUT_MS);
    };

    const connect = () => {
      if (closedRef.current) return;

      let ws;
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleRetry();
        return;
      }
      wsRef.current = ws;

      ws.onmessage = (e) => {
        if (typeof e.data === "string" && e.data.startsWith("data:image")) {
          // Retinem ultimul cadru; NU trecem prin state (ar declansa re-render).
          lastFrameRef.current = e.data;
          // setStatus("live") declanseaza re-render doar prima data; React ignora
          // apelurile ulterioare pentru ca valoarea e identica.
          setStatus("live");
          kickWatchdog();
          // Coalescing: pictam cel mult un cadru per refresh de browser si sarim
          // complet cand tab-ul e ascuns -> browserul decodeaza mai putine JPEG-uri.
          if (!pendingRef.current && !document.hidden) {
            pendingRef.current = true;
            requestAnimationFrame(() => {
              pendingRef.current = false;
              const data = lastFrameRef.current;
              if (!imgRef.current || !data) return;
              // Plasa de siguranta: pe canalul de afisare trebuie sa vina doar
              // cadrul intreg (lat: 4:3 sau 16:9). Daca ajunge din greseala un
              // cadru ROI (aproape patrat), il ignoram, ca imaginea sa nu para
              // ca face "zoom" pe ROI. ROI-ul corect merge pe canalul "-roi".
              const probe = new Image();
              probe.onload = () => {
                const a = probe.naturalWidth / probe.naturalHeight;
                if (a > 0.85 && a < 1.18) return; // cadru patrat -> e ROI, il sarim
                if (imgRef.current) imgRef.current.src = data;
              };
              probe.src = data;
            });
          }
        } else {
          // Mesaj de eroare de la backend (ex. camera deconectata).
          try {
            const msg = JSON.parse(e.data);
            if (msg.error) setStatus("error");
          } catch {
            /* ignoram */
          }
        }
      };

      ws.onerror = () => {
        /* onclose va urma */
      };

      ws.onclose = () => {
        if (closedRef.current) return;
        setStatus("error");
        clearTimeout(watchdogRef.current);
        scheduleRetry();
      };
    };

    const scheduleRetry = () => {
      if (closedRef.current) return;
      clearTimeout(retryRef.current);
      retryRef.current = setTimeout(connect, 1500);
    };

    connect();

    return () => {
      closedRef.current = true;
      clearTimeout(retryRef.current);
      clearTimeout(watchdogRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [product.id]);

  // Masuram viewport-ul (fix) ca sa asezam ROI-ul peste zona REALA a imaginii.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setVp({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reincarca statisticile produsului din Supabase.
  const reloadStats = () => {
    loadInspectionStats(product.id).then(setStats);
  };

  // La schimbarea produsului, citim statisticile lui.
  useEffect(() => {
    let alive = true;
    loadInspectionStats(product.id).then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, [product.id]);

  // Apasarea butonului "Inspecteaza": gateway-ul ia ultimul ROI din feed_server,
  // ruleaza modelul si salveaza rezultatul. Nu trimitem imaginea din browser.
  const handleInspect = async () => {
    setInspecting(true);
    setInspectErr(null);
    try {
      const r = await runInspection(product.id);
      setResult(r);
      reloadStats(); // actualizam statisticile de sus
      if (onInspected) onInspected(r);
    } catch (e) {
      setInspectErr(e.message);
      setResult(null);
    } finally {
      setInspecting(false);
    }
  };

  const showFeed = status === "live";

  // Imaginea se afiseaza cu object-fit: contain intr-un viewport fix, deci poate
  // avea benzi negre. Calculam dreptunghiul real al imaginii si punem ROI-ul in el.
  let roiBox = null;
  if (vp.w && vp.h) {
    const vpAspect = vp.w / vp.h;
    let dispW, dispH, offX, offY;
    if (imgAspect > vpAspect) {
      dispW = vp.w;
      dispH = vp.w / imgAspect;
      offX = 0;
      offY = (vp.h - dispH) / 2;
    } else {
      dispH = vp.h;
      dispW = vp.h * imgAspect;
      offY = 0;
      offX = (vp.w - dispW) / 2;
    }
    const side = ROI_FRAC * Math.min(dispW, dispH); // patrat centrat
    roiBox = {
      left: offX + (dispW - side) / 2,
      top: offY + (dispH - side) / 2,
      size: side,
    };
  }

  return (
    <div style={styles.feedCard}>
      <div style={styles.feedHeader}>
        <div style={styles.feedHeaderLeft}>
          {showFeed ? (
            <span style={styles.liveBadge}>
              <Circle size={8} fill="#fff" color="#fff" /> LIVE
            </span>
          ) : (
            <span style={styles.connBadge}>
              {status === "connecting" ? <Plug size={12} /> : <PlugZap size={12} />}
              {status === "connecting" ? "Conectare…" : "Fără semnal"}
            </span>
          )}
          <span style={styles.feedTitle}>{product.name}</span>
          <span style={styles.feedProd}>· {WS_BASE}/{product.id}</span>
        </div>
        <button style={styles.iconBtn}><Maximize2 size={15} /></button>
      </div>

      <div ref={viewportRef} style={styles.feedViewport}>
        {showFeed ? (
          <>
            <img
              ref={(el) => {
                imgRef.current = el;
                if (el && lastFrameRef.current) el.src = lastFrameRef.current;
              }}
              alt="Flux cameră"
              style={styles.feedImg}
              onLoad={(e) => {
                const w = e.target.naturalWidth;
                const h = e.target.naturalHeight;
                if (w && h) setImgAspect(w / h);
              }}
            />
            {roiBox && (
              <div
                style={{
                  position: "absolute",
                  left: roiBox.left,
                  top: roiBox.top,
                  width: roiBox.size,
                  height: roiBox.size,
                  border: "2px dashed #38bdf8",
                  boxShadow: "0 0 0 9999px rgba(15,23,42,0.28)",
                  boxSizing: "border-box",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: -22,
                    left: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#38bdf8",
                    background: "rgba(15,23,42,0.7)",
                    padding: "1px 6px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  ROI -&gt; model
                </span>
              </div>
            )}
          </>
        ) : (
          <div style={styles.feedEmpty}>
            {status === "connecting" ? (
              <>
                <Plug size={30} />
                <span>Conectare la cameră…</span>
              </>
            ) : (
              <>
                <PlugZap size={30} />
                <span>Fără semnal. Pornește feed_server.py și sursa (LabVIEW sau labview_simulator.py).</span>
              </>
            )}
          </div>
        )}
      </div>

      <div style={styles.feedFooter}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={styles.feedMetrics}>
            <MiniStat label="Inspectate" value={stats.inspected} />
            <MiniStat label="Trecute" value={stats.passed} accent="#16a34a" />
            <MiniStat label="Respinse" value={stats.failed} accent="#dc2626" />
            <MiniStat label="Rată defecte" value={`${stats.errorRate}%`} accent="#ea580c" />
          </div>

          <button
            onClick={handleInspect}
            disabled={inspecting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: inspecting ? "default" : "pointer",
              fontWeight: 700,
              fontSize: 14,
              color: "#fff",
              background: inspecting ? "#64748b" : "#2563eb",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          >
            {inspecting ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <ScanLine size={16} />
            )}
            {inspecting ? "Se inspectează…" : "Inspectează"}
          </button>
        </div>

        {/* Rezultatul ultimei inspectii */}
        {inspectErr && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {inspectErr}
          </div>
        )}

        {result && !inspectErr && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 10,
              border: `1px solid ${result.passed ? "#bbf7d0" : "#fecaca"}`,
              background: result.passed ? "#f0fdf4" : "#fef2f2",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 800,
                fontSize: 15,
                color: result.passed ? "#15803d" : "#b91c1c",
              }}
            >
              {result.passed ? (
                <CheckCircle2 size={18} />
              ) : (
                <XCircle size={18} />
              )}
              {result.passed ? "Produs CONFORM" : "Produs NECONFORM"}
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                potrivire {result.match_score}% · rată defecte {result.defect_rate}%
                {result.mock_inference ? " · (mock)" : ""}
              </span>
            </div>

            {result.defects && result.defects.length > 0 && (
              <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13, color: "#334155" }}>
                {result.defects.map((d, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    <strong>
                      {d.defect_type === "missing" ? "Lipsă" : "Montaj greșit"}:
                    </strong>{" "}
                    {d.defect_name || d.part_code}
                    {d.confidence != null ? ` (${d.confidence}%)` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
