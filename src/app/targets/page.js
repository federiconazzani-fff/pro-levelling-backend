"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Check, Zap, Target, Activity, Flame, Edit3, X } from "lucide-react";
import { haptic } from "@/utils/haptics";
import { getVideoScore } from "@/utils/analyticsDb";
import { calculateActualPerformance, getGpsActuals } from "@/utils/performanceUtils";

const DAYS = [
  { key: "lun", label: "LUN" },
  { key: "mar", label: "MAR" },
  { key: "mer", label: "MER" },
  { key: "gio", label: "GIO" },
  { key: "ven", label: "VEN" },
  { key: "sab", label: "SAB" },
  { key: "dom", label: "DOM" }
];

const CATEGORIES = [
  { id: "atletica", label: "Atletica", color: "oklch(60% 0.22 26)" },
  { id: "ssg", label: "Small Sided Games", color: "#FF4D80" },
  { id: "body_workout", label: "Body Workout", color: "#CCFF00" },
  { id: "recovery", label: "Recovery", color: "#A3FF66" },
  { id: "tecnica", label: "Tecnica", color: "#4F46E5" }, 
  { id: "meditation", label: "Meditazione", color: "#A855F7" },
  { id: "team_training", label: "Team Training", color: "#393E46" }
];

// Reusable Grade Slider
const GradeSlider = ({ label, value, onChange, color }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: "900", textTransform: "uppercase", fontSize: "0.85rem" }}>{label}</span>
        <span style={{ fontWeight: "900", color: value ? color : "var(--gray-dim)", fontSize: "1.2rem" }}>{value || "-"}</span>
      </div>
      <div style={{ display: "flex", gap: "4px" }}>
        {[1,2,3,4,5,6,7,8,9,10].map(num => (
          <div 
            key={num}
            onClick={() => { haptic.light(); onChange(num); }}
            style={{ 
              flex: 1, 
              height: "24px", 
              background: num <= value ? color : "var(--surface)",
              border: "2px solid #111",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: num === parseInt(value) ? "scaleY(1.3)" : "scaleY(1)",
              opacity: num <= value ? 1 : 0.5
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default function TargetsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const tecnicaColor = CATEGORIES.find(c => c.id === 'tecnica')?.color || "#4F46E5";
  const atleticaColor = CATEGORIES.find(c => c.id === 'atletica')?.color || "oklch(60% 0.22 26)";

  // States
  const [planner, setPlanner] = useState(() => {
    const initial = {};
    CATEGORIES.forEach(c => {
      initial[c.id] = { lun: '', mar: '', mer: '', gio: '', ven: '', sab: '', dom: '' };
    });
    return initial;
  });

  const [grades, setGrades] = useState({
    tecnica: { generale: '', dribbling: '', tiro: '', passaggio: '', primo_tocco: '', controllo_palla: '' },
    atletica: { generale: '', velocita: '', coordinazione: '', agilita: '', cambi_direzione: '', pliometria: '' }
  });

  const [gps, setGps] = useState({ km_day: '', top_speed: '', total_km: '', avg_speed: '', duration: '' });

  const [matches, setMatches] = useState({
    goals: '', assists: '', shoot_attempted: '', dribblings_attempted: '',
    successfully_dribblings: '', passes_attempted: '', successfully_passes: '',
    successfully_first_touches: '', balls_recovered: ''
  });

  const [expandedCat, setExpandedCat] = useState("tecnica");
  const [isEditing, setIsEditing] = useState(false);
  const [actualGrades, setActualGrades] = useState({ tecnica: {}, atletica: {} });
  const [actualGps, setActualGps] = useState({ km_day: 0, top_speed: 0, total_km: 0, avg_speed: 0, total_duration: 0 });

  const calculateActualGrades = () => {
    if (typeof window === "undefined") return;
    const library = JSON.parse(localStorage.getItem("elite_pro_library") || "[]");
    const gpsData = JSON.parse(localStorage.getItem("elite_pro_gps_data") || "[]");
    
    setActualGrades(calculateActualPerformance(library));
    setActualGps(getGpsActuals(gpsData));
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("elite_pro_comprehensive_targets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.planner) setPlanner(prev => ({ ...prev, ...parsed.planner }));
        if (parsed.grades) setGrades(prev => ({ ...prev, ...parsed.grades }));
        if (parsed.gps) setGps(prev => ({ ...prev, ...parsed.gps }));
        if (parsed.matches) setMatches(prev => ({ ...prev, ...parsed.matches }));
        setIsEditing(false); // Default to read-only if saved data exists
      } catch (e) {
        console.error("Error parsing targets", e);
        setIsEditing(true);
      }
    } else {
      setIsEditing(true); // Default to edit mode if no data
    }
    calculateActualGrades();
  }, []);

  const getAverageGrade = (domain) => {
    const fields = domain === 'tecnica'
      ? ['dribbling', 'tiro', 'passaggio', 'primo_tocco', 'controllo_palla']
      : ['velocita', 'coordinazione', 'agilita', 'cambi_direzione', 'pliometria'];
    
    let sum = 0;
    let count = 0;
    fields.forEach(f => {
      const val = parseFloat(grades[domain]?.[f]);
      if (!isNaN(val) && val > 0) {
        sum += val;
        count++;
      }
    });
    return count > 0 ? (sum / count).toFixed(1) : "-";
  };

  const handleSave = () => {
    haptic.heavy();
    
    // Auto-calculate macro averages before saving
    const computedTecnicaGenerale = getAverageGrade('tecnica');
    const computedAtleticaGenerale = getAverageGrade('atletica');
    
    const updatedGrades = {
      ...grades,
      tecnica: {
        ...grades.tecnica,
        generale: computedTecnicaGenerale === "-" ? "" : computedTecnicaGenerale
      },
      atletica: {
        ...grades.atletica,
        generale: computedAtleticaGenerale === "-" ? "" : computedAtleticaGenerale
      }
    };

    const dataToSave = { planner, grades: updatedGrades, gps, matches };
    localStorage.setItem("elite_pro_comprehensive_targets", JSON.stringify(dataToSave));
    
    // Sync with time engine
    const engineFormat = {
      monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {}, saturday: {}, sunday: {}
    };
    const dayMap = { lun: "monday", mar: "tuesday", mer: "wednesday", gio: "thursday", ven: "friday", sab: "saturday", dom: "sunday" };
    
    CATEGORIES.forEach(cat => {
      const config = planner[cat.id];
      if (!config) return;
      DAYS.forEach(d => {
        const val = parseInt(config[d.key]);
        if (!isNaN(val) && val > 0) {
          engineFormat[dayMap[d.key]][cat.id] = { target: val };
        }
      });
    });
    localStorage.setItem("elite_pro_weekly_targets", JSON.stringify(engineFormat));
    setGrades(updatedGrades);
    setIsEditing(false);
    calculateActualGrades();
    haptic.medium();
  };

  const updateMin = (catId, dayKey, val) => {
    haptic.light();
    let cleanVal = val;
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed < 0) {
      cleanVal = "0";
    }
    setPlanner(prev => ({ ...prev, [catId]: { ...prev[catId], [dayKey]: cleanVal } }));
  };

  const handleGradeChange = (domain, field, val) => {
    let cleanVal = val;
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed < 0) {
      cleanVal = "0";
    }
    setGrades(prev => ({
      ...prev,
      [domain]: { ...prev[domain], [field]: cleanVal }
    }));
  };

  if (!mounted) return null;

  return (
    <div className="app-container page-wrapper" style={{ background: "var(--background)", minHeight: "100vh", paddingBottom: "120px", color: "var(--foreground)" }}>
      
      {/* HEADER - Elegant & Paper-like */}
      <div style={{ 
        padding: "20px 24px", position: "sticky", top: 0, zIndex: 100, 
        background: "#fff", borderBottom: "3px solid #111",
        display: "flex", alignItems: "center", gap: "16px",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.05)"
      }}>
        <button 
          onClick={() => { haptic.medium(); router.back(); }} 
          className="pseudo-haptic"
          style={{ width: "48px", height: "48px", borderRadius: "14px", border: "2.5px solid #111", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#111" }}
        >
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "900", textTransform: "uppercase", fontFamily: "var(--font-heading)", letterSpacing: "0.05em", lineHeight: 1, color: "#111" }}>
            Performance
          </h2>
          <span className="brush-highlight" style={{ color: "var(--primary)", alignSelf: "flex-start", marginTop: "4px", fontSize: "0.9rem" }}>TARGETS</span>
        </div>
        {isEditing ? (
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              onClick={() => { haptic.medium(); setIsEditing(false); }}
              className="pseudo-haptic"
              style={{ width: "48px", height: "48px", borderRadius: "14px", border: "2.5px solid #111", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#111", boxShadow: "4px 4px 0px #111" }}
            >
              <X size={24} strokeWidth={3} />
            </button>
            <button 
              onClick={handleSave}
              className="pseudo-haptic"
              style={{ width: "48px", height: "48px", borderRadius: "14px", border: "2.5px solid #111", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary)", color: "#fff", boxShadow: "4px 4px 0px #111" }}
            >
              <Save size={24} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { haptic.medium(); setIsEditing(true); }}
            className="pseudo-haptic"
            style={{ width: "110px", height: "48px", borderRadius: "14px", border: "2.5px solid #111", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "var(--primary)", color: "#fff", boxShadow: "4px 4px 0px #111", fontWeight: "900", textTransform: "uppercase", fontSize: "0.8rem" }}
          >
            <Edit3 size={18} strokeWidth={3} />
            EDIT
          </button>
        )}
      </div>

      <div style={{ padding: "32px 20px", display: "flex", flexDirection: "column", gap: "48px" }}>
        
        {/* 1. WEEKLY AUTOMATOR */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <Zap size={28} color="var(--primary)" fill="var(--primary)" />
            <h3 style={{ fontSize: "1.8rem", fontWeight: "900", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
              Time Automator
            </h3>
          </div>

          {/* Visual Matrix */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", border: "3px solid #111", borderRadius: "16px", overflow: "hidden", marginBottom: "24px", background: "#fff", boxShadow: "4px 4px 0px #111" }}>
            {DAYS.map((day, idx) => (
              <div key={day.key} style={{ borderRight: idx < 6 ? "2px solid #111" : "none", display: "flex", flexDirection: "column" }}>
                <div style={{ background: "var(--surface)", padding: "8px 0", textAlign: "center", borderBottom: "2px solid #111", fontWeight: "900", fontSize: "0.8rem", textTransform: "uppercase" }}>
                  {day.label}
                </div>
                <div style={{ padding: "12px 4px", minHeight: "60px", display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "flex-start", gap: "-6px" }}>
                  {CATEGORIES.map((cat, i) => {
                    if (parseInt(planner[cat.id]?.[day.key]) > 0) {
                      return (
                        <div key={cat.id} style={{ marginLeft: i > 0 ? "-8px" : "0", zIndex: i }}>
                          <Check size={28} color={cat.color} strokeWidth={4} style={{ filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.5))" }} />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="v-stack" style={{ gap: "16px" }}>
            {CATEGORIES.map(cat => {
              const isExpanded = expandedCat === cat.id;
              const config = planner[cat.id];
              const totalMin = config ? Object.values(config).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0) : 0;

              return (
                <div key={cat.id} style={{ 
                  border: "3px solid #111", 
                  borderRadius: "20px", 
                  background: isExpanded ? "#fff" : "var(--surface)",
                  boxShadow: isExpanded ? `6px 6px 0px ${cat.color}` : "none",
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  overflow: "hidden"
                }}>
                  {/* Header */}
                  <div 
                    onClick={() => { haptic.light(); setExpandedCat(isExpanded ? null : cat.id); }}
                    style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ 
                        fontWeight: "900", textTransform: "uppercase", fontSize: "1.2rem", color: "var(--foreground)",
                        textDecoration: isExpanded ? `underline ${cat.color} 4px` : "none",
                        textUnderlineOffset: "4px"
                      }}>
                        {cat.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "900", fontSize: "1.2rem" }}>{totalMin}m</span>
                      <span style={{ fontWeight: "800", fontSize: "0.8rem", opacity: 0.5, textTransform: "uppercase" }}>/ week</span>
                    </div>
                  </div>

                  {/* Body */}
                  {isExpanded && (
                    <div className="anim-spring-expand" style={{ padding: "0 20px 24px 20px", display: "flex", flexDirection: "column", gap: "24px" }}>
                      <div>
                        <span style={{ display: "block", fontWeight: "900", textTransform: "uppercase", fontSize: "0.9rem", marginBottom: "12px" }}>Minuti per Giorno:</span>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
                          {DAYS.map(day => {
                            const val = config[day.key];
                            const isActive = parseInt(val) > 0;
                            return (
                              <div key={day.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: "900", color: isActive ? cat.color : "var(--gray-dim)", transition: "color 0.2s" }}>{day.label}</span>
                                <input 
                                  type="number"
                                  placeholder="-"
                                  disabled={!isEditing}
                                  value={val}
                                  onChange={(e) => updateMin(cat.id, day.key, e.target.value)}
                                  className="pseudo-haptic"
                                  style={{ 
                                    width: "100%", height: "48px",
                                    borderRadius: "12px",
                                    border: isActive ? `3px solid ${cat.color}` : "2px solid #111",
                                    background: isActive ? `${cat.color}15` : (isEditing ? "#fff" : "var(--surface)"),
                                    color: isActive ? cat.color : "#111",
                                    fontWeight: "900",
                                    fontSize: "1.2rem",
                                    textAlign: "center",
                                    outline: "none",
                                    boxShadow: (isActive || !isEditing) ? "none" : "3px 3px 0px #111",
                                    transition: "all 0.2s",
                                    padding: 0,
                                    opacity: isEditing ? 1 : 0.8
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. GRADES (VOTI) */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <Target size={28} color="#111" />
            <h3 style={{ fontSize: "1.8rem", fontWeight: "900", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
              Quality Targets
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* TECNICA */}
            <div style={{ background: "#fff", border: "3px solid #111", borderRadius: "24px", padding: "24px", boxShadow: `8px 8px 0px ${tecnicaColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "4px solid #111", paddingBottom: "12px" }}>
                <h4 style={{ color: tecnicaColor, fontSize: "1.6rem", fontWeight: "900", textTransform: "uppercase" }}>Tecnica</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--surface)", padding: "8px 16px", borderRadius: "12px", border: "2px solid #111" }}>
                  <span style={{ fontWeight: "900", fontSize: "0.8rem", textTransform: "uppercase" }}>Target Media:</span>
                  <span style={{ fontSize: "1.4rem", fontWeight: "900", color: tecnicaColor }}>{getAverageGrade('tecnica')}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {['Dribbling', 'Tiro', 'Passaggio', 'Primo_tocco', 'Controllo_palla'].map(skill => {
                  const actual = actualGrades.tecnica[skill.toLowerCase()] || 0;
                  const target = grades.tecnica[skill.toLowerCase()];
                  const progress = target ? (actual / (parseFloat(target) * 10)) * 100 : 0;
                  
                  return (
                    <div key={skill} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {isEditing ? (
                        <GradeSlider label={skill.replace('_', ' ')} value={target} onChange={(val) => handleGradeChange('tecnica', skill.toLowerCase(), val)} color={tecnicaColor} />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontWeight: "900", textTransform: "uppercase", fontSize: "0.9rem" }}>{skill.replace('_', ' ')}</span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                              <span style={{ fontWeight: "900", fontSize: "1.2rem", color: tecnicaColor }}>{(actual / 10).toFixed(1)}</span>
                              <span style={{ fontWeight: "800", fontSize: "0.7rem", opacity: 0.5 }}>/ {target || "-"}</span>
                            </div>
                          </div>
                          <div style={{ height: "12px", background: "var(--surface)", border: "2px solid #111", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
                            <div style={{ width: `${Math.min(100, progress)}%`, height: "100%", background: tecnicaColor, transition: "width 0.5s ease-out" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ATLETICA */}
            <div style={{ background: "#fff", border: "3px solid #111", borderRadius: "24px", padding: "24px", boxShadow: `8px 8px 0px ${atleticaColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "4px solid #111", paddingBottom: "12px" }}>
                <h4 style={{ color: atleticaColor, fontSize: "1.6rem", fontWeight: "900", textTransform: "uppercase" }}>Atletica</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--surface)", padding: "8px 16px", borderRadius: "12px", border: "2px solid #111" }}>
                  <span style={{ fontWeight: "900", fontSize: "0.8rem", textTransform: "uppercase" }}>Target Media:</span>
                  <span style={{ fontSize: "1.4rem", fontWeight: "900", color: atleticaColor }}>{getAverageGrade('atletica')}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {['Velocita', 'Coordinazione', 'Agilita', 'Cambi_direzione', 'Pliometria'].map(skill => {
                  const actual = actualGrades.atletica[skill.toLowerCase()] || 0;
                  const target = grades.atletica[skill.toLowerCase()];
                  const progress = target ? (actual / (parseFloat(target) * 10)) * 100 : 0;

                  return (
                    <div key={skill} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {isEditing ? (
                        <GradeSlider label={skill.replace('_', ' ')} value={target} onChange={(val) => handleGradeChange('atletica', skill.toLowerCase(), val)} color={atleticaColor} />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontWeight: "900", textTransform: "uppercase", fontSize: "0.9rem" }}>{skill.replace('_', ' ')}</span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                              <span style={{ fontWeight: "900", fontSize: "1.2rem", color: atleticaColor }}>{(actual / 10).toFixed(1)}</span>
                              <span style={{ fontWeight: "800", fontSize: "0.7rem", opacity: 0.5 }}>/ {target || "-"}</span>
                            </div>
                          </div>
                          <div style={{ height: "12px", background: "var(--surface)", border: "2px solid #111", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
                            <div style={{ width: `${Math.min(100, progress)}%`, height: "100%", background: atleticaColor, transition: "width 0.5s ease-out" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 3. GPS & MATCHES */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <Activity size={28} color="var(--primary)" />
            <h3 style={{ fontSize: "1.8rem", fontWeight: "900", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
              Performance KPIs
            </h3>
          </div>

          {/* GPS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
            {/* KM / DAY */}
            <div style={{ background: "#fff", border: "3px solid #111", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "4px 4px 0px #111" }}>
              <span style={{ fontWeight: "900", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--gray-dim)" }}>KM / DAY</span>
              {isEditing ? (
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <input type="number" value={gps.km_day} onChange={e => { const v = e.target.value; const p = parseFloat(v); setGps({...gps, km_day: (!isNaN(p) && p < 0) ? "0" : v}); }} placeholder="0" style={{ width: "60px", background: "transparent", border: "none", fontSize: "2.5rem", fontWeight: "900", outline: "none", color: "#111" }} />
                  <span style={{ fontWeight: "900", fontSize: "1rem" }}>km</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{actualGps.km_day.toFixed(1)}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", opacity: 0.5 }}>/ {gps.km_day || "-"} km</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface)", border: "2px solid #111", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (actualGps.km_day / (parseFloat(gps.km_day) || 1)) * 100)}%`, height: "100%", background: "var(--color-gps)" }} />
                  </div>
                </div>
              )}
            </div>

            {/* TOP SPEED */}
            <div style={{ background: "#fff", border: "3px solid #111", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "4px 4px 0px #111" }}>
              <span style={{ fontWeight: "900", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--gray-dim)" }}>TOP SPEED</span>
              {isEditing ? (
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <input type="number" value={gps.top_speed} onChange={e => { const v = e.target.value; const p = parseFloat(v); setGps({...gps, top_speed: (!isNaN(p) && p < 0) ? "0" : v}); }} placeholder="0" style={{ width: "60px", background: "transparent", border: "none", fontSize: "2.5rem", fontWeight: "900", outline: "none", color: "#111" }} />
                  <span style={{ fontWeight: "900", fontSize: "1rem" }}>km/h</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{actualGps.top_speed.toFixed(1)}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", opacity: 0.5 }}>/ {gps.top_speed || "-"} km/h</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface)", border: "2px solid #111", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (actualGps.top_speed / (parseFloat(gps.top_speed) || 1)) * 100)}%`, height: "100%", background: "var(--color-gps)" }} />
                  </div>
                </div>
              )}
            </div>

            {/* TOTAL DISTANCE */}
            <div style={{ background: "#fff", border: "3px solid #111", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "4px 4px 0px #111" }}>
              <span style={{ fontWeight: "900", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--gray-dim)" }}>TOT DISTANCE</span>
              {isEditing ? (
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <input type="number" value={gps.total_km} onChange={e => { const v = e.target.value; const p = parseFloat(v); setGps({...gps, total_km: (!isNaN(p) && p < 0) ? "0" : v}); }} placeholder="0" style={{ width: "60px", background: "transparent", border: "none", fontSize: "2.5rem", fontWeight: "900", outline: "none", color: "#111" }} />
                  <span style={{ fontWeight: "900", fontSize: "1rem" }}>km</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{actualGps.total_km.toFixed(1)}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", opacity: 0.5 }}>/ {gps.total_km || "-"} km</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface)", border: "2px solid #111", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (actualGps.total_km / (parseFloat(gps.total_km) || 1)) * 100)}%`, height: "100%", background: "var(--color-gps)" }} />
                  </div>
                </div>
              )}
            </div>

            {/* AVG SPEED */}
            <div style={{ background: "#fff", border: "3px solid #111", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "4px 4px 0px #111" }}>
              <span style={{ fontWeight: "900", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--gray-dim)" }}>AVG SPEED</span>
              {isEditing ? (
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <input type="number" value={gps.avg_speed} onChange={e => { const v = e.target.value; const p = parseFloat(v); setGps({...gps, avg_speed: (!isNaN(p) && p < 0) ? "0" : v}); }} placeholder="0" style={{ width: "60px", background: "transparent", border: "none", fontSize: "2.5rem", fontWeight: "900", outline: "none", color: "#111" }} />
                  <span style={{ fontWeight: "900", fontSize: "1rem" }}>km/h</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{actualGps.avg_speed.toFixed(1)}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", opacity: 0.5 }}>/ {gps.avg_speed || "-"} km/h</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface)", border: "2px solid #111", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (actualGps.avg_speed / (parseFloat(gps.avg_speed) || 1)) * 100)}%`, height: "100%", background: "var(--color-gps)" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Matches Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
            {[
              { id: 'goals', label: 'Goals', icon: Flame, color: "#ef4444" },
              { id: 'assists', label: 'Assists' },
              { id: 'shoot_attempted', label: 'Shots' },
              { id: 'dribblings_attempted', label: 'Dribbles' },
              { id: 'successfully_dribblings', label: 'Succ. Dribbles' },
              { id: 'passes_attempted', label: 'Passes' },
              { id: 'successfully_passes', label: 'Succ. Passes' },
              { id: 'successfully_first_touches', label: '1st Touch' },
              { id: 'balls_recovered', label: 'Recoveries' }
            ].map(matchField => (
              <div key={matchField.id} style={{ background: "#fff", border: "2.5px solid #111", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", position: "relative", overflow: "hidden" }}>
                {matchField.icon && <matchField.icon size={48} color={matchField.color} style={{ position: "absolute", bottom: "-10px", right: "-10px", opacity: 0.1 }} />}
                <span style={{ fontWeight: "900", fontSize: "0.75rem", textTransform: "uppercase", zIndex: 1 }}>{matchField.label}</span>
                <input 
                  type="number" 
                  placeholder="0"
                  disabled={!isEditing}
                  value={matches[matchField.id]} 
                  onChange={e => { const v = e.target.value; const p = parseInt(v); setMatches({...matches, [matchField.id]: (!isNaN(p) && p < 0) ? "0" : v}); }}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "2px solid #111", fontSize: "1.8rem", fontWeight: "900", outline: "none", zIndex: 1, opacity: isEditing ? 1 : 0.8 }} 
                />
              </div>
            ))}
          </div>
        </section>

      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .anim-spring-expand {
          animation: springExpand 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes springExpand {
          from { opacity: 0; transform: scaleY(0.9); transform-origin: top; }
          to { opacity: 1; transform: scaleY(1); transform-origin: top; }
        }
      `}</style>
    </div>
  );
}
