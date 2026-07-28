"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { haptic } from "@/utils/haptics";

/**
 * GpsHistoryCharts - Enhanced Interactive Velocity Chart
 * Provides a smooth, interactive view of GPS session speed over time.
 */
export default function GpsHistoryCharts({ 
  speedData = [], 
  totalKm = 0, 
  peaks = [], 
  pauses = [], 
  hideLabels = false,
  customWidth,
  customHeight,
  customPadding,
  maxAbsTime
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const svgRef = useRef(null);

  // Compute enriched data and absolute times
  const { absoluteSpeedData, pauseBlocks, totalAbsTime, topPeaks, avgSpeed } = useMemo(() => {
    if (!speedData || speedData.length === 0) return { absoluteSpeedData: [], pauseBlocks: [], totalAbsTime: 0, topPeaks: [], avgSpeed: 0 };

    let cumDist = 0;
    const enrichedData = speedData.map((d, i) => {
      if (i > 0) {
        const dt = d.rawTime - speedData[i-1].rawTime;
        if (dt > 0) cumDist += (d.speed * (dt / 3600));
      }
      return { ...d, distanceKm: cumDist };
    });

    const sortedPauses = [...pauses].sort((a, b) => a.time - b.time);
    const pBlocks = [];
    let accumulatedPause = 0;

    for (let p of sortedPauses) {
      const startAbsTime = p.time + accumulatedPause;
      const endAbsTime = startAbsTime + p.duration;
      pBlocks.push({ startAbsTime, endAbsTime, duration: p.duration });
      accumulatedPause += p.duration;
    }

    const lastRawTime = speedData[speedData.length - 1].rawTime;
    const tAbsTime = lastRawTime + accumulatedPause;

    const absData = enrichedData.map(d => {
      let addPause = 0;
      for (let p of sortedPauses) {
        if (d.rawTime > p.time) addPause += p.duration;
      }
      return { ...d, absTime: d.rawTime + addPause };
    });

    // Peaks Calculation (Top 3)
    const localMaxima = [];
    for (let i = 1; i < absData.length - 1; i++) {
      if (absData[i].speed > absData[i-1].speed && absData[i].speed > absData[i+1].speed) {
        localMaxima.push(absData[i]);
      }
    }
    const top3 = localMaxima.sort((a, b) => b.speed - a.speed).slice(0, 3);
    const average = absData.length > 0 ? absData.reduce((acc, d) => acc + d.speed, 0) / absData.length : 0;

    return { absoluteSpeedData: absData, pauseBlocks: pBlocks, totalAbsTime: tAbsTime, topPeaks: top3, avgSpeed: average };
  }, [speedData, pauses]);

  const width = customWidth || 800; 
  const height = customHeight || 300;
  const padding = customPadding || { top: 40, right: 30, bottom: 50, left: 40 }; 
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxSpeedValue = Math.max(...absoluteSpeedData.map(d => d.speed), 10);
  const maxSpeed = maxSpeedValue * 1.2;

  const xScale = (absTime) => padding.left + (absTime / Math.max(maxAbsTime || totalAbsTime, 1)) * innerWidth;
  const yScale = (speed) => padding.top + innerHeight - (speed / maxSpeed) * innerHeight;

  // Build path segments breaking at pauses
  const segments = useMemo(() => {
    let current = [];
    const segs = [];
    for (let i = 0; i < absoluteSpeedData.length; i++) {
      const d = absoluteSpeedData[i];
      current.push(d);
      if (i < absoluteSpeedData.length - 1) {
        const nextD = absoluteSpeedData[i + 1];
        if (pauseBlocks.some(p => p.startAbsTime >= d.absTime && p.endAbsTime <= nextD.absTime)) {
          segs.push(current);
          current = [];
        }
      }
    }
    if (current.length > 0) segs.push(current);
    return segs;
  }, [absoluteSpeedData, pauseBlocks]);

  // Curve Generation (Bezier)
  const getCurvePath = (points) => {
    if (points.length < 2) return "";
    let path = `M ${xScale(points[0].absTime)},${yScale(points[0].speed)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = xScale(points[i].absTime), y1 = yScale(points[i].speed);
      const x2 = xScale(points[i+1].absTime), y2 = yScale(points[i+1].speed);
      const cx = x1 + (x2 - x1) / 2;
      path += ` C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    }
    return path;
  };

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Find closest point by time
    let closestIdx = 0;
    let minDistance = Infinity;
    absoluteSpeedData.forEach((d, i) => {
      const dx = Math.abs(x - xScale(d.absTime));
      if (dx < minDistance) {
        minDistance = dx;
        closestIdx = i;
      }
    });

    if (minDistance < 50) {
      if (hoveredIndex !== closestIdx) {
        setHoveredIndex(closestIdx);
        haptic.light();
      }
    } else {
      setHoveredIndex(null);
    }
  };

  if (!speedData || speedData.length === 0) return null;

  const activePoint = hoveredIndex !== null ? absoluteSpeedData[hoveredIndex] : null;

  const svgContent = (
    <div style={{ width: "100%", position: "relative" }}>
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        width={hideLabels ? width : "100%"}
        height={hideLabels ? height : "auto"}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ width: hideLabels ? `${width}px` : "100%", height: hideLabels ? `${height}px` : "auto", overflow: "visible", cursor: "crosshair" }}
      >
        {/* Grid Lines */}
        {!hideLabels && [0, 0.5, 1].map(p => {
          const val = Math.round(p * maxSpeedValue);
          return (
            <line 
              key={p} x1={padding.left} y1={yScale(val)} x2={width - padding.right} y2={yScale(val)} 
              stroke="#f0f0f0" strokeWidth="1" 
            />
          );
        })}

        {/* Pause Regions */}
        {pauseBlocks.map((p, i) => (
          <rect 
            key={i} 
            x={xScale(p.startAbsTime)} y={padding.top} 
            width={xScale(p.endAbsTime) - xScale(p.startAbsTime)} height={innerHeight} 
            fill="rgba(168, 85, 247, 0.05)" 
          />
        ))}

        {/* Average Line */}
        <line 
          x1={padding.left} y1={yScale(avgSpeed)} x2={width - padding.right} y2={yScale(avgSpeed)} 
          stroke="#6B74FF" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" 
        />

        {/* Speed Curves */}
        {segments.map((seg, i) => (
          <path 
            key={i} 
            d={getCurvePath(seg)} 
            fill="none" 
            stroke="#111" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        ))}

        {/* Dynamic Cursor Line */}
        {hoveredIndex !== null && (
          <line 
            x1={xScale(activePoint.absTime)} y1={padding.top} 
            x2={xScale(activePoint.absTime)} y2={height - padding.bottom} 
            stroke="#E63946" strokeWidth="1" strokeDasharray="4 2" 
          />
        )}

        {/* Time Ticks */}
        {!hideLabels && [0, 0.25, 0.5, 0.75, 1].map(p => {
          const time = p * (maxAbsTime || totalAbsTime);
          return (
            <text 
              key={p} x={xScale(time)} y={height - padding.bottom + 20} 
              textAnchor="middle" fontSize="10" fontWeight="800" fill="#bbb"
            >
              {Math.floor(time / 60)}:{(Math.floor(time % 60)).toString().padStart(2, '0')}
            </text>
          );
        })}

        {/* Peak Points */}
        {!hideLabels && topPeaks.map((p, i) => (
          <circle 
            key={i} cx={xScale(p.absTime)} cy={yScale(p.speed)} r="5" 
            fill={i === 0 ? "#E63946" : "#fff"} stroke="#111" strokeWidth="2" 
          />
        ))}

        {/* Hover Point */}
        {hoveredIndex !== null && (
          <circle 
            cx={xScale(activePoint.absTime)} cy={yScale(activePoint.speed)} r="8" 
            fill="#E63946" stroke="#fff" strokeWidth="3" 
            style={{ filter: "drop-shadow(0 0 10px rgba(230, 57, 70, 0.4))" }}
          />
        )}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIndex !== null && activePoint && (
        <div style={{
          position: 'absolute',
          left: `${(xScale(activePoint.absTime) / width) * 100}%`,
          top: `${(yScale(activePoint.speed) / height) * 100}%`,
          transform: 'translate(-50%, -120%)',
          background: '#111',
          padding: '12px 16px',
          borderRadius: '16px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
          zIndex: 100,
          pointerEvents: 'none',
          animation: 'springPop 0.3s var(--spring-easing)'
        }}>
          <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', lineHeight: 1 }}>
            {activePoint.speed.toFixed(1)} <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>KM/H</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', marginTop: "4px" }}>
            {activePoint.distanceKm.toFixed(2)} KM Traveled
          </div>
        </div>
      )}
    </div>
  );

  if (hideLabels) {
    return svgContent;
  }

  return (
    <div style={{ background: "#fff", borderRadius: "32px", padding: "24px", border: "1px solid #eee", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
        <h4 style={{ fontSize: "0.8rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", color: "#bbb" }}>Session Velocity</h4>
        <div style={{ display: "flex", gap: "16px" }}>
           <div style={{ fontSize: "0.7rem", fontWeight: "900", color: "#666" }}><span style={{ color: "#E63946" }}>●</span> SPEED</div>
           <div style={{ fontSize: "0.7rem", fontWeight: "900", color: "#666" }}><span style={{ color: "#6B74FF" }}>--</span> AVG</div>
        </div>
      </div>
      
      {svgContent}


      <style jsx>{`
        @keyframes springPop {
          0% { transform: scale(0.5) translate(-50%, 20px); opacity: 0; }
          100% { transform: scale(1) translate(-50%, -120%); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
