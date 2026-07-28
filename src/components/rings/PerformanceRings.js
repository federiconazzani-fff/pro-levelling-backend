"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, CheckCircle2 } from "lucide-react";

const COLORS = {
  tecnica: "var(--color-tecnica)",
  atletica: "var(--color-atletica)",
  body_workout: "var(--color-body-workout)",
  ssg: "var(--color-ssg)",
  recovery: "var(--color-recovery)",
  meditation: "var(--color-meditation)",
  team_training: "var(--foreground)" // Although it won't generate a ring, keep for reference
};

const LABELS = {
  tecnica: "Tecnica",
  atletica: "Atletica",
  body_workout: "Body Workout",
  ssg: "Small Sided Games",
  recovery: "Recovery",
  meditation: "Meditazione"
};

const Ring = ({ radius, color, target, actual, label, thickness = 10, onClick }) => {
  const circumference = 2 * Math.PI * radius;
  const safeTarget = target > 0 ? target : 1; // Prevent div by zero
  const rawPercent = (actual / safeTarget) * 100;
  const percent = Math.min(100, rawPercent); // Cap at 100%
  const offset = circumference - (percent / 100) * circumference;
  
  const overtrainingText = actual > target ? `+ ${actual - target}m` : null;

  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }} className="interactive-ring">
      {/* Background Track */}
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="var(--surface-light)"
        strokeWidth={thickness}
      />
      {/* Progress Track */}
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s var(--spring-easing)" }}
        transform="rotate(-90 100 100)"
      />
      {/* Overtraining Text Indicator (if applicable) - Rendered conceptually */}
      {/* We'll handle overtraining text outside the SVG for better DOM positioning, 
          but adding a small dot on the ring itself is a nice touch if desired */}
    </g>
  );
};

export default function PerformanceRings({ todayTargets = {}, todayLogs = {}, initialLevel = 2 }) {
  const [level, setLevel] = useState(initialLevel); // Default to nested rings
  const [activeMacro, setActiveMacro] = useState(null);

  // Exclude team_training from rings logic
  const ringCategories = Object.keys(todayTargets).filter(k => k !== "team_training");
  const hasTeamTraining = todayTargets["team_training"] !== undefined;
  const teamTrainingTarget = todayTargets["team_training"]?.target || 0;
  const teamTrainingLogged = todayLogs["team_training"]?.completed || false;

  // Level 1 Computed
  const totalTarget = ringCategories.reduce((acc, cat) => acc + (todayTargets[cat]?.target || 0), 0);
  const totalActual = ringCategories.reduce((acc, cat) => acc + (todayLogs[cat]?.total || 0), 0);
  const totalPercent = totalTarget > 0 ? Math.min(100, Math.round((totalActual / totalTarget) * 100)) : 0;
  const totalOvertrain = totalActual > totalTarget ? totalActual - totalTarget : 0;

  // Level 2 Computed (Macros)
  const macrosData = ringCategories.map(cat => {
    const target = todayTargets[cat].target;
    const actual = todayLogs[cat]?.total || 0;
    return { id: cat, target, actual, color: COLORS[cat], label: LABELS[cat] };
  }).sort((a, b) => b.target - a.target); // Largest rings outside

  // Level 3 Computed (Micro)
  let microData = [];
  if (level === 3 && activeMacro && todayTargets[activeMacro]?.microAreas) {
    microData = todayTargets[activeMacro].microAreas.map(m => {
      const target = m.target;
      const actual = todayLogs[activeMacro]?.microAreas?.[m.name] || 0;
      return { id: m.name, target, actual, color: COLORS[activeMacro], label: m.name }; // Use parent's color
    });
  }

  // Ring Radii distribution
  const getRadii = (count) => {
    const baseRadius = 80;
    const gap = 14;
    return Array.from({ length: count }, (_, i) => baseRadius - (i * gap));
  };

  const handleLevelUp = () => {
    if (level === 3) {
      setLevel(2);
      setActiveMacro(null);
    } else if (level === 2) {
      setLevel(1);
    }
  };

  const handleMacroClick = (macroId) => {
    const hasMicro = todayTargets[macroId]?.microAreas?.length > 0;
    if (hasMicro) {
      setActiveMacro(macroId);
      setLevel(3);
    }
  };

  return (
    <div className="v-stack" style={{ gap: "24px", alignItems: "center" }}>
      
      {/* Header / Navigation */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "32px" }}>
        {level > 1 ? (
          <button onClick={handleLevelUp} className="h-stack interactive-btn" style={{ fontWeight: "700", color: "var(--gray-dim)" }}>
            <ChevronLeft size={20} /> Back
          </button>
        ) : <div />}
        <span style={{ fontWeight: "800", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "1px", color: "var(--foreground)" }}>
          {level === 1 ? "Daily Total" : level === 2 ? "Macro Categories" : LABELS[activeMacro]}
        </span>
        <div />
      </div>

      {/* SVG Container */}
      <div style={{ position: "relative", width: "260px", height: "260px", margin: "0 auto" }}>
        <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
          {level === 1 && (
            <Ring 
              radius={80} 
              color="var(--primary)" 
              target={totalTarget} 
              actual={totalActual} 
              thickness={12} 
              onClick={() => setLevel(2)}
            />
          )}

          {level === 2 && macrosData.map((m, i) => (
            <Ring 
              key={m.id} 
              radius={getRadii(macrosData.length)[i]} 
              color={m.color} 
              target={m.target} 
              actual={m.actual} 
              thickness={10}
            />
          ))}

          {level === 3 && microData.map((m, i) => (
             <Ring 
             key={m.id} 
             radius={getRadii(microData.length)[i]} 
             color={m.color} 
             target={m.target} 
             actual={m.actual} 
             thickness={10}
             /* Slightly varying opacity for micro areas of the same color */
             style={{ opacity: 1 - (i * 0.15) }} 
           />
          ))}
        </svg>

        {/* Center Text overlay */}
        <div 
          onClick={level === 1 ? () => { if (macrosData.length > 0) setLevel(2) } : handleLevelUp}
          style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            textAlign: "center", cursor: level === 1 && macrosData.length > 0 ? "pointer" : "default",
            width: "120px", display: "flex", flexDirection: "column", alignItems: "center"
          }}
        >
          {level === 1 && (
            <>
              <span style={{ fontSize: "2.5rem", fontWeight: "900", fontFamily: "var(--font-heading)", lineHeight: "1" }}>{totalPercent}%</span>
              <span style={{ fontSize: "0.8rem", color: "var(--gray-dim)", fontWeight: "600", marginTop: "4px" }}>
                {totalActual} / {totalTarget}m
              </span>
              {totalOvertrain > 0 && (
                <span className="text-reward" style={{ fontSize: "0.9rem", marginTop: "4px" }}>+{totalOvertrain}m</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend & Details */}
      <div style={{ width: "100%", background: "var(--surface)", borderRadius: "24px", padding: "16px", marginTop: "8px" }}>
        {level === 1 && (
          <div className="v-stack" style={{ gap: "12px", alignItems: "center" }}>
            <span style={{ fontWeight: "700", color: "var(--gray-dim)", fontSize: "0.9rem" }}>Tap the ring to expand macros</span>
            
            {hasTeamTraining && (
              <div style={{ width: "100%", borderTop: "1px solid var(--surface-light)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "800" }}>Team Training</span>
                <div className="h-stack">
                  <span style={{ fontWeight: "700", color: teamTrainingLogged ? "var(--color-success)" : "var(--gray-dim)" }}>
                    {teamTrainingTarget}m
                  </span>
                  <CheckCircle2 color={teamTrainingLogged ? "var(--color-success)" : "var(--surface-light)"} fill={teamTrainingLogged ? "#fff" : "none"} />
                </div>
              </div>
            )}
          </div>
        )}

        {level === 2 && (
          <div className="v-stack" style={{ gap: "12px" }}>
             {macrosData.map(m => {
               const over = m.actual > m.target ? m.actual - m.target : 0;
               return (
                 <div 
                   key={m.id} 
                   onClick={() => handleMacroClick(m.id)}
                   className={`h-stack ${todayTargets[m.id]?.microAreas?.length > 0 ? 'interactive-card' : ''}`}
                   style={{ justifyContent: "space-between", padding: "8px", borderRadius: "12px", cursor: todayTargets[m.id]?.microAreas?.length > 0 ? "pointer" : "default" }}
                 >
                   <div className="h-stack">
                     <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: m.color }} />
                     <span style={{ fontWeight: "800" }}>{m.label}</span>
                   </div>
                   <div className="h-stack" style={{ gap: "12px" }}>
                     {over > 0 && <span className="text-reward">+{over}m</span>}
                     <span style={{ fontWeight: "700", color: "var(--gray-dim)" }}>{m.actual}/{m.target}m</span>
                   </div>
                 </div>
               )
             })}
          </div>
        )}

        {level === 3 && (
          <div className="v-stack" style={{ gap: "12px" }}>
             {microData.map((m, i) => {
               const over = m.actual > m.target ? m.actual - m.target : 0;
               return (
                 <div key={m.id} className="h-stack" style={{ justifyContent: "space-between", padding: "8px" }}>
                   <div className="h-stack">
                     <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: m.color, opacity: 1 - (i * 0.15) }} />
                     <span style={{ fontWeight: "800" }}>{m.label}</span>
                   </div>
                   <div className="h-stack" style={{ gap: "12px" }}>
                     {over > 0 && <span className="text-reward">+{over}m</span>}
                     <span style={{ fontWeight: "700", color: "var(--gray-dim)" }}>{m.actual}/{m.target}m</span>
                   </div>
                 </div>
               )
             })}
          </div>
        )}
      </div>

      <style jsx>{`
        .interactive-ring {
          transition: transform 0.2s;
          transform-origin: center;
        }
        .interactive-ring:active {
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
}
