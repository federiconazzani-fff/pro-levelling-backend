import { useState, useEffect } from "react";

export default function TacticalDonutChart({ title, data, mainColor }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [animState, setAnimState] = useState(0);
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  const entries = Object.entries(data);
  const total = entries.reduce((acc, [_, v]) => acc + v, 0);
  if (total === 0) return null;

  useEffect(() => {
    // Entrance animation delay
    const t = setTimeout(() => setAnimState(1), 100);
    return () => clearTimeout(t);
  }, []);

  // Palette: main color, blueish/teal variant, yellowish/orange variant (matching the picture style)
  // We'll generate an appealing palette based on the main color or hardcode a vibrant one.
  const colors = [
    mainColor, 
    mainColor === "#8b5cf6" ? "#3b82f6" : "#06b6d4", // variant 1
    mainColor === "#8b5cf6" ? "#ec4899" : "#10b981", // variant 2
    "#fbbf24"
  ];

  const size = 260;
  const cx = size / 2;
  // Since it's a half-circle arch, cy can be pushed down
  const cy = size - 60; 
  const radius = size / 2 - 30;
  const strokeWidth = 24;

  // Calculates coordinates for SVG arc based on angle in radians
  const getCoords = (angle) => {
    return [
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius
    ];
  };

  // Arch covers from -180 deg to 0 (PI radians)
  // We'll add a tiny gap between segments, e.g. 0.05 radians
  const gap = 0.06;
  const totalGaps = (entries.length - 1) * gap;
  const availableAngle = Math.PI - totalGaps; // Total radians available for data

  let currentAngle = Math.PI; // Start at left (we draw backwards in Cartesian, so 180 deg is Math.PI)
  // Actually, standard math: 180 deg is Math.PI, 0 is right.
  // Wait, in SVG Y goes down. So angle PI is Left, angle 0 is Right. 
  // Wait, if Y is down, -180 deg (or PI) is left, -90 is top, 0 is right.
  // Let's use angles from Math.PI to 2*Math.PI (which is top half).
  let currentStartAngle = Math.PI;

  const paths = entries.map(([key, val], idx) => {
    // Proportion of the available angle
    const segmentAngle = (val / total) * availableAngle;
    // Animate the sweep
    const drawnAngle = animState === 1 ? segmentAngle : 0.001; 
    
    const startAngle = currentStartAngle;
    const endAngle = currentStartAngle + drawnAngle;
    
    const [startX, startY] = getCoords(startAngle);
    const [endX, endY] = getCoords(endAngle);

    currentStartAngle += segmentAngle + gap;

    // A half-arch segment will never exceed 180 deg in this layout
    const largeArcFlag = 0;

    const pathData = [
      `M ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
    ].join(" ");

    return { key, val, pathData, color: colors[idx % colors.length] };
  });

  // Background skeleton (full arch)
  const [bgStartX, bgStartY] = getCoords(Math.PI);
  const [bgEndX, bgEndY] = getCoords(2 * Math.PI);
  const bgPath = `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 0 1 ${bgEndX} ${bgEndY}`;

  return (
    <div 
      className="card-dark" 
      onMouseEnter={() => setIsHoveringCard(true)}
      onMouseLeave={() => setIsHoveringCard(false)}
      style={{ 
        background: "#fff", 
        border: "2px solid #111", 
        padding: "24px", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        transition: "all 0.4s var(--spring-easing)",
        transform: isHoveringCard ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHoveringCard ? "0 10px 30px rgba(0,0,0,0.1)" : "none"
      }}
    >
      <div style={{ position: "relative", width: "100%", paddingBottom: "4px", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111", textAlign: "center" }}>
          {title}
        </h3>
        {/* Animated underline */}
        <div style={{
          position: "absolute", bottom: 0, left: "10%", height: "3px", background: mainColor,
          width: isHoveringCard ? "80%" : "0%", transition: "width 0.4s var(--spring-easing)", margin: "0 auto"
        }}></div>
      </div>
      
      <div style={{ position: "relative", width: "100%", height: "160px", display: "flex", justifyContent: "center" }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size - 40}`} style={{ overflow: "visible" }}>
          
          {/* Background Arch */}
          <path d={bgPath} fill="none" stroke="var(--surface-light)" strokeWidth={strokeWidth} strokeLinecap="round" />
          
          {/* Data Segments */}
          {paths.map((p, idx) => {
            const isHovered = hoveredSegment === idx;
            return (
              <path
                key={p.key}
                d={p.pathData}
                fill="none"
                stroke={p.color}
                strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                strokeLinecap="round"
                style={{ 
                  transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)", 
                  cursor: "pointer" 
                }}
                onMouseEnter={() => setHoveredSegment(idx)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            );
          })}
        </svg>

        {/* Center Readout (Positioned roughly at the focal point of the arch) */}
        <div style={{ 
          position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", 
          display: "flex", flexDirection: "column", alignItems: "center" 
        }}>
          {hoveredSegment !== null ? (
            <>
              <span style={{ fontSize: "2rem", fontWeight: "900", color: paths[hoveredSegment].color, lineHeight: "1" }}>{paths[hoveredSegment].val}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)" }}>{paths[hoveredSegment].key}</span>
            </>
          ) : (
            <>
             <span style={{ fontSize: "2.4rem", fontWeight: "900", color: "#111", lineHeight: "1" }}>{total}</span>
             <span style={{ fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)" }}>Total Score</span>
            </>
          )}
        </div>
      </div>

      {/* Legend below the arch */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "16px" }}>
        {paths.map((p, idx) => {
          const isHovered = hoveredSegment === idx;
          return (
            <div 
              key={p.key} 
              onMouseEnter={() => setHoveredSegment(idx)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: "800", 
                  color: isHovered ? "#111" : "var(--gray-dim)", 
                  textTransform: "uppercase",
                  position: "relative",
                  paddingBottom: "4px",
                  display: "inline-block",
                  transition: "color 0.3s ease"
                }}>
                  {p.key}
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
              </div>
              <span style={{ 
                fontSize: "0.8rem", 
                fontWeight: "900", 
                color: "#111",
                transition: "color 0.3s ease"
              }}>
                {((p.val/total)*100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
