import React from "react";
import { Sliders, Sun, ChevronRight } from "lucide-react";
import { styles } from "./styles";
import { SectionTitle, SliderRow } from "./ui";

// Panou de setari. Denumirile/functiile finale urmeaza a fi definite.
export default function SettingsPanel({
  autoLight, setAutoLight,
  lightIntensity, setLightIntensity,
  confidence, setConfidence,
}) {
  return (
    <aside style={styles.colRight}>
      <SectionTitle icon={<Sliders size={15} />}>Setări</SectionTitle>
      <p style={styles.settingsNote}>Denumirile și funcțiile finale urmează a fi definite.</p>

      <div style={styles.settingBlock}>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>
            <Sun size={14} /> Iluminare automată
          </span>
          <button
            onClick={() => setAutoLight((v) => !v)}
            style={{ ...styles.toggle, ...(autoLight ? styles.toggleOn : {}) }}
          >
            <span style={{ ...styles.toggleKnob, ...(autoLight ? styles.toggleKnobOn : {}) }} />
          </button>
        </div>
        <p style={styles.settingHint}>Reglează inelul de lumină pe baza senzorului ambiental.</p>
      </div>

      <div style={styles.settingBlock}>
        <SliderRow label="Intensitate lumină" value={lightIntensity} suffix="%" disabled={autoLight} onChange={setLightIntensity} />
        <SliderRow label="Prag încredere model" value={confidence} suffix="%" onChange={setConfidence} />
      </div>

      <div style={styles.settingBlock}>
        <div style={styles.placeholderSetting}><span>Setare viitoare</span><ChevronRight size={14} /></div>
        <div style={styles.placeholderSetting}><span>Setare viitoare</span><ChevronRight size={14} /></div>
      </div>
    </aside>
  );
}
