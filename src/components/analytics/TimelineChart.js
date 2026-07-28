"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { haptic } from "@/utils/haptics";

/**
 * TimelineChart - Enhanced SVG Line Chart for Analytics
 * Displays score trends with smooth curves, interactive cursor, and premium aesthetics.
 */
export default function TimelineChart({ data, onSessionClick, color = "#e63946", maxValue = 100 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const scrollContainerRef = useRef(null);
  const svgRef = useRef(null);

  // Auto-scroll to the rightmost (latest) session when data changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Use setTimeout to ensure the DOM has updated the scrollWidth before scrolling
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
      }, 50);
    }
  }, [data]);

  // Chart dimensions
  const chartHeight = 280;
  const chartPadding = { top: 60, right: 60, bottom: 50, left: 50 };
  
  // Calculate chart area to be "prolungato": Ensure a minimum spacing between points (e.g. 180px)
  const MIN_POINT_SPACING = 180;
  const calculatedWidth = chartPadding.left + Math.max(1, data.length - 1) * MIN_POINT_SPACING + chartPadding.right;
  // If the calculated width is smaller than the screen width, make it fill the screen
  const chartWidth = typeof window !== 'undefined' ? Math.max(window.innerWidth - 40, calculatedWidth) : Math.max(800, calculatedWidth);
  
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Scale functions
  const xScale = (index) => chartPadding.left + (index / Math.max(1, data.length - 1)) * innerWidth;
  const yScale = (score) => chartPadding.top + innerHeight - (score / Math.max(1, maxValue)) * innerHeight;

  // Cubic Bezier Curve Generation
  const curvePath = useMemo(() => {
    if (data.length < 2) return "";
    
    let path = `M ${xScale(0)},${yScale(data[0].avgScore)}`;
    
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = xScale(i);
      const y1 = yScale(data[i].avgScore);
      const x2 = xScale(i + 1);
      const y2 = yScale(data[i + 1].avgScore);
      
      const cp1x = x1 + (x2 - x1) / 2;
      const cp2x = x2 - (x2 - x1) / 2;
      
      path += ` C ${cp1x},${y1} ${cp2x},${y2} ${x2},${y2}`;
    }
    return path;
  }, [data, innerWidth, innerHeight]);

  const areaPath = useMemo(() => {
    if (data.length < 2) return "";
    return `${curvePath} L ${xScale(data.length - 1)},${chartHeight - chartPadding.bottom} L ${xScale(0)},${chartHeight - chartPadding.bottom} Z`;
  }, [curvePath, data]);

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Find closest index
    let closestIdx = 0;
    let minDistance = Infinity;
    
    data.forEach((_, i) => {
      const distance = Math.abs(x - xScale(i));
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    });

    if (minDistance < 60) {
      if (hoveredIndex !== closestIdx) {
        setHoveredIndex(closestIdx);
        // Subtle haptic when snapping to a point
        if (typeof window !== "undefined") haptic.light();
      }
    } else {
      setHoveredIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--gray-dim)", background: "var(--surface)", borderRadius: "24px", border: "2px dashed #ddd" }}>
        <TrendingUp size={48} opacity={0.1} style={{ marginBottom: "16px" }} />
        <p style={{ fontSize: "0.9rem", fontWeight: "800", textTransform: "uppercase" }}>No data</p>
      </div>
    );
  }

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div
      ref={scrollContainerRef}
      style={{
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        background: "transparent",
        borderRadius: "32px",
        padding: "10px 0"
      }}
    >
      <svg 
        ref={svgRef}
        width={chartWidth} 
        height={chartHeight} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: "block", cursor: "crosshair" }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid Lines */}
        {[0, 0.5, 1].map((p) => {
          const val = Math.ceil(p * maxValue);
          const y = yScale(val);
          return (
            <g key={`grid-${p}`}>
              <line 
                x1={chartPadding.left} y1={y} x2={chartWidth - chartPadding.right} y2={y} 
                stroke="#eee" strokeWidth="1" 
              />
              <text 
                x={chartPadding.left - 15} y={y + 4} 
                textAnchor="end" fontSize="10" fontWeight="800" fill="#bbb"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* X-Axis Vertical Indicators */}
        {data.map((_, i) => (
          <line 
            key={`vgrid-${i}`}
            x1={xScale(i)} y1={chartPadding.top} x2={xScale(i)} y2={chartHeight - chartPadding.bottom} 
            stroke="#f5f5f5" strokeWidth="1"
          />
        ))}

        {/* Area Fill */}
        <path d={areaPath} fill="url(#areaGradient)" style={{ transition: "all 0.4s ease" }} />

        {/* Main Line */}
        <path 
          d={curvePath} 
          fill="none" 
          stroke={color} 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.05))" }}
        />

        {/* Interactive Vertical Cursor */}
        {hoveredIndex !== null && (
          <g style={{ transition: "transform 0.15s ease-out" }}>
            <line 
              x1={xScale(hoveredIndex)} y1={chartPadding.top - 20} 
              x2={xScale(hoveredIndex)} y2={chartHeight - chartPadding.bottom} 
              stroke={color} strokeWidth="2" strokeDasharray="6 4" opacity="0.3" 
            />
          </g>
        )}

        {/* Data Points */}
        {data.map((point, i) => {
          const x = xScale(i);
          const y = yScale(point.avgScore);
          const isActive = hoveredIndex === i;

          return (
            <g key={`point-${i}`} onClick={() => { haptic.medium(); onSessionClick?.(point); }}>
              {/* Outer halo */}
              <circle 
                cx={x} cy={y} r={isActive ? 16 : 0} 
                fill={color} fillOpacity="0.1" 
                style={{ transition: "r 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }} 
              />
              
              {/* Core point */}
              <circle 
                cx={x} cy={y} r={isActive ? 8 : 5} 
                fill={isActive ? color : "#fff"} 
                stroke={color} strokeWidth="3" 
                style={{ transition: "all 0.3s var(--spring-easing)" }} 
              />

              {/* Date label at bottom */}
              <text 
                x={x} y={chartHeight - chartPadding.bottom + 25} 
                textAnchor="middle" fontSize="10" fontWeight="900" 
                fill={isActive ? "#111" : "#ccc"}
                style={{ transition: "all 0.2s" }}
              >
                {point.date}
              </text>
            </g>
          );
        })}

        {/* Floating Premium Tooltip */}
        {hoveredIndex !== null && activePoint && (
          <foreignObject 
            x={xScale(hoveredIndex) - 60} 
            y={yScale(activePoint.avgScore) - 90} 
            width="120" height="80"
            style={{ pointerEvents: "none" }}
          >
            <div style={{
              background: "#111",
              color: "#fff",
              padding: "10px",
              borderRadius: "16px",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              animation: "springPop 0.4s var(--spring-easing)",
              border: "2px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: "900", lineHeight: 1 }}>
                {activePoint.avgScore.toFixed(1)}
              </div>
              <div style={{ fontSize: "0.6rem", fontWeight: "800", textTransform: "uppercase", marginTop: "4px", opacity: 0.5 }}>
                {activePoint.sessionCount} Analysis
              </div>
            </div>
            {/* Arrow */}
            <div style={{
              width: 0, height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid #111",
              margin: "-2px auto 0"
            }} />
          </foreignObject>
        )}
      </svg>
      
      <style jsx>{`
        @keyframes springPop {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
