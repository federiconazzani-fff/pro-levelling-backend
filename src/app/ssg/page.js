"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Calendar, 
  Clock, 
  Target, 
  Save, 
  Trophy, 
  Users,
  Zap,
  ArrowRight,
  Settings,
  Check,
  Activity
} from "lucide-react";
import { useRouter } from "next/navigation";
import { haptic } from "@/utils/haptics";
import { logTime } from "@/utils/timeEngine";

// Reusable Counter Component - Fixed layout for perfect centering
const StatCounter = ({ label, value, onChange, icon: Icon, description }) => (
  <div className="pseudo-haptic" style={{ 
    background: "#fff", 
    border: "2px solid #111", 
    borderRadius: "24px", 
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "8px 8px 0px rgba(0,0,0,0.05)"
  }}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div style={{ background: "var(--surface)", borderRadius: "14px", padding: "12px", border: "2px solid #111" }}>
          <Icon size={22} color="#111" />
        </div>
        <div>
          <span style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
          {description && <p style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--gray-dim)" }}>{description}</p>}
        </div>
      </div>
    </div>
    
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      background: "var(--surface)", 
      padding: "8px", 
      borderRadius: "18px", 
      border: "2px solid #ddd",
      height: "72px"
    }}>
      {/* MINUS ON THE LEFT */}
      <button 
        onClick={() => {
          if (value > 0) {
            haptic.light();
            onChange(value - 1);
          }
        }}
        className="pseudo-haptic"
        style={{ 
          width: "56px", height: "56px", borderRadius: "14px", background: "#fff", border: "2.5px solid #111", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: value > 0 ? 1 : 0.3,
          boxShadow: "3px 3px 0px #111"
        }}
      >
        <Minus size={28} strokeWidth={4} />
      </button>

      {/* NUMBER IN THE CENTER */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <span style={{ fontSize: "2.5rem", fontWeight: "900", fontFamily: "var(--font-heading)", tabularNums: true }}>{value}</span>
      </div>

      {/* PLUS ON THE RIGHT */}
      <button 
        onClick={() => {
          haptic.medium();
          onChange(value + 1);
        }}
        className="pseudo-haptic"
        style={{ 
          width: "56px", height: "56px", borderRadius: "14px", background: "var(--color-ssg)", color: "#fff", border: "2.5px solid #111", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "3px 3px 0px #111"
        }}
      >
        <Plus size={28} strokeWidth={4} />
      </button>
    </div>
  </div>
);

export default function SmallSidedGamesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // State
  const [format, setFormat] = useState(null);
  const [customFormat, setCustomFormat] = useState({ a: 2, b: 3 });
  const [isSituational, setIsSituational] = useState(false);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(20);
  
  const [stats, setStats] = useState({
    goals: 0,
    assists: 0,
    dribbles: 0,
    passes: 0,
    recoveries: 0
  });

  const formats = ["1vs1", "2vs2", "3vs3", "4vs4", "5vs5"];

  const handleStatChange = (key, val) => {
    setStats(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    if (!format && !isSituational) return;

    haptic.heavy();
    
    const finalFormat = isSituational ? `${customFormat.a}vs${customFormat.b}` : format;
    
    const entry = {
      id: Date.now(),
      type: "SSG",
      format: finalFormat,
      date,
      duration,
      stats,
      timestamp: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem("elite_pro_ssg_history") || "[]");
    localStorage.setItem("elite_pro_ssg_history", JSON.stringify([entry, ...existing]));
    
    // Log time to Performance Rings engine
    logTime("ssg", duration);
    
    router.push("/analytics");
  };

  // Completion states for badges
  const isFormatComplete = !!(format || isSituational);
  const isTemporalComplete = !!(date && duration > 0);

  if (!mounted) return null;

  return (
    <div className="app-container page-wrapper" style={{ background: "var(--background)", minHeight: "100vh", paddingBottom: "160px" }}>
      
      {/* Header consistent with Upload Page */}
      <div style={{ 
        background: "var(--surface)", 
        padding: "20px 24px", 
        position: "sticky", 
        top: 0, 
        zIndex: 100, 
        borderBottom: "3px solid #111", 
        display: "flex", 
        alignItems: "center", 
        gap: "16px" 
      }}>
        <button 
          onClick={() => { haptic.medium(); router.back(); }} 
          className="pseudo-haptic" 
          style={{ 
            width: "48px", height: "48px", borderRadius: "14px", background: "#fff", border: "2.5px solid #111", 
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "4px 4px 0px #111"
          }}
        >
          <ArrowLeft size={24} color="#111" strokeWidth={3} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "900", letterSpacing: "-0.04em", textTransform: "uppercase", fontFamily: "var(--font-heading)", display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span>SMALL SIDED</span>
            <span className="brush-highlight" style={{ color: "var(--color-ssg)" }}>GAMES</span>
          </h2>
        </div>
      </div>

      <main className="v-stack" style={{ gap: "36px", padding: "24px 20px" }}>
        
        {/* 1. MATCH CONFIGURATION */}
        <section className="card-dark hover-lift" style={{ border: "2.5px solid #111", background: "#fff", position: "relative", borderRadius: "28px", padding: "24px" }}>
          <div style={{ position: "absolute", top: "24px", right: "24px", opacity: isFormatComplete ? 1 : 0.2 }}>
            <div style={{ background: isFormatComplete ? "#10b981" : "var(--gray-dim)", color: "#fff", padding: "8px 16px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "900", textTransform: "uppercase" }}>
              {isFormatComplete ? "OK" : "MISSING"}
            </div>
          </div>
          
          <div className="h-stack" style={{ marginBottom: "28px", gap: "14px" }}>
            <Users size={26} color="var(--color-ssg)" strokeWidth={3} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.04em" }}>1. Match Format</h3>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {formats.map(f => (
              <button
                key={f}
                onClick={() => { haptic.light(); setFormat(f); setIsSituational(false); }}
                className="pseudo-haptic"
                style={{ 
                  padding: "18px 8px", borderRadius: "18px", fontSize: "1rem", fontWeight: "900",
                  background: format === f && !isSituational ? "#111" : "var(--surface)",
                  color: format === f && !isSituational ? "#fff" : "#111",
                  border: "2.5px solid #111",
                  borderBottom: format === f && !isSituational ? "6px solid var(--color-ssg)" : "2.5px solid #ddd",
                  transition: "all 0.2s"
                }}
              >
                {f}
              </button>
            ))}
            <button
              onClick={() => { haptic.light(); setIsSituational(true); setFormat(null); }}
              className="pseudo-haptic"
              style={{ 
                padding: "18px 8px", borderRadius: "18px", fontSize: "0.85rem", fontWeight: "900", textTransform: "uppercase",
                background: isSituational ? "#111" : "var(--surface)",
                color: isSituational ? "#fff" : "#111",
                border: "2.5px solid #111",
                borderBottom: isSituational ? "6px solid var(--color-ssg)" : "2.5px solid #ddd",
                gridColumn: "span 1"
              }}
            >
              Custom
            </button>
          </div>

          {isSituational && (
            <div className="anim-spring-pop" style={{ background: "var(--surface)", padding: "24px", borderRadius: "24px", border: "2.5px dashed #111", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
              <div className="v-stack items-center" style={{ gap: "8px" }}>
                <button onClick={() => setCustomFormat(p => ({ ...p, a: p.a + 1 }))} style={{ background: "#fff", border: "2px solid #111", borderRadius: "10px", padding: "6px" }}><Plus size={18} strokeWidth={3} /></button>
                <span style={{ fontSize: "2rem", fontWeight: "900" }}>{customFormat.a}</span>
                <button onClick={() => setCustomFormat(p => ({ ...p, a: Math.max(1, p.a - 1) }))} style={{ background: "#fff", border: "2px solid #111", borderRadius: "10px", padding: "6px" }}><Minus size={18} strokeWidth={3} /></button>
              </div>
              <span style={{ fontWeight: "900", fontStyle: "italic", opacity: 0.3, fontSize: "1.4rem" }}>VS</span>
              <div className="v-stack items-center" style={{ gap: "8px" }}>
                <button onClick={() => setCustomFormat(p => ({ ...p, b: p.b + 1 }))} style={{ background: "#fff", border: "2px solid #111", borderRadius: "10px", padding: "6px" }}><Plus size={18} strokeWidth={3} /></button>
                <span style={{ fontSize: "2rem", fontWeight: "900" }}>{customFormat.b}</span>
                <button onClick={() => setCustomFormat(p => ({ ...p, b: Math.max(1, p.b - 1) }))} style={{ background: "#fff", border: "2px solid #111", borderRadius: "10px", padding: "6px" }}><Minus size={18} strokeWidth={3} /></button>
              </div>
            </div>
          )}
        </section>

        {/* 2. TEMPORAL DATA */}
        <section className="card-dark hover-lift" style={{ border: "2.5px solid #111", background: "#fff", borderRadius: "28px", padding: "24px" }}>
          <div className="h-stack" style={{ marginBottom: "28px", gap: "14px" }}>
            <Clock size={26} color="var(--color-ssg)" strokeWidth={3} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.04em" }}>2. Match Context</h3>
          </div>
          
          <div className="v-stack" style={{ gap: "28px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "900", textTransform: "uppercase", opacity: 0.5, marginBottom: "10px", display: "block" }}>Training Date</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-dark"
                style={{ padding: "20px", border: "2.5px solid #ddd", background: "var(--surface)", borderBottom: "6px solid #111", borderRadius: "14px", fontWeight: "800", fontSize: "1.1rem", width: "100%" }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "900", textTransform: "uppercase", opacity: 0.5, marginBottom: "10px", display: "block" }}>Effective Duration (min)</label>
              <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", borderRadius: "20px", padding: "8px", border: "2.5px solid #111", boxShadow: "5px 5px 0px #eee" }}>
                <button onClick={() => { haptic.light(); setDuration(Math.max(1, duration - 5)); }} className="pseudo-haptic" style={{ flex: 1, padding: "18px", background: "#fff", border: "2.5px solid #111", borderRadius: "12px", fontWeight: "900" }}>-5</button>
                <div style={{ flex: 2, textAlign: "center", fontSize: "1.8rem", fontWeight: "900" }}>{duration}'</div>
                <button onClick={() => { haptic.light(); setDuration(duration + 5); }} className="pseudo-haptic" style={{ flex: 1, padding: "18px", background: "#111", color: "#fff", border: "2.5px solid #111", borderRadius: "12px", fontWeight: "900" }}>+5</button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TECHNICAL INDICATORS */}
        <section className="v-stack" style={{ gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", borderBottom: "5px solid #111", paddingBottom: "14px", marginBottom: "14px" }}>
             <Activity size={28} color="var(--color-ssg)" strokeWidth={3.5} />
             <h2 style={{ fontSize: "1.5rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "var(--font-heading)" }}>
               Performance <span style={{ color: "var(--color-ssg)" }}>Metrics</span>
             </h2>
          </div>

          <div className="v-stack" style={{ gap: "24px" }}>
            <StatCounter label="Goal" value={stats.goals} onChange={(v) => handleStatChange("goals", v)} icon={Trophy} description="Scoring Phase" />
            <StatCounter label="Assist" value={stats.assists} onChange={(v) => handleStatChange("assists", v)} icon={ArrowRight} description="Final Pass" />
            <StatCounter label="Dribbling" value={stats.dribbles} onChange={(v) => handleStatChange("dribbles", v)} icon={Zap} description="1vs1 Efficiency" />
            <StatCounter label="Passes" value={stats.passes} onChange={(v) => handleStatChange("passes", v)} icon={Target} description="Technical Accuracy" />
            <StatCounter label="Recoveries" value={stats.recoveries} onChange={(v) => handleStatChange("recoveries", v)} icon={Users} description="Defensive Intensity" />
          </div>
        </section>

        {/* Final CTA consistent with Upload generate button */}
        <div style={{ marginTop: "24px" }}>
          <button 
            onClick={handleSave}
            disabled={!isFormatComplete}
            className="pseudo-haptic"
            style={{ 
              width: "100%", height: "88px", fontSize: "1.6rem", fontWeight: "900", textTransform: "uppercase",
              background: isFormatComplete ? "var(--color-ssg)" : "var(--surface)",
              color: isFormatComplete ? "#fff" : "var(--gray-dim)",
              border: "3px solid #111",
              borderBottom: isFormatComplete ? "12px solid #b91c1c" : "3px solid #ddd",
              borderRadius: "24px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "20px",
              opacity: isFormatComplete ? 1 : 0.4,
              cursor: isFormatComplete ? "pointer" : "not-allowed",
              transition: "all 0.3s"
            }}
          >
            {isFormatComplete ? <Save size={32} fill="#fff" /> : <Settings size={32} className="animate-spin" />}
            {isFormatComplete ? "Save Match" : "Select Format"}
          </button>
          
          <p style={{ textAlign: "center", fontSize: "0.9rem", fontWeight: "800", color: "var(--gray-dim)", marginTop: "24px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Syncing with your <span style={{ color: "#111", textDecoration: "underline" }}>Elite Targets</span>
          </p>
        </div>

      </main>

      <style jsx>{`
        .page-wrapper {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
