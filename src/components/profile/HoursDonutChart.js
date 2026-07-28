import { useState, useEffect } from "react";

export default function HoursDonutChart({ data }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [animState, setAnimState] = useState(0);

  // Filter out categories with 0 minutes to avoid empty slices
  const activeData = data.filter(d => d.totalMinutes > 0);
  const total = activeData.reduce((acc, d) => acc + d.totalMinutes, 0);

  useEffect(() => {
    const t = setTimeout(() => setAnimState(1), 100);
    return () => clearTimeout(t);
  }, []);

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return `${h}h ${m}m`;
  };

  if (activeData.length === 0) {
    return (
      <div className="interactive-card" style={{ background: "#fff", border: "2px solid #111", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "4px 4px 0px rgba(0,0,0,0.1)" }}>
         <h3 style={{ fontSize: "1.1rem", fontWeight: "900", color: "#111", textTransform: "uppercase" }}>Ore Totali</h3>
         <p style={{ fontSize: "0.8rem", color: "var(--gray-dim)", textAlign: "center", padding: "20px 0" }}>Nessun dato disponibile</p>
         
         {/* Still show the empty list */}
         <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
           {data.map((p, idx) => (
              <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>{p.label}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#111" }}>0h 0m</span>
              </div>
           ))}
         </div>
      </div>
    );
  }

  const size = 260;
  const cx = size / 2;
  const cy = size - 60; 
  const radius = size / 2 - 30;
  const strokeWidth = 24;

  const getCoords = (angle) => {
    return [
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius
    ];
  };

  const gap = 0.06;
  const totalGaps = (activeData.length - 1) * gap;
  const availableAngle = Math.PI - totalGaps; 

  let currentStartAngle = Math.PI;

  const paths = activeData.map((d, idx) => {
    const segmentAngle = (d.totalMinutes / total) * availableAngle;
    const drawnAngle = animState === 1 ? segmentAngle : 0.001; 
    
    const startAngle = currentStartAngle;
    const endAngle = currentStartAngle + drawnAngle;
    
    const [startX, startY] = getCoords(startAngle);
    const [endX, endY] = getCoords(endAngle);

    currentStartAngle += segmentAngle + gap;

    const largeArcFlag = 0;

    const pathData = [
      `M ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
    ].join(" ");

    return { ...d, pathData };
  });

  const [bgStartX, bgStartY] = getCoords(Math.PI);
  const [bgEndX, bgEndY] = getCoords(2 * Math.PI);
  const bgPath = `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 0 1 ${bgEndX} ${bgEndY}`;

  return (
    <div 
      className="interactive-card" 
      style={{ 
        background: "#fff", border: "2px solid #111", borderRadius: "20px", padding: "24px", 
        display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "4px 4px 0px rgba(0,0,0,0.1)", height: "100%"
      }}
    >
      <div style={{ width: "100%", paddingBottom: "4px", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111", textAlign: "center" }}>
          Ore Totali
        </h3>
      </div>
      
      <div style={{ position: "relative", width: "100%", height: "160px", display: "flex", justifyContent: "center" }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size - 40}`} style={{ overflow: "visible" }}>
          <path d={bgPath} fill="none" stroke="var(--surface-light)" strokeWidth={strokeWidth} strokeLinecap="round" />
          
          {paths.map((p, idx) => {
            const isHovered = hoveredSegment === idx;
            return (
              <path
                key={p.label}
                d={p.pathData}
                fill="none"
                stroke={hoveredSegment !== null && !isHovered ? "var(--surface-light)" : p.color}
                strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                strokeLinecap="round"
                style={{ transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)", cursor: "pointer" }}
                onMouseEnter={() => setHoveredSegment(idx)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => setHoveredSegment(isHovered ? null : idx)}
              />
            );
          })}
        </svg>

        <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "nowrap" }}>
          {hoveredSegment !== null ? (
            <>
              <span style={{ fontSize: "1.8rem", fontWeight: "900", color: paths[hoveredSegment].color, lineHeight: "1" }}>{formatTime(paths[hoveredSegment].totalMinutes)}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)" }}>{paths[hoveredSegment].label}</span>
            </>
          ) : (
            <>
             <span style={{ fontSize: "2rem", fontWeight: "900", color: "#111", lineHeight: "1" }}>{formatTime(total)}</span>
             <span style={{ fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)" }}>Tempo Totale</span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "16px" }}>
        <style>{`
           .hr-hover-row .hr-cat-name { transition: all 0.2s; }
           .hr-hover-row .hr-cat-value { transition: all 0.2s; }
        `}</style>
        {data.map((p, idx) => {
          const activeIdx = paths.findIndex(a => a.label === p.label);
          const isHovered = hoveredSegment === activeIdx && activeIdx !== -1;
          const isHoveringAny = hoveredSegment !== null;
          
          return (
            <div 
              key={p.label} 
              className="hr-hover-row"
              onMouseEnter={() => activeIdx !== -1 && setHoveredSegment(activeIdx)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{ 
                "--hover-color": p.color,
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "4px 0",
                cursor: activeIdx !== -1 ? "pointer" : "default",
                opacity: (isHoveringAny && !isHovered) ? 0.5 : 1,
                transition: "opacity 0.3s"
              }}
            >
              <span className="hr-cat-name" style={{ 
                fontSize: "0.75rem", 
                fontWeight: "800", 
                color: isHovered ? "#111" : "var(--gray-dim)", 
                textTransform: "uppercase",
                position: "relative",
                paddingBottom: "4px",
                display: "inline-block",
                transition: "color 0.3s ease"
              }}>
                {p.label}
                {/* Thick and gradual colored underline, like spider cards */}
                <span style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: "3px",
                  background: p.color,
                  width: isHovered ? "100%" : "0%",
                  transition: "width 0.3s var(--spring-easing)",
                  transformOrigin: "left"
                }} />
              </span>
              <span className="hr-cat-value" style={{ 
                fontSize: "0.85rem", 
                fontWeight: "900", 
                color: "#111"
              }}>
                {formatTime(p.totalMinutes)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
