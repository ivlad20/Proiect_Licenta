import React, { useState, useEffect } from "react";
import { loadProducts } from "./data/loadProducts";
import { loadGlobalStats } from "./data/inspectionsApi";
import {
  uploadProductReference,
  uploadPartReference,
  updateProductFields,
  updatePartFields,
  addPart,
  deletePart,
} from "./data/productsApi";
import { styles, dashboardCss } from "./components/styles";
import Topbar from "./components/Topbar";
import ProductList from "./components/ProductList";
import CameraFeed from "./components/CameraFeed";
import UploadCheckCard from "./components/UploadCheckCard";
import ReferenceCard from "./components/ReferenceCard";
import PartsGrid from "./components/PartsGrid";
import DefectGallery from "./components/DefectGallery";
import SettingsPanel from "./components/SettingsPanel";
import EditModal from "./components/EditModal";

export default function App({ auth }) {
  const [products, setProducts] = useState([]);
  const [activeProductId, setActiveProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null); // { type, productId, partIdx }
  const [inspectionTick, setInspectionTick] = useState(0); // reimprospatare galerie defecte
  const [globalStats, setGlobalStats] = useState({ inspectedToday: 0, errorRate: 0 });

  const [autoLight, setAutoLight] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(72);
  const [confidence, setConfidence] = useState(85);

  // Citim produsele din Supabase la pornire.
  useEffect(() => {
    loadProducts().then((ps) => {
      setProducts(ps);
      if (ps.length) setActiveProductId(ps[0].id);
      setLoading(false);
    });
  }, []);

  // Statisticile globale din bara de sus, reimprospatate dupa fiecare inspectie.
  useEffect(() => {
    loadGlobalStats().then(setGlobalStats);
  }, [inspectionTick]);

  const product = products.find((p) => p.id === activeProductId);

  const updateProduct = (id, patch) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const updatePart = (productId, partIdx, patch) =>
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, parts: p.parts.map((pt, i) => (i === partIdx ? { ...pt, ...patch } : pt)) }
          : p
      )
    );

  // Ajusteaza numarul de piese: adauga piese noi (cod placeholder) sau le sterge
  // pe ultimele. Sincronizeaza si baza de date.
  const setPartsCount = (prod, newCount) => {
    const current = prod.parts;
    if (newCount === current.length) return;
    if (newCount > current.length) {
      const toAdd = newCount - current.length;
      const newParts = [];
      for (let i = 0; i < toAdd; i++) {
        const code = `nou-${Date.now()}-${i}`;
        const name = "Piesă nouă";
        newParts.push({ code, name, img: null });
        addPart(prod.id, code, name, current.length + i + 1);
      }
      updateProduct(prod.id, { parts: [...current, ...newParts] });
    } else {
      current.slice(newCount).forEach((pt) => deletePart(prod.id, pt.code));
      updateProduct(prod.id, { parts: current.slice(0, newCount) });
    }
  };

  // Salvarea din dialogul de editare, in functie de ce container a fost editat.
  const handleSave = (values) => {
    if (!edit) return;
    const ep = products.find((p) => p.id === edit.productId);
    if (!ep) return;

    if (edit.type === "product") {
      const fields = { name: values.name, code: values.code, model: values.model };
      updateProduct(ep.id, fields);
      updateProductFields(ep.id, fields);
    } else if (edit.type === "reference") {
      if (values.image && values.image.file) {
        updateProduct(ep.id, { referenceImg: values.image.dataUrl });
        uploadProductReference(ep.id, values.image.file);
      }
      const n = parseInt(values.parts, 10);
      if (!isNaN(n) && n >= 0 && n <= 50 && n !== ep.parts.length) setPartsCount(ep, n);
    } else if (edit.type === "part") {
      const part = ep.parts[edit.partIdx];
      if (!part) return;
      const oldCode = part.code;
      const patch = { code: values.code, name: values.name };
      if (values.image && values.image.file) patch.img = values.image.dataUrl;
      updatePart(ep.id, edit.partIdx, patch);
      updatePartFields(ep.id, oldCode, { code: values.code, name: values.name });
      if (values.image && values.image.file) {
        uploadPartReference(ep.id, values.code, values.image.file);
      }
    }
  };

  // Construieste titlul + campurile dialogului pentru containerul editat.
  const buildModal = () => {
    if (!edit) return null;
    const ep = products.find((p) => p.id === edit.productId);
    if (!ep) return null;

    if (edit.type === "product") {
      return {
        title: "Editează produsul",
        fields: [
          { key: "name", label: "Denumire produs", type: "text", value: ep.name },
          { key: "code", label: "Cod produs", type: "text", value: ep.code },
          { key: "model", label: "Model YOLO", type: "text", value: ep.model },
        ],
      };
    }
    if (edit.type === "reference") {
      return {
        title: "Editează ansamblul",
        fields: [
          { key: "image", label: "Poza ansamblului", type: "image", preview: ep.referenceImg },
          { key: "parts", label: "Număr de piese", type: "number", value: ep.parts.length },
        ],
      };
    }
    if (edit.type === "part") {
      const part = ep.parts[edit.partIdx];
      if (!part) return null;
      return {
        title: "Editează piesa",
        fields: [
          { key: "image", label: "Poza piesei", type: "image", preview: part.img },
          { key: "code", label: "Cod piesă", type: "text", value: part.code },
          { key: "name", label: "Denumire piesă", type: "text", value: part.name },
        ],
      };
    }
    return null;
  };

  const modal = buildModal();

  return (
    <div style={styles.page}>
      <style>{dashboardCss}</style>

      <Topbar products={products} auth={auth} stats={globalStats} />

      <div style={styles.grid} className="dash-grid">
        <ProductList
          products={products}
          activeProductId={activeProductId}
          onSelect={setActiveProductId}
          onEditProduct={(p) => setEdit({ type: "product", productId: p.id })}
        />

        <main style={styles.colCenter}>
          {loading ? (
            <div style={{ padding: 40, color: "#64748b" }}>Se încarcă produsele…</div>
          ) : !product ? (
            <div style={{ padding: 40, color: "#64748b" }}>
              Niciun produs în baza de date. Adaugă produse în Supabase (tabelul products).
            </div>
          ) : (
            <>
              {product.hasCamera ? (
                <CameraFeed
                  product={product}
                  onInspected={() => setInspectionTick((t) => t + 1)}
                />
              ) : (
                <UploadCheckCard
                  product={product}
                  onUpload={(img) => updateProduct(product.id, { checkImg: img })}
                />
              )}

              <ReferenceCard
                product={product}
                onEdit={() => setEdit({ type: "reference", productId: product.id })}
              />

              <PartsGrid
                product={product}
                onEditPart={(idx) =>
                  setEdit({ type: "part", productId: product.id, partIdx: idx })
                }
              />

              <DefectGallery product={product} refreshKey={inspectionTick} />
            </>
          )}
        </main>

        <SettingsPanel
          autoLight={autoLight}
          setAutoLight={setAutoLight}
          lightIntensity={lightIntensity}
          setLightIntensity={setLightIntensity}
          confidence={confidence}
          setConfidence={setConfidence}
        />
      </div>

      {modal && (
        <EditModal
          title={modal.title}
          fields={modal.fields}
          onClose={() => setEdit(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
