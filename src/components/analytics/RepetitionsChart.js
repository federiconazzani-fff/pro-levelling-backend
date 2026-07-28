"use client";

import React, { useRef, useState, useEffect } from "react";
import { haptic } from "@/utils/haptics";

export default function RepetitionsChart({ data, onRepClick, color = "#ff0000", activeRepIndex = -1 }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) return null;

  // Parse and sort the data points based on time
  const processedData = data.map((rep, idx) => {
    // If startTime/endTime aren't provided, we estimate a 3s duration around the timestamp
    const t = rep.timestamp || 0;
    const start = rep.startTime !== undefined ? rep.startTime : Math.max(0, t - 1);
    const end = rep.endTime !== undefined ? rep.endTime : t + 2;
    return {
      ...rep,
      originalIndex: idx,
      start,
      end,
      score: rep.score || 0
    };
  }).sort((a, b) => a.start - b.start);

  // Dynamic width to allow scrolling if too many reps
  const minWidthPerRep = 80;
  const chartWidth = Math.max(containerWidth || 600, processedData.length * minWidthPerRep);
  const chartHeight = 240;
  
  const padding = { top: 40, right: 30, bottom: 40, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const minTime = Math.min(...processedData.map(d => d.start), 0);
  const maxTime = Math.max(...processedData.map(d => d.end), minTime + 10);
  const totalDuration = maxTime - minTime;

  const xScale = (time) => {
    return padding.left + ((time - minTime) / Math.max(1, totalDuration)) * innerWidth;
  };

  const yScale = (score) => {
    const s = Math.max(0, Math.min(100, score));
    return padding.top + innerHeight - (s / 100) * innerHeight;
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Generate paths
  // Solid horizontal segments for repetitions
  const segments = processedData.map(rep => {
    const y = yScale(rep.score);
    return {
      ...rep,
      x1: xScale(rep.start),
      x2: xScale(rep.end),
      y: y
    };
  });

  // Dashed lines connecting the end of one rep to the start of the next
  const connections = [];
  for (let i = 0; i < segments.length - 1; i++) {
    connections.push({
      x1: segments[i].x2,
      y1: segments[i].y,
      x2: segments[i + 1].x1,
      y2: segments[i + 1].y
    });
  }

  return (
    <div 
      ref={containerRef}
      className="interactive-card"
      style={{ 
        width: "100%", 
        overflowX: "auto",
        overflowY: "hidden",
        background: "#fff",
        borderRadius: "24px",
        border: "2px solid #111",
        position: "relative",
      }}
    >
      <svg width={chartWidth} height={chartHeight} style={{ display: "block", overflow: "visible" }}>
        
        {/* Y Axis Grid */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = yScale(v);
          return (
            <g key={`grid-y-${v}`}>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f0f0f0" strokeWidth="2" strokeDasharray="4 4" />
              <text x={padding.left - 10} y={y + 4} fontSize="10" fontWeight="900" fill="#ccc" textAnchor="end">{v}</text>
            </g>
          );
        })}

        {/* X Axis Baseline */}
        <line 
          x1={padding.left} 
          y1={chartHeight - padding.bottom} 
          x2={chartWidth - padding.right} 
          y2={chartHeight - padding.bottom} 
          stroke="#111" 
          strokeWidth="2" 
        />

        {/* Connections (Dashed lines between reps) */}
        {connections.map((conn, idx) => (
          <line
            key={`conn-${idx}`}
            x1={conn.x1}
            y1={conn.y1}
            x2={conn.x2}
            y2={conn.y2}
            stroke="#aaa"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.8"
          />
        ))}

        {/* Repetition Segments */}
        {segments.map((seg) => {
          const isActive = seg.originalIndex === activeRepIndex;
          const segColor = isActive ? color : "#111";
          const strokeW = isActive ? 6 : 4;

          return (
            <g 
              key={`rep-${seg.originalIndex}`} 
              onClick={() => { haptic.light(); onRepClick && onRepClick(seg.originalIndex); }}
              style={{ cursor: "pointer" }}
            >
              {/* Highlight background if active */}
              {isActive && (
                <rect 
                  x={seg.x1} 
                  y={padding.top} 
                  width={seg.x2 - seg.x1} 
                  height={innerHeight} 
                  fill={color} 
                  opacity={0.05} 
                  style={{ transition: "all 0.3s ease" }}
                />
              )}

              {/* Horizontal Solid Line */}
              <line 
                x1={seg.x1} 
                y1={seg.y} 
                x2={seg.x2} 
                y2={seg.y} 
                stroke={segColor} 
                strokeWidth={strokeW} 
                strokeLinecap="round" 
                style={{ transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)" }}
              />

              {/* Start and End nodes */}
              <circle cx={seg.x1} cy={seg.y} r={isActive ? 5 : 4} fill={segColor} style={{ transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)" }} />
              <circle cx={seg.x2} cy={seg.y} r={isActive ? 5 : 4} fill={segColor} style={{ transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)" }} />

              {/* Score Bubble */}
              {isActive && (
                <g transform={`translate(${(seg.x1 + seg.x2) / 2}, ${seg.y - 18})`} style={{ animation: "springPop 0.4s var(--spring-easing)" }}>
                  <rect x="-16" y="-12" width="32" height="18" rx="6" fill={color} />
                  <text y="0" textAnchor="middle" fontSize="10" fontWeight="950" fill="#fff" alignmentBaseline="middle">
                    {(seg.score / 10).toFixed(1)}
                  </text>
                  <polygon points="-4,6 4,6 0,10" fill={color} />
                </g>
              )}

              {/* X Axis Time Labels */}
              <text x={seg.x1} y={chartHeight - padding.bottom + 20} textAnchor="middle" fontSize="9" fontWeight="800" fill="#888">
                {formatTime(seg.start)}
              </text>
              <text x={seg.x2} y={chartHeight - padding.bottom + 20} textAnchor="middle" fontSize="9" fontWeight="800" fill="#888">
                {formatTime(seg.end)}
              </text>

              {/* Vertical indicator for active */}
              {isActive && (
                <>
                  <line x1={seg.x1} y1={seg.y} x2={seg.x1} y2={chartHeight - padding.bottom} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity={0.5} />
                  <line x1={seg.x2} y1={seg.y} x2={seg.x2} y2={chartHeight - padding.bottom} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity={0.5} />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
