import { User, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IdentityHeader({ profile }) {
  const router = useRouter();
  if (!profile) return null;

  const calculateAge = (dateString) => {
    if (!dateString) return "--";
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const calculateBMI = () => {
    if (!profile.weight || !profile.height) return "--";
    const h = profile.height / 100;
    return (profile.weight / (h * h)).toFixed(1);
  };

  const age = calculateAge(profile.birthDate);
  const bmi = calculateBMI();

  return (
    <div className="v-stack" style={{ gap: "24px", position: "relative" }}>
      {/* 1. Anagrafica Base e Identità Visiva */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ 
            width: "90px", height: "90px", borderRadius: "50%", 
            background: "var(--surface-light)", display: "flex", alignItems: "center", justifyContent: "center", 
            overflow: "hidden", border: "2px solid #111" 
          }}>
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <User size={45} color="var(--gray-dim)" />
            )}
          </div>
          <div className="v-stack" style={{ gap: "4px", flex: 1 }}>
            <h1 style={{ fontSize: "2.2rem", fontWeight: "900", letterSpacing: "-0.02em", lineHeight: "1", textTransform: "uppercase" }}>
              {profile.firstName} <br/> <span className="brush-highlight">{profile.lastName}</span>
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--gray-dim)", fontWeight: "600", marginTop: "4px" }}>{profile.email}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if(window.haptic) window.haptic.medium();
            router.push("/onboarding");
          }}
          className="btn-secondary pseudo-haptic hover-lift"
          style={{ 
            width: "44px", height: "44px", borderRadius: "50%", padding: 0, 
            display: "flex", alignItems: "center", justifyContent: "center", 
            background: "#fff", border: "2px solid #111", boxShadow: "2px 2px 0px #111" 
          }}
          title="Modifica Profilo"
        >
          <Edit2 size={18} color="#111" strokeWidth={2.5} />
        </button>
      </div>

      {/* 2. Dati Personali e Biometrici */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <div className="card-dark" style={{ padding: "16px 12px", textAlign: "center" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)", letterSpacing: "0.05em" }}>Age</p>
          <p style={{ fontSize: "1.4rem", fontWeight: "900", marginTop: "4px" }}>{age}</p>
        </div>
        <div className="card-dark" style={{ padding: "16px 12px", textAlign: "center" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)", letterSpacing: "0.05em" }}>Physique</p>
          <p style={{ fontSize: "1.1rem", fontWeight: "900", marginTop: "4px", lineHeight: "1" }}>{profile.height}<span style={{ fontSize: "0.7rem" }}>cm</span></p>
          <p style={{ fontSize: "1.1rem", fontWeight: "900", lineHeight: "1" }}>{profile.weight}<span style={{ fontSize: "0.7rem" }}>kg</span></p>
        </div>
        <div className="card-dark" style={{ padding: "16px 12px", textAlign: "center" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)", letterSpacing: "0.05em" }}>BMI</p>
          <p style={{ fontSize: "1.4rem", fontWeight: "900", marginTop: "4px", color: bmi !== "--" && bmi > 25 ? "var(--primary)" : "#111" }}>{bmi}</p>
        </div>
      </div>

      {/* 3. Contesto Sportivo e Profilo Psicologico */}
      <div className="card-dark" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--surface-light)", paddingBottom: "12px" }}>
          <div className="v-stack" style={{ gap: "4px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>Team</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "900" }}>{profile.teamName || "Free Agent"}</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--gray-dim)" }}>{profile.category}</span>
          </div>
          <div className="v-stack" style={{ gap: "4px", alignItems: "flex-end", textAlign: "right" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>Status</span>
            <span className="pill-badge" style={{ background: "#111", color: "#fff", padding: "4px 10px", fontSize: "0.7rem", marginTop: "2px" }}>{profile.level}</span>
            <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "var(--primary)", marginTop: "4px" }}>Role: {profile.role}</span>
          </div>
        </div>

        <div className="v-stack" style={{ gap: "12px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Idol / Inspiration</span>
            <span style={{ fontSize: "1rem", fontWeight: "800" }}>{profile.idol || "None"}</span>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Strengths</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(profile.skills || []).map((s, idx) => (
                <span key={`${s}-${idx}`} style={{ background: "var(--surface-light)", fontSize: "0.75rem", fontWeight: "700", padding: "4px 10px", borderRadius: "12px" }}>
                  {s}
                </span>
              ))}
              {(!profile.skills || profile.skills.length === 0) && (
                <span style={{ fontSize: "0.8rem", color: "var(--gray-dim)" }}>Not specified</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
