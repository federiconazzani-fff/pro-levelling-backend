import { haptic } from "@/utils/haptics";

export default function Step5Psychology({ formData, updateFormData }) {
  const techniqueSkills = [
    "Box Shooting", "Long Range Shooting", "Free Kicks", "Volleys", 
    "Headers", "Open Space Dribbling", "Tight Space Dribbling", 
    "Short Passing", "Through Balls", "Long Balls", 
    "Aerial Control", "Ground Control", "Cross", "Ball Control"
  ];

  const athleticSkills = [
    "Top Speed", "Change of Direction", "Agility", "Coordination", 
    "Endurance", "Acceleration", "Quickness"
  ];

  const toggleSkill = (skill) => {
    let newSkills = [...formData.skills];
    if (newSkills.includes(skill)) {
      newSkills = newSkills.filter(s => s !== skill);
      haptic.light();
    } else {
      newSkills.push(skill);
      haptic.medium();
    }
    updateFormData({ skills: newSkills });
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: "40px" }}>
      <h2 style={{ fontSize: "3rem", lineHeight: "1", fontWeight: "900", marginBottom: "16px" }}>
        SKILL <span className="brush-highlight">PROFILE</span>
      </h2>
      <p className="text-dim" style={{ marginTop: "12px", marginBottom: "32px" }}>
        Define your technical and athletic identity.
      </p>

      <div className="form-group">
        <label>Football Idol / Inspiration</label>
        <input 
          type="text" 
          className="input-dark" 
          placeholder="E.g. Messi, Pirlo, Mbappe..."
          value={formData.idol}
          onChange={(e) => updateFormData({ idol: e.target.value })}
        />
      </div>

      {/* TECHNIQUE SECTION */}
      <div style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "4px solid #3b82f6", paddingBottom: "4px" }}>Technique</h3>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {techniqueSkills.map(skill => {
            const isActive = formData.skills.includes(skill);
            return (
              <div 
                key={skill}
                className={`pill-badge pseudo-haptic ${isActive ? "anim-spring-pop" : ""}`}
                onClick={() => toggleSkill(skill)}
                style={{ 
                  cursor: "pointer", 
                  border: isActive ? "none" : "1px solid #ddd",
                  background: isActive ? "#3b82f6" : "var(--surface)",
                  color: isActive ? "#fff" : "inherit"
                }}
              >
                {skill}
              </div>
            );
          })}
        </div>
      </div>

      {/* ATHLETIC SECTION */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "4px solid var(--primary)", paddingBottom: "4px" }}>Athletics</h3>
          <span className="brush-red-text" style={{ fontSize: "0.9rem", fontWeight: "700" }}>{formData.skills.length} selected</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {athleticSkills.map(skill => {
            const isActive = formData.skills.includes(skill);
            return (
              <div 
                key={skill}
                className={`pill-badge pseudo-haptic ${isActive ? "anim-spring-pop" : ""}`}
                onClick={() => toggleSkill(skill)}
                style={{ 
                  cursor: "pointer", 
                  border: isActive ? "none" : "2px solid #ddd",
                  background: isActive ? "var(--primary)" : "transparent",
                  color: isActive ? "#fff" : "inherit",
                  padding: "10px 20px",
                  fontSize: "0.85rem",
                  fontWeight: "800"
                }}
              >
                {skill}
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
}
