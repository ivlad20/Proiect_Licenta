import React, { useState, useRef, useEffect } from "react";
import { Upload, Pencil, Check } from "lucide-react";
import { styles } from "./styles";

export function TopStat({ label, value }) {
  return (
    <div style={styles.topStat}>
      <div style={styles.topStatValue}>{value}</div>
      <div style={styles.topStatLabel}>{label}</div>
    </div>
  );
}

export function SectionTitle({ icon, children }) {
  return (
    <div style={styles.sectionTitle}>
      <span style={styles.sectionIcon}>{icon}</span>
      {children}
    </div>
  );
}

export function MiniStat({ label, value, accent = "#0f172a" }) {
  return (
    <div style={styles.miniStat}>
      <div style={{ ...styles.miniStatValue, color: accent }}>{value}</div>
      <div style={styles.miniStatLabel}>{label}</div>
    </div>
  );
}

export function SliderRow({ label, value, suffix, onChange, disabled }) {
  return (
    <div style={{ ...styles.sliderRow, opacity: disabled ? 0.45 : 1 }}>
      <div style={styles.sliderHead}>
        <span style={styles.settingLabel}>{label}</span>
        <span style={styles.sliderVal}>{value}{suffix}</span>
      </div>
      <input type="range" min="0" max="100" value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))} style={styles.range} />
    </div>
  );
}

// Buton de upload care converteste fisierul in data URL.
export function UploadButton({ onUpload, label, large }) {
  const inputRef = useRef(null);
  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result, file);
    reader.readAsDataURL(file);
  };
  return (
    <>
      <button
        onClick={() => inputRef.current.click()}
        className="upload-btn"
        style={large ? styles.uploadLarge : styles.uploadSmall}
      >
        <Upload size={large ? 26 : 14} />
        <span>{label}</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
    </>
  );
}

// Slot de imagine: arata poza sau un buton de incarcare; permite inlocuirea.
export function ImageSlot({ src, label, width, height, small, onUpload }) {
  const inputRef = useRef(null);
  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result, file);
    reader.readAsDataURL(file);
  };
  return (
    <div
      style={{
        ...styles.imageSlot,
        width: width || "100%",
        height: height || 160,
        ...(small ? { borderRadius: 8 } : {}),
      }}
    >
      {src ? (
        <>
          <img src={src} alt={label} style={styles.slotImg} />
          <button className="slot-edit" style={styles.slotEdit} onClick={() => inputRef.current.click()}>
            <Pencil size={13} />
          </button>
        </>
      ) : (
        <button className="slot-empty" style={styles.slotEmpty} onClick={() => inputRef.current.click()}>
          <Upload size={small ? 16 : 22} />
          <span style={{ fontSize: small ? 10.5 : 12.5 }}>{label}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
    </div>
  );
}

// Nume editabil inline (hover -> creion -> Enter/bifa pentru salvare).
export function EditableName({ value, onChange, big, textStyle }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const save = () => {
    onChange(draft.trim() || value);
    setEditing(false);
  };

  if (editing) {
    return (
      <span style={styles.editWrap}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          style={{ ...styles.editInput, fontSize: big ? 16 : 12.5, fontWeight: big ? 700 : 600 }}
        />
        <button style={styles.editSave} onClick={save}><Check size={14} /></button>
      </span>
    );
  }
  return (
    <span style={styles.nameWrap} className="name-wrap">
      <span style={textStyle || { fontWeight: big ? 700 : 600, fontSize: big ? 16 : 12.5 }}>{value}</span>
      <button className="name-edit" style={styles.nameEdit} onClick={() => setEditing(true)}>
        <Pencil size={11} />
      </button>
    </span>
  );
}
