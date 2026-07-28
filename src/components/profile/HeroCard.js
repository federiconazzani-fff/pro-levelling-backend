import React from 'react';

export default function HeroCard({ profile, stage, performance }) {
  if (!profile) return null;

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim().toUpperCase() || "GIOCATORE";
  
  // Real data passed down
  const streak = performance?.streak || 0; 
  const totalHours = performance?.totalHours || 0;
  
  // Calculate overall for the yellow box
  const atletica = performance?.atletica || {};
  const tecnica = performance?.tecnica || {};
  const allStats = [
    atletica.velocita || 0, atletica.agilita || 0, atletica.coordinazione || 0, atletica.cambi_direzione || 0, atletica.pliometria || 0,
    tecnica.primo_tocco || 0, tecnica.passaggio || 0, tecnica.dribbling || 0, tecnica.tiro || 0, tecnica.controllo_palla || 0
  ];
  const overall = allStats.length > 0 ? Math.round(allStats.reduce((sum, val) => sum + val, 0) / allStats.length) : 0;

  return (
    <div style={{ width: "100%", maxWidth: "340px", aspectRatio: "0.65", position: "relative" }}>
      
      {/* Main Card Container */}
      <div style={{
        width: "100%",
        height: "100%",
        borderRadius: "24px",
        background: "#5c6bfa", // Base blue color
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
      }}>
        
        {/* Striped Background Pattern */}
        <div style={{
          position: "absolute",
          top: 0, right: 0, bottom: 0, left: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(255,255,255,0.1) 15px, rgba(255,255,255,0.1) 17px)",
          opacity: 0.6,
          zIndex: 0
        }} />

        {/* Player Image Placeholder (if no photo, show a generic silhouette or just the blue bg) */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: 0,
          right: 0,
          bottom: "15%",
          background: profile.profilePhoto ? `url(${profile.profilePhoto})` : "linear-gradient(to top, rgba(92, 107, 250, 1), transparent)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 1
        }} />

        {/* Top Bar (Lega) */}
        <div style={{ position: "absolute", top: "20px", left: "20px", right: "20px", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ width: "40px", height: "20px", border: "2px solid #fff", borderRadius: "10px 10px 4px 4px", borderBottom: "none", marginBottom: "4px" }} />
            <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: "800", letterSpacing: "0.1em" }}>LEGA #{stage}</span>
          </div>
        </div>

        {/* Top Right Stats */}
        <div style={{ position: "absolute", top: "80px", right: "20px", display: "flex", flexDirection: "column", alignItems: "flex-end", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#111" }}>{streak}</span>
            <span style={{ fontSize: "1.2rem" }}>🔥</span>
          </div>
          <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#111", letterSpacing: "0.1em", marginTop: "-4px" }}>STREAK</span>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "16px" }}>
            <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#111" }}>{totalHours}</span>
            <div style={{ width: "8px", height: "12px", background: "#111", borderRadius: "50% 50% 0 0" }}></div>
          </div>
          <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#111", letterSpacing: "0.1em", marginTop: "-4px" }}>ORE TOTALI</span>
        </div>

        {/* Left Vertical Name */}
        <div style={{
          position: "absolute",
          bottom: "15%",
          left: 0,
          background: "#111",
          padding: "20px 8px",
          borderTopRightRadius: "8px",
          borderBottomRightRadius: "8px",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{ 
            color: "#fff", 
            fontSize: "1.2rem", 
            fontWeight: "900", 
            letterSpacing: "0.1em",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)"
          }}>
            {fullName}
          </span>
        </div>

        {/* Bottom Yellow Section */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "25%",
          background: "#dcf536", // Neon Yellow
          clipPath: "polygon(0 40%, 40% 0, 100% 0, 100% 100%, 0 100%)",
          zIndex: 3,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-end",
          padding: "20px"
        }}>
          
          {/* Logo bottom left inside yellow */}
          <div style={{ position: "absolute", bottom: "20px", left: "20px", display: "flex", gap: "4px" }}>
             <div style={{ width: "12px", height: "12px", background: "#111", borderRadius: "50% 50% 0 0" }}></div>
             <div style={{ width: "12px", height: "12px", background: "#111", borderRadius: "50% 50% 0 0" }}></div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#111", letterSpacing: "0.1em" }}>OVERALL SCORE</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: "900", color: "#111", lineHeight: "1" }}>{overall}</span>
              <div style={{ width: "14px", height: "14px", background: "#111", borderRadius: "50%" }}>
                <div style={{ width: "6px", height: "6px", background: "#dcf536", borderRadius: "50%", margin: "4px" }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
