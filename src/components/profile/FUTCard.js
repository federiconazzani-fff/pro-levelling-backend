import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FUTCard({ profile, performance, hideLabel = false }) {
  const [statPage, setStatPage] = useState(0);

  if (!profile) return null;

  const initial = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : "U";
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim().toUpperCase();
  const role = profile.role || "ST";
  
  const atletica = performance?.atletica || {};
  const tecnica = performance?.tecnica || {};
  const gps = performance?.gps || {};

  const allStats = [
    { label: "VEL", val: Math.round(atletica.velocita || 0) },
    { label: "AGI", val: Math.round(atletica.agilita || 0) },
    { label: "COO", val: Math.round(atletica.coordinazione || 0) },
    { label: "CAM", val: Math.round(atletica.cambi_direzione || 0) },
    { label: "PLI", val: Math.round(atletica.pliometria || 0) },
    { label: "TOC", val: Math.round(tecnica.primo_tocco || 0) },
    { label: "PAS", val: Math.round(tecnica.passaggio || 0) },
    { label: "DRI", val: Math.round(tecnica.dribbling || 0) },
    { label: "TIR", val: Math.round(tecnica.tiro || 0) },
    { label: "CON", val: Math.round(tecnica.controllo_palla || 0) },
    { label: "TOP S", val: Math.round(gps["Top Speed"] || 0) },
    { label: "AVG S", val: Math.round(gps["Avg Speed"] || 0) },
    { label: "T KM", val: Math.round(gps["Total KM"] || 0) },
    { label: "A KM", val: Math.round(gps["Avg KM"] || 0) },
    { label: "DUR", val: Math.round(gps["Duration"] || 0) },
  ];

  // Calculate overall average
  const totalVal = allStats.reduce((sum, stat) => sum + stat.val, 0);
  const average = allStats.length > 0 ? Math.round(totalVal / allStats.length) : 0;

  // Pagination logic (show 6 stats at a time: 2 rows of 3, or 2 rows of 4)
  // Let's show 8 stats at a time (4x2 grid)
  const statsPerPage = 8;
  const totalPages = Math.ceil(allStats.length / statsPerPage);
  const currentStats = allStats.slice(statPage * statsPerPage, (statPage + 1) * statsPerPage);

  const nextPage = () => setStatPage((prev) => (prev + 1) % totalPages);
  const prevPage = () => setStatPage((prev) => (prev - 1 + totalPages) % totalPages);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "320px", marginTop: "20px" }}>
      
      {/* Main Card Container with perfect border */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "0.7",
        background: "#111111", // Deep Black
        border: "6px solid #5c6bfa",
        borderRadius: "24px 24px 35% 35%", // Shield-like curve at the bottom without clip-path jaggedness
        boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        
        {/* Inner Background (overflow hidden for circles) */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: "18px 18px 35% 35%", // Slightly smaller to fit inside border
          overflow: "hidden",
          zIndex: 0
        }}>
          {/* Background Concentric Circles */}
          <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "150%", aspectRatio: "1", borderRadius: "50%", border: "2px solid rgba(92, 107, 250, 0.2)" }} />
          <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "110%", aspectRatio: "1", borderRadius: "50%", border: "2px solid rgba(92, 107, 250, 0.3)" }} />
          <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: "70%", aspectRatio: "1", borderRadius: "50%", border: "2px solid rgba(92, 107, 250, 0.5)" }} />
        </div>

        {/* Top Initial Circle (Positioned outside overflow:hidden so it doesn't get cut!) */}
        <div style={{
          position: "absolute",
          top: "-40px", // Protruding outside the card
          left: "50%",
          transform: "translateX(-50%)",
          width: "80px",
          height: "80px",
          background: "#2a2a2a",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
          zIndex: 10, // Above everything
          border: "4px solid #5c6bfa" // Match outer border
        }}>
          <span style={{ fontSize: "2.5rem", fontWeight: "900", color: "#fff" }}>{initial}</span>
        </div>

        {/* Overall & Role */}
        <div style={{ marginTop: "48px", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
          <span style={{ fontSize: "4.5rem", fontWeight: "900", color: "#fff", lineHeight: "1" }}>{average}</span>
          <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "#fff", letterSpacing: "0.1em", fontStyle: "italic", marginTop: "-5px" }}>{role}</span>
        </div>

        {/* Name */}
        <div style={{ marginTop: "16px", width: "85%", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "12px", textAlign: "center", zIndex: 2 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#fff", letterSpacing: "0.05em", margin: 0 }}>
            {fullName}
          </h2>
        </div>

        {/* Stats Grid with Pagination Arrows */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          width: "95%", 
          marginTop: "16px",
          zIndex: 2 
        }}>
          {totalPages > 1 && (
            <button onClick={prevPage} className="pseudo-haptic" style={{ background: "none", border: "none", color: "var(--primary)", padding: "4px", cursor: "pointer" }}>
              <ChevronLeft size={24} />
            </button>
          )}
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "12px 4px", 
            flex: 1,
            padding: "0 4px"
          }}>
            {currentStats.map((stat, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#fff", lineHeight: "1" }}>{stat.val}</span>
                <span style={{ fontSize: "0.6rem", fontWeight: "600", color: "#fff", letterSpacing: "0.1em" }}>{stat.label}</span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <button onClick={nextPage} className="pseudo-haptic" style={{ background: "none", border: "none", color: "var(--primary)", padding: "4px", cursor: "pointer" }}>
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Logo at bottom */}
        <div style={{ marginTop: "auto", marginBottom: "20px", zIndex: 2 }}>
          <div style={{ width: "16px", height: "16px", background: "#fff", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}></div>
        </div>

      </div>

      {!hideLabel && (
        <p style={{ marginTop: "32px", fontSize: "0.85rem", fontWeight: "700", color: "var(--gray-dim)", letterSpacing: "0.15em", textTransform: "uppercase", fontStyle: "italic" }}>
          La tua scheda giocatore
        </p>
      )}

    </div>
  );
}
