import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ExpandableSpiderChart({ title, data, targetData, color }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [animState, setAnimState] = useState(0); // 0 = 0%, 1 = real value
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  const entries = Object.entries(data);
  const count = entries.length;
  if (count === 0) return null;

  useEffect(() => {
    let t;
    if (isExpanded) {
      t = setTimeout(() => setAnimState(1), 50); // triggered after expand
    } else {
      setAnimState(0);
    }
    return () => clearTimeout(t);
  }, [isExpanded]);

  const size = 320;
  const center = size / 2;
  const maxRadius = size / 2 - 40;

  const getPoint = (value, index) => {
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  const dataPoints = entries.map(([key, val], idx) => {
    const pt = getPoint(animState === 1 ? val : 0, idx);
    const truePt = getPoint(val, idx); // for tooltips
    return { key, val, ...pt, trueX: truePt.x, trueY: truePt.y };
  });

  const polygonPath = dataPoints.map(p => `${p.x},${p.y}`).join(" ");
  
  // Target Polygon
  let targetPolygonPath = null;
  if (targetData) {
    targetPolygonPath = entries.map(([key], idx) => {
      const targetVal = (targetData[key.toLowerCase()] || targetData[key] || 0) * 10; // scale 1-10 to 0-100
      const pt = getPoint(animState === 1 ? targetVal : 0, idx);
      return `${pt.x},${pt.y}`;
    }).join(" ");
  }

  const maxPolygonPath = entries.map((_, idx) => `${getPoint(100, idx).x},${getPoint(100, idx).y}`).join(" ");
  
  const gridLevels = [20, 40, 60, 80];
  const average = entries.reduce((acc, [_, v]) => acc + v, 0) / count;

  return (
    <div 
      className="card-dark" 
      onMouseEnter={() => setIsHoveringCard(true)}
      onMouseLeave={() => setIsHoveringCard(false)}
      style={{ 
        background: "#fff", 
        border: "2px solid #111", 
        overflow: "hidden", 
        transition: "all 0.4s var(--spring-easing), transform 0.3s ease",
        transform: isHoveringCard && !isExpanded ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHoveringCard && !isExpanded ? "0 10px 30px rgba(0,0,0,0.1)" : "none"
      }}
    >
      {/* Title & Summary */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
          borderBottom: isExpanded ? "1px solid #eee" : "none"
        }}
      >
        <div style={{ position: "relative", paddingBottom: "4px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111" }}>
            {title}
          </h3>
          {/* Animated underline */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, height: "3px", background: color,
            width: isExpanded ? "100%" : "0%", transition: "width 0.4s var(--spring-easing)"
          }}></div>
        </div>
        
        {!isExpanded && (
           <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, paddingLeft: "32px", paddingRight: "16px" }}>
             <div style={{ flex: 1, height: "8px", background: "var(--surface-light)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${average}%`, background: color, transition: "width 0.4s" }}></div>
             </div>
             <span style={{ fontWeight: "900", fontSize: "1rem" }}>{average.toFixed(0)}</span>
           </div>
        )}

        {isExpanded ? <ChevronUp size={24} color="#111" /> : <ChevronDown size={24} color="#111" />}
      </div>

      {/* Expanded Carosello (Chart | Bars) */}
      <div style={{
        height: isExpanded ? "auto" : "0px",
        opacity: isExpanded ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}>
        {isExpanded && (
          <>
            <div style={{ textAlign: "center", padding: "10px 0 0", fontSize: "0.7rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              SWIPE / SCROLL →
            </div>
            <div style={{ 
              display: "flex", 
              overflowX: "auto", 
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              paddingBottom: "20px"
            }}>
              
              {/* PAGE 1: SPIDER CHART */}
              <div style={{ flexShrink: 0, width: "100%", scrollSnapAlign: "center", display: "flex", justifyContent: "center", padding: "10px 20px" }}>
                <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: "400px", overflow: "visible" }}>
                  
                  {/* Grid */}
                  {gridLevels.map(level => {
                    const points = entries.map((_, idx) => `${getPoint(level, idx).x},${getPoint(level, idx).y}`).join(" ");
                    return <polygon key={level} points={points} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2 2" />
                  })}

                  {/* Axes */}
                  {entries.map((_, idx) => {
                    const maxPt = getPoint(100, idx);
                    return <line key={`axis-${idx}`} x1={center} y1={center} x2={maxPt.x} y2={maxPt.y} stroke="#111" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                  })}

                  {/* Outer Perimeter */}
                  <polygon points={maxPolygonPath} fill="none" stroke="#111" strokeWidth="2" />

                  {/* TARGET POLYGON (Dashed) */}
                  {targetPolygonPath && (
                    <polygon 
                      points={targetPolygonPath} 
                      fill="none" 
                      stroke="#111" 
                      strokeWidth="2" 
                      strokeDasharray="4 4"
                      opacity="0.5"
                      style={{ transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }} 
                    />
                  )}

                  {/* DATA POLYGON (Animated) */}
                  <polygon 
                    points={polygonPath} 
                    fill={color} 
                    fillOpacity="0.3" 
                    stroke={color} 
                    strokeWidth="3" 
                    strokeLinejoin="round"
                    style={{ transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }} 
                  />

                  {/* LABELS & INTERACTIVE NODES */}
                  {dataPoints.map((pt, idx) => {
                    const txtRadius = maxRadius + 24;
                    const tx = center + txtRadius * Math.cos(pt.angle);
                    const ty = center + txtRadius * Math.sin(pt.angle);
                    const isHovered = hoveredNode === idx;

                    return (
                      <g key={`group-${idx}`} 
                          onMouseEnter={() => setHoveredNode(idx)} 
                          onMouseLeave={() => setHoveredNode(null)}
                          style={{ cursor: "pointer" }}
                      >
                        <text x={tx} y={ty} textAnchor="middle" alignmentBaseline="middle" 
                               fontSize="10" fontWeight="900" fill={isHovered ? color : "#111"} style={{ textTransform: "uppercase", transition: "fill 0.2s" }}>
                          {pt.key}
                        </text>
                        
                        {/* Data Node (True position to match polygon animation) */}
                        <circle cx={pt.x} cy={pt.y} r={isHovered ? 6 : 4} fill={color} stroke="#fff" strokeWidth="2" 
                                 style={{ transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
                        
                        {/* Tooltip */}
                        {isHovered && (
                          <g style={{ animation: "fadeIn 0.2s forwards" }}>
                            <rect x={pt.trueX + 10} y={pt.trueY - 14} width="32" height="20" fill="#111" rx="4" />
                            <text x={pt.trueX + 26} y={pt.trueY} textAnchor="middle" alignmentBaseline="middle" fontSize="11" fontWeight="900" fill="#fff">
                              {pt.val.toFixed(0)}
                            </text>
                          </g>
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* PAGE 2: INDIVIDUAL BARS */}
              <div style={{ flexShrink: 0, width: "100%", scrollSnapAlign: "center", padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "900", color: "#111", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Dettaglio Statistiche</h4>
                {entries.map(([k, v], i) => {
                  const targetVal = targetData ? (targetData[k.toLowerCase()] || targetData[k] || 0) : 0;
                  return (
                    <div key={k} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", color: "var(--gray-dim)" }}>{k}</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                           <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#111" }}>{v.toFixed(0)}</span>
                           {targetData && <span style={{ fontSize: "0.65rem", fontWeight: "700", color: "var(--gray-dim)" }}>/ {targetVal * 10}</span>}
                        </div>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--surface-light)", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                        {targetData && (
                          <div style={{ 
                            position: "absolute",
                            left: `${targetVal * 10}%`,
                            top: 0,
                            bottom: 0,
                            width: "2px",
                            background: "#111",
                            zIndex: 2,
                            opacity: 0.5
                          }} />
                        )}
                        <div style={{ 
                          height: "100%", 
                          width: animState === 1 ? `${v}%` : "0%", 
                          background: color, 
                          transition: `width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.05}s` 
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
