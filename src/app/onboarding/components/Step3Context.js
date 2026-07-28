import { haptic } from "@/utils/haptics";
import FootballPitchSelector from "./FootballPitchSelector";

export default function Step3Context({ formData, updateFormData }) {
  const levels = ["Amateur", "Amateur Pro", "Youth Academy", "Semi-Pro", "Professional", "Pro"];
  const roles = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];

  return (
    <div className="page-wrapper">
      <div className="h-stack" style={{ marginBottom: "12px" }}>
        <div style={{ width: "24px", height: "4px", background: "var(--primary)" }}></div>
        <span style={{ fontSize: "0.8rem", fontWeight: "900", letterSpacing: "0.1em", textTransform: "uppercase" }}>Step 3 of 6</span>
      </div>

      <h2 style={{ fontSize: "3rem", lineHeight: "1", fontWeight: "900", marginBottom: "16px" }}>
        FOOTBALL <span className="brush-highlight">CONTEXT</span>
      </h2>
      <p style={{ marginBottom: "40px", fontSize: "1.05rem", color: "var(--gray-dim)", lineHeight: "1.5" }}>
        Where do you play? This calibrates the app's performance standards.
      </p>

      {/* Level Selector — Dropdown as requested */}
      <div className="form-group">
        <label style={{ fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.85rem" }}>Current Level</label>
        <select 
          className="input-dark"
          style={{ appearance: "none", cursor: "pointer" }}
          value={formData.level}
          onChange={(e) => { updateFormData({ level: e.target.value }); haptic.medium(); }}
        >
          {levels.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Role Selector */}
      <div className="form-group" style={{ marginTop: "40px" }}>
        <label style={{ fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.85rem", marginBottom: "16px", display: "block" }}>
          In quale posizione giochi?
        </label>
        <p style={{ fontSize: "0.85rem", color: "var(--gray-dim)", marginBottom: "24px" }}>
          Seleziona la tua posizione in modo da poter personalizzare il tuo allenamento in base alle tue esigenze.
        </p>
        <FootballPitchSelector 
          selectedRole={formData.role} 
          onSelectRole={(role) => updateFormData({ role })} 
        />
      </div>

      <div className="form-group" style={{ marginTop: "32px" }}>
        <label>Team Name</label>
        <input type="text" className="input-dark" placeholder="E.g. Real Madrid CF"
          value={formData.teamName} onChange={(e) => { updateFormData({ teamName: e.target.value }); haptic.light(); }} />
      </div>

      <div className="form-group" style={{ marginTop: "24px" }}>
        <label>Category / League</label>
        <input type="text" className="input-dark" placeholder="E.g. Under 17, Serie A"
          value={formData.category} onChange={(e) => { updateFormData({ category: e.target.value }); haptic.light(); }} />
      </div>

      {/* Context hint */}
      <div className="card-dark hover-lift" style={{ marginTop: "32px", background: "var(--surface)", border: "none", display: "flex", gap: "16px" }}>
        <span style={{ fontSize: "1.5rem" }}>🏟️</span>
        <p style={{ fontSize: "0.9rem", fontWeight: "600", lineHeight: "1.5" }}>
          <span style={{ color: "var(--primary)", fontWeight: "900" }}>PRO TIP:</span> Players who accurately set their level receive 40% more precise analytics benchmarks.
        </p>
      </div>
    </div>
  );
}
