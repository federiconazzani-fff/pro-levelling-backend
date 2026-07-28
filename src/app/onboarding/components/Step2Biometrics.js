import { haptic } from "@/utils/haptics";

export default function Step2Biometrics({ formData, updateFormData }) {
  const calculateBMI = () => {
    if (!formData.weight || !formData.height) return 0;
    const h = formData.height / 100;
    return (formData.weight / (h * h)).toFixed(1);
  };

  const bmi = calculateBMI();
  const getBMILabel = (b) => {
    if (b <= 0) return { label: "--", color: "var(--gray-dim)" };
    if (b < 18.5) return { label: "UNDERWEIGHT", color: "#3b82f6" };
    if (b < 25) return { label: "OPTIMAL ✓", color: "#22c55e" };
    if (b < 30) return { label: "OVERWEIGHT", color: "#f5900bff" };
    return { label: "HIGH", color: "var(--primary)" };
  };
  const bmiInfo = getBMILabel(parseFloat(bmi));

  return (
    <div className="page-wrapper">
      <div className="h-stack" style={{ marginBottom: "12px" }}>
        <div style={{ width: "24px", height: "4px", background: "var(--primary)" }}></div>
        <span style={{ fontSize: "0.8rem", fontWeight: "900", letterSpacing: "0.1em", textTransform: "uppercase" }}>Physical Profile</span>
      </div>

      <h2 style={{ fontSize: "3rem", lineHeight: "1", fontWeight: "900", marginBottom: "16px" }}>
        BIOMETRIC <span className="brush-highlight">DATA</span>
      </h2>
      <p style={{ marginBottom: "40px", fontSize: "1.05rem", color: "var(--gray-dim)", lineHeight: "1.5" }}>
        Crucial for performance tracking, load management, and hydration targets.
      </p>

      {/* Two big inputs side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontWeight: "900", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Height</label>
          <div style={{ position: "relative" }}>
            <input
              type="number" className="input-dark"
              placeholder="180"
              style={{ fontSize: "2.8rem", height: "100px", textAlign: "center", fontWeight: "900", border: "2px solid var(--surface-light)", paddingBottom: "20px" }}
              value={formData.height}
              onChange={(e) => { updateFormData({ height: e.target.value }); haptic.light(); }}
            />
            <span style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", fontSize: "0.75rem", fontWeight: "700", color: "var(--gray-dim)", textTransform: "uppercase" }}>cm</span>
          </div>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontWeight: "900", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Weight</label>
          <div style={{ position: "relative" }}>
            <input
              type="number" className="input-dark"
              placeholder="75"
              style={{ fontSize: "2.8rem", height: "100px", textAlign: "center", fontWeight: "900", border: "2px solid var(--surface-light)", paddingBottom: "20px" }}
              value={formData.weight}
              onChange={(e) => { updateFormData({ weight: e.target.value }); haptic.light(); }}
            />
            <span style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", fontSize: "0.75rem", fontWeight: "700", color: "var(--gray-dim)", textTransform: "uppercase" }}>kg</span>
          </div>
        </div>
      </div>

      {/* Live BMI Card */}
      <div className="card-dark anim-spring-pop" key={bmi} style={{ textAlign: "center", border: `2px solid ${bmiInfo.color}`, background: "#fff", transition: "border-color 0.4s ease" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: "900", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gray-dim)", marginBottom: "8px" }}>Est. BMI Index</p>
        <div style={{ fontSize: "4rem", fontWeight: "900", fontFamily: "var(--font-heading)", color: bmiInfo.color, transition: "color 0.4s ease", lineHeight: "1" }}>
          {bmi > 0 ? bmi : "—"}
        </div>
        <div style={{ height: "4px", background: bmiInfo.color, width: "48px", margin: "12px auto", borderRadius: "2px", transition: "background 0.4s ease" }}></div>
        <p style={{ fontSize: "0.85rem", fontWeight: "800", color: bmiInfo.color }}>{bmiInfo.label}</p>
        <p style={{ fontSize: "0.8rem", color: "var(--gray-dim)", marginTop: "4px" }}>Athlete optimal range: 21.5 — 24.5</p>
      </div>

      {/* Future Hydration Context */}
      <div className="card-dark hover-lift" style={{ marginTop: "24px", background: "var(--surface-light)", border: "none", display: "flex", gap: "16px", alignItems: "center" }}>
        <span style={{ fontSize: "1.5rem" }}>💧</span>
        <div>
          <p style={{ fontSize: "0.85rem", fontWeight: "800", textTransform: "uppercase", color: "var(--primary)" }}>Hydration Tracking</p>
          <p style={{ fontSize: "0.8rem", color: "var(--gray-dim)", lineHeight: "1.4" }}>
            Your weight ({formData.weight || "--"} kg) will be cross-referenced with GPS distance and intensity to estimate liquid loss and recommend recovery intake.
          </p>
        </div>
      </div>
    </div>
  );
}
