"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Layers, Activity } from "lucide-react";
import { getWeeklyTargets } from "@/utils/timeEngine";
import { haptic } from "@/utils/haptics";

const CATEGORY_ORDER = ["atletica", "ssg", "body_workout", "recovery", "tecnica", "meditation"];

const COLORS = {
  atletica:     "oklch(60% 0.22 26)", // Rosso
  ssg:          "#FF4D80",            // Rosa
  body_workout: "#CCFF00",            // Giallo Fluo Verdino
  recovery:     "#A3FF66",            // Verde Chiaro
  tecnica:      "#4F46E5",            // Indigo
  meditation:   "#A855F7",            // Viola
};

const LABELS = {
  atletica:     "Athletic",
  ssg:          "SSG",
  body_workout: "Body Workout",
  recovery:     "Recovery",
  tecnica:      "Technique",
  meditation:   "Meditation",
};

const FILTER_KEYS = ["ALL", ...CATEGORY_ORDER];

/* ── Mini rings SVG inside each calendar cell ── */
function MiniRings({ rings, size = 36, filterCat }) {
  const cx = size / 2, cy = size / 2;
  const maxR = cx - 2;
  
  // Se filtrato, mostriamo solo l'anello selezionato; escludiamo quelli con target 0
  const visibleRings = (filterCat === "ALL" ? rings : rings.filter(r => r.id === filterCat))
    .filter(r => r.target > 0);
  const step  = maxR / Math.max(1, rings.length);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      {visibleRings.map((r) => {
        const origIndex = rings.findIndex(orig => orig.id === r.id);
        const radius = maxR - (origIndex >= 0 ? origIndex : 0) * step * 0.85;
        if (radius < 2) return null;
        const circ   = 2 * Math.PI * radius;
        const pct    = Math.min(1, (r.actual || 0) / (r.target || 1));
        const offset = circ * (1 - pct);
        return (
          <g key={r.id}>
            <circle cx={cx} cy={cy} r={radius} fill="none"
              stroke="rgba(0,0,0,0.08)" strokeWidth={2.6} />
            <circle cx={cx} cy={cy} r={radius} fill="none"
              stroke={r.color} strokeWidth={2.6}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`} />
          </g>
        );
      })}
    </svg>
  );
}

/* ── Big Animated Ring for Day View ── */
function BigAnimatedRing({ rings, onClick }) {
  const size = 260;
  const cx = size / 2, cy = size / 2;
  const maxR = cx - 12;
  const step = 17; // ridotto lo step per far entrare tutti i 6 anelli

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Percentuale globale
  const activeRings = rings.filter(r => r.target > 0);
  let totalTarget = 0;
  let totalActual = 0;
  activeRings.forEach(r => {
    totalTarget += r.target;
    totalActual += r.actual;
  });
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalActual / totalTarget) * 100)) : 0;

  return (
    <div 
      onClick={() => { haptic.medium(); onClick(); }}
      style={{
        width: size, height: size, margin: "0 auto", position: "relative",
        cursor: "pointer",
        transform: mounted ? "scale(1)" : "scale(0.85)",
        opacity: mounted ? 1 : 0,
        transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
        filter: mounted ? "drop-shadow(0 25px 35px rgba(0,0,0,0.2))" : "drop-shadow(0 0px 0px rgba(0,0,0,0))"
      }}
      className="pseudo-haptic hover-lift"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((r, i) => {
          const radius = maxR - i * step;
          if (radius < 10) return null;
          if (r.target === 0) return null; // non disegnare se non c'è target

          const circ = 2 * Math.PI * radius;
          const pct = Math.min(1, (r.actual || 0) / (r.target || 1));
          const targetOffset = circ * (1 - pct);
          const currentOffset = mounted ? targetOffset : circ;
          
          return (
            <g key={r.id}>
              {/* Background ring */}
              <circle cx={cx} cy={cy} r={radius} fill="none"
                stroke="rgba(0,0,0,0.05)" strokeWidth={11} />
              {/* Filled ring */}
              <circle cx={cx} cy={cy} r={radius} fill="none"
                stroke={r.color} strokeWidth={11}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={currentOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: `stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + i * 0.05}s` }}
              />
            </g>
          );
        })}
      </svg>

      {/* Testo al centro */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)", textAlign: "center"
      }}>
        <div style={{ fontSize: "3.2rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: "#111" }}>{overallPct}<span style={{ fontSize: "1.6rem" }}>%</span></div>
        <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--gray-dim)", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 6 }}>
          Completed
        </div>
      </div>
    </div>
  );
}

const formatItalianDate = (date) => {
  if (!date) return "";
  const weekday = date.toLocaleDateString("it-IT", { weekday: "long" });
  const day = date.toLocaleDateString("it-IT", { day: "numeric" });
  const month = date.toLocaleDateString("it-IT", { month: "long" });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
};

/* ══════════════ MAIN PAGE ══════════════ */
export default function RingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [allLogs, setAllLogs] = useState({});
  const [weeklyTargets, setTargets] = useState({});
  
  // -- State Machine per Navigazione --
  // viewState: "calendar" | "day" | "breakdown"
  const [viewState, setViewState] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(null);
  
  // -- State per Filtro --
  const [filterCatIndex, setFilterCatIndex] = useState(0);
  const filterCat = FILTER_KEYS[filterCatIndex];

  useEffect(() => {
    setMounted(true);
    const load = () => {
      setTargets(getWeeklyTargets());
      const ls = localStorage.getItem("elite_pro_daily_logs");
      setAllLogs(ls ? JSON.parse(ls) : {});
    };
    load();
    window.addEventListener("elite_time_logged", load);
    return () => window.removeEventListener("elite_time_logged", load);
  }, []);

  // ── helpers ──
  const fmtId  = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const daysInMonth   = d => new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  const startDayIndex = d => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const getRings = (year, month, day) => {
    const d   = new Date(year, month, day);
    const dow = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const t   = weeklyTargets[dow] || {};
    const l   = allLogs[fmtId(d)] || {};
    
    return CATEGORY_ORDER.map(k => ({
      id: k,
      color: COLORS[k] || "#ccc",
      target: t[k]?.target || 0,
      actual: l[k]?.total || 0,
      label: LABELS[k] || k
    }));
  };

  const dayRings = selectedDate ? getRings(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : [];

  const handleSelectDay = (day) => {
    haptic.medium();
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    setViewState("day");
  };

  const handleCycleFilter = () => {
    haptic.light();
    setFilterCatIndex((prev) => (prev + 1) % FILTER_KEYS.length);
  };

  if (!mounted) return null;

  const today = new Date();
  const monthName = viewDate.toLocaleString("default", { month: "long" });

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      
      {/* ── HEADER ── */}
      <header style={{
        background: "#fff", padding: "20px 20px 12px", borderBottom: "4px solid #111",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 30
      }}>
        <button onClick={() => {
          haptic.light();
          if (viewState === "breakdown") setViewState("day");
          else if (viewState === "day") { setViewState("calendar"); setSelectedDate(null); }
          else router.back();
        }} className="btn-secondary" style={{
          width: 40, height: 40, borderRadius: 12, background: "#fff", border: "2px solid #111",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <ChevronLeft size={20} color="#111" strokeWidth={3} />
        </button>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
            {viewState === "calendar" ? "Rings Grid" : viewState === "day" ? "Day Recap" : "Breakdown"}
          </h1>
          {selectedDate && viewState !== "calendar" && (
            <p style={{ fontSize: "0.65rem", fontWeight: 900, color: "var(--primary)", margin: 0, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
          )}
        </div>
        <div style={{ width: 40, height: 40 }} />
      </header>

      {/* ── VIEW 1: CALENDAR CON FILTRO ── */}
      {viewState === "calendar" && (
        <div className="v-stack" style={{ padding: "24px 16px", flex: 1 }}>
          <div className="card-dark" style={{ background: "#fff", border: "2px solid #111", padding: "20px 16px", borderRadius: 24, boxShadow: "4px 4px 0px #111" }}>
            {/* Month nav */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <button onClick={() => { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 1)); haptic.light(); }}
                style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                <ChevronLeft size={18} color="#111" strokeWidth={3} />
              </button>
              <span style={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase" }}>
                {monthName} {viewDate.getFullYear()}
              </span>
              <button onClick={() => { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 1)); haptic.light(); }}
                style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                <ChevronRight size={18} color="#111" strokeWidth={3} />
              </button>
            </div>

            {/* Week day labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: "0.6rem", fontWeight: 900, color: "var(--gray-dim)" }}>{d}</div>
              ))}
            </div>

            {/* Days */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
              {Array.from({ length: startDayIndex(viewDate) }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth(viewDate) }).map((_, i) => {
                const day    = i + 1;
                const rings  = getRings(viewDate.getFullYear(), viewDate.getMonth(), day);
                const isTod  = day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
                const hasDayTargets = rings.some(r => r.target > 0);

                return (
                  <button
                    key={day}
                    onClick={() => handleSelectDay(day)}
                    className="hover-lift pseudo-haptic"
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                      padding: "8px 2px", borderRadius: 16, border: isTod ? "2px solid #111" : "2px solid transparent",
                      background: isTod ? "var(--surface-light)" : "transparent", cursor: "pointer", minHeight: 64
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", fontWeight: 900, color: "#111" }}>{day}</span>
                    {hasDayTargets ? (
                      <MiniRings rings={rings} size={36} filterCat={filterCat} />
                    ) : (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e0e0e0" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* FLOATING FILTER SWITCH */}
          <button 
            onClick={handleCycleFilter}
            className="hover-lift pseudo-haptic anim-spring-pop"
            style={{
              position: "fixed", bottom: 110, right: 24, zIndex: 50,
              width: 64, height: 64, borderRadius: "50%", background: "#fff", border: "3px solid #111",
              display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "4px 4px 0px #111",
              overflow: "hidden"
            }}
          >
            {filterCat === "ALL" ? (
              <Layers size={28} color="#111" strokeWidth={2.5} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `6px solid ${COLORS[filterCat]}` }} />
            )}
            <div style={{ position: "absolute", bottom: 2, fontSize: "0.45rem", fontWeight: 900, textTransform: "uppercase", color: "#111" }}>
              {filterCat === "ALL" ? "ALL" : filterCat.slice(0,3)}
            </div>
          </button>
        </div>
      )}

      {/* ── VIEW 2: BIG RING ── */}
      {viewState === "day" && selectedDate && (() => {
        const totalActual = dayRings.reduce((sum, r) => sum + r.actual, 0);
        const totalTarget = dayRings.reduce((sum, r) => sum + r.target, 0);
        const remainingTime = Math.max(0, totalTarget - totalActual);
        const hasTargets = dayRings.some(r => r.target > 0);
        
        return (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 24px" }}>
            <div className="card-dark" style={{ background: "#fff", border: "3px solid #111", padding: "40px 20px", borderRadius: 32, boxShadow: "6px 6px 0px #111", textAlign: "center" }}>
               
               <div style={{ marginBottom: 32 }}>
                 <h2 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase", lineHeight: 1 }}>
                   Total <span className="brush-highlight">Volume</span>
                 </h2>
                 <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--primary)", marginTop: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                   {formatItalianDate(selectedDate)}
                 </div>
                 <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gray-dim)", marginTop: 8 }}>
                   Click the core ring to inspect progress breakdown.
                 </p>
               </div>

               {hasTargets ? (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <BigAnimatedRing rings={dayRings} onClick={() => setViewState("breakdown")} />
                    </div>

                    <div style={{ 
                      marginTop: 24, padding: "16px 20px", background: "var(--surface-light)", 
                      borderRadius: 20, border: "2px solid #111", textAlign: "left"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", color: "#111" }}>Completato:</span>
                        <span style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--primary)" }}>{totalActual} min / {totalTarget} min</span>
                      </div>
                      {remainingTime > 0 ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", color: "var(--gray-dim)" }}>Mancante:</span>
                          <span style={{ fontSize: "1.05rem", fontWeight: 900, color: "#ef4444" }}>{remainingTime} min</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#10b981", textTransform: "uppercase", textAlign: "center", marginTop: 4 }}>
                          Tutti i target completati! 🎉
                        </div>
                      )}
                    </div>
                  </>
               ) : (
                 <div style={{ padding: "60px 0", opacity: 0.5 }}>
                   <Activity size={64} style={{ margin: "0 auto", marginBottom: 16 }} />
                   <h3 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase" }}>Empty Schedule</h3>
                   <p style={{ fontSize: "0.8rem", fontWeight: 700 }}>No tracking targets found for this date.</p>
                 </div>
               )}
            </div>
          </div>
        );
      })()}

      {/* ── VIEW 3: BREAKDOWN ── */}
      {viewState === "breakdown" && selectedDate && (() => {
        const activeRings = dayRings.filter(r => r.target > 0);
        return (
          <div style={{ flex: 1, padding: "32px 24px" }}>
             <h2 style={{ fontSize: "2.2rem", fontWeight: 900, textTransform: "uppercase", marginBottom: 32, lineHeight: 1 }}>
               <span className="brush-highlight">Breakdown</span>
             </h2>

             <div className="v-stack" style={{ gap: 24 }}>
                {activeRings.length > 0 ? (
                   activeRings.map((r, index) => {
                     const pct = r.target > 0 ? Math.min(100, Math.round((r.actual / r.target) * 100)) : 0;
                     return (
                       <div key={r.id} style={{ 
                         background: "#fff", border: "2px solid #111", borderRadius: 20, padding: "20px",
                         boxShadow: "4px 4px 0px #111", animation: `slideUp 0.4s ease forwards ${index * 0.1}s`,
                         opacity: 0, transform: "translateY(20px)"
                       }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                             <span style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", color: "#111" }}>{r.label}</span>
                             <span style={{ fontSize: "1.4rem", fontWeight: 900, color: r.color }}>{pct}%</span>
                          </div>
                          {/* Progress Bar Container */}
                          <div style={{ width: "100%", height: 18, background: "var(--surface)", borderRadius: 99, overflow: "hidden", position: "relative", border: "1px solid rgba(0,0,0,0.05)" }}>
                             {/* Animated Fill */}
                             <div style={{
                               position: "absolute", top: 0, left: 0, bottom: 0, width: `${pct}%`,
                               background: r.color, borderRadius: 99,
                               animation: `fillBar 1s cubic-bezier(0.22, 1, 0.36, 1) ${0.2 + index * 0.1}s forwards`,
                               transformOrigin: "left", transform: "scaleX(0)"
                             }} />
                          </div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--gray-dim)", marginTop: 10, textAlign: "right", textTransform: "uppercase" }}>
                             {r.actual} / {r.target} mins
                          </div>
                       </div>
                     );
                   })
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", color: "#ccc", fontWeight: 900 }}>No data available</div>
                )}
             </div>
          </div>
        );
      })()}

      {/* Global CSS per le animazioni interne (senza framer-motion) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fillBar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes slideUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      <div style={{ height: 120 }} />
    </div>
  );
}
