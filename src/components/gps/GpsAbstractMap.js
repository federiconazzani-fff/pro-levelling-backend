"use client";

import React, { useMemo } from 'react';
import { Target } from 'lucide-react';

/**
 * GpsAbstractMap
 * Renders an abstract, minimalistic path of the GPS track without an underlying map tile.
 * Adapts to bounding box of the coordinates.
 */
export default function GpsAbstractMap({ coordinates = [], color = "#111", strokeWidth = 8, animate = false }) {
  const { pathData, minX, minY, width, height } = useMemo(() => {
    if (!coordinates || coordinates.length < 2) return { pathData: "", width: 100, height: 100 };

    // Mercator projection simplified (good enough for small running tracks)
    const pts = coordinates.map(c => {
      // Longitude scales linearly, latitude needs slight adjustment based on cos(lat)
      // but for local runs, linear is fine.
      return { x: c.lon, y: -c.lat }; // Invert y because SVG y goes down
    });

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const dX = maxX - minX;
    const dY = maxY - minY;

    // Add padding (10%)
    const paddingX = dX * 0.1 || 0.001;
    const paddingY = dY * 0.1 || 0.001;

    const vMinX = minX - paddingX;
    const vMaxX = maxX + paddingX;
    const vMinY = minY - paddingY;
    const vMaxY = maxY + paddingY;

    const vWidth = vMaxX - vMinX;
    const vHeight = vMaxY - vMinY;

    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return { pathData: pathD, minX: vMinX, minY: vMinY, width: vWidth, height: vHeight, startPt: pts[0], endPt: pts[pts.length - 1] };
  }, [coordinates]);

  if (!coordinates || coordinates.length < 2) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f8f8", borderRadius: "24px", position: "relative", overflow: "hidden" }}>
        {/* Fake Map Grid Background */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#e5e5e5 2px, transparent 2px), linear-gradient(90deg, #e5e5e5 2px, transparent 2px)", backgroundSize: "40px 40px", opacity: 0.5 }}></div>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#d4d4d4 1px, transparent 1px), linear-gradient(90deg, #d4d4d4 1px, transparent 1px)", backgroundSize: "10px 10px", opacity: 0.3 }}></div>
        {/* Fake Streets (Diagonal) */}
        <div style={{ position: "absolute", width: "200%", height: "4px", background: "#fff", transform: "rotate(30deg)", top: "30%", left: "-50%" }}></div>
        <div style={{ position: "absolute", width: "200%", height: "6px", background: "#fff", transform: "rotate(-45deg)", top: "60%", left: "-50%" }}></div>

        {/* Current Location Marker (Pulse) */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
           <div style={{ position: "absolute", width: "40px", height: "40px", background: "var(--color-gps)", borderRadius: "50%", opacity: 0.2, animation: "pulse 2s infinite" }}></div>
           <div style={{ width: "16px", height: "16px", background: "var(--color-gps)", borderRadius: "50%", border: "3px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}></div>
        </div>
      </div>
    );
  }

  // To maintain aspect ratio, we'll use a preserveAspectRatio setting.
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#f8f8f8", borderRadius: "24px", overflow: "hidden" }}>
        {/* Fake Map Grid Background */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#e5e5e5 2px, transparent 2px), linear-gradient(90deg, #e5e5e5 2px, transparent 2px)", backgroundSize: "40px 40px", opacity: 0.5 }}></div>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#d4d4d4 1px, transparent 1px), linear-gradient(90deg, #d4d4d4 1px, transparent 1px)", backgroundSize: "10px 10px", opacity: 0.3 }}></div>
        <div style={{ position: "absolute", width: "200%", height: "4px", background: "#fff", transform: "rotate(30deg)", top: "30%", left: "-50%" }}></div>
        <div style={{ position: "absolute", width: "200%", height: "6px", background: "#fff", transform: "rotate(-45deg)", top: "60%", left: "-50%" }}></div>

      <svg 
        width="100%" 
        height="100%" 
        viewBox={`${minX} ${minY} ${width} ${height}`} 
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible' }}
      >
        {/* Glow effect */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={height * (strokeWidth / 1000)} 
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.15}
          transform={`translate(0, ${height * 0.02})`}
        />
        {/* Main Track */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={height * (strokeWidth / 1000)} // Scale stroke based on viewport height
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animate ? "draw-path" : ""}
        />

        {/* Start Point Marker */}
        <circle 
          cx={coordinates[0].lon} 
          cy={-coordinates[0].lat} 
          r={height * 0.03} 
          fill="#fff" 
          stroke={color} 
          strokeWidth={height * 0.015} 
        />

        {/* End/Current Point Marker */}
        <circle 
          cx={coordinates[coordinates.length-1].lon} 
          cy={-coordinates[coordinates.length-1].lat} 
          r={height * 0.035} 
          fill="var(--color-gps)" 
          stroke="#fff" 
          strokeWidth={height * 0.01} 
        />
      </svg>

      <style jsx>{`
        .draw-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
