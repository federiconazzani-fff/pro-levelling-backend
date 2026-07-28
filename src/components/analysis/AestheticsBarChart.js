"use client";

import { useEffect, useRef, useState } from "react";
import { X, TrendingUp, Award } from "lucide-react";

// ─── Colour by score ──────────────────────────────────────────────────────────
function scoreColor(score, isTechnical) {
  if (score >= 75) return "#22c55e";   // green
  if (score >= 50) return "#f59e0b";   // amber
  return isTechnical ? "#3b82f6" : "#e63946";                     // red (brand primary) or blue
}

// ─── Animated bar ─────────────────────────────────────────────────────────────
function Bar({ label, score, maxScore = 100, delay = 0, isTechnical }) {
  const [current, setCurrent] = useState(0);
  const color = scoreColor(score, isTechnical);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let frame = 0;
      const total = 40;
      const step = () => {
        frame++;
        setCurrent(Math.round((score * frame) / total));
        if (frame < total) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [score, delay]);

  const pct = (current / maxScore) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
      {/* Score value */}
      <span style={{ fontSize: "1.1rem", fontWeight: "900", color, fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
        {current}
      </span>

      {/* Vertical bar track */}
      <div style={{
        width: "100%",
        height: "120px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "6px",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Fill - grows from bottom */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${pct}%`,
          background: `linear-gradient(to top, ${color}, ${color}88)`,
          borderRadius: "4px",
          boxShadow: `0 0 12px ${color}55`,
          transition: "height 0.05s linear",
        }} />
        {/* Grid lines at 25/50/75 */}
        {[25, 50, 75].map(g => (
          <div key={g} style={{
            position: "absolute",
            bottom: `${g}%`,
            left: 0,
            right: 0,
            height: "1px",
            background: "rgba(255,255,255,0.07)",
          }} />
        ))}
      </div>

      {/* Label */}
      <span style={{
        fontSize: "0.58rem",
        fontWeight: "800",
        color: "rgba(255,255,255,0.55)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        textAlign: "center",
        lineHeight: 1.3,
        wordBreak: "break-word",
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Y-axis labels ────────────────────────────────────────────────────────────
function YAxis() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "120px",
      paddingBottom: "0px",
      alignItems: "flex-end",
      paddingRight: "8px",
    }}>
      {[100, 75, 50, 25, 0].map(v => (
        <span key={v} style={{ fontSize: "0.55rem", fontWeight: "700", color: "rgba(255,255,255,0.3)", lineHeight: 1 }}>
          {v}
        </span>
      ))}
    </div>
  );
}

// ─── Overall ring ─────────────────────────────────────────────────────────────
function OverallRing({ score, isTechnical }) {
  const radius = 38;
  const circ   = 2 * Math.PI * radius;
  const [dash, setDash] = useState(circ);
  const color = scoreColor(score, isTechnical);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let frame = 0;
      const total = 50;
      const target = circ - (score / 100) * circ;
      const step = () => {
        frame++;
        setDash(circ - ((circ - target) * frame / total));
        if (frame < total) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 200);
    return () => clearTimeout(timeout);
  }, [score, circ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        {/* Track */}
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        {/* Fill */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          transform="rotate(-90 48 48)"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 0.05s linear" }}
        />
        <text x="48" y="44" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900" fontFamily="monospace">{score}</text>
        <text x="48" y="58" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontWeight="700">OVERALL</text>
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AestheticsBarChart({ videoId, onClose, inlineData = null, isTechnical = false }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    // If inline data was passed directly (from webhook / mock), use it
    if (inlineData) {
      setChartData(inlineData);
      setLoading(false);
      return;
    }

    // Otherwise fetch from FastAPI backend
    if (!videoId) {
      setError("No video ID provided.");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/aesthetics-data/${videoId}`)
      .then(r => {
        if (!r.ok) throw new Error("Backend not available");
        return r.json();
      })
      .then(d => { setChartData(d); setLoading(false); })
      .catch(() => {
        // Graceful fallback – demo data
        setChartData({
          video_id:   videoId || "demo",
          parameters: ["Postura", "Equilibrio", "Elasticità", "Coordinazione", "Controllo Palla"],
          scores:     [72, 85, 78, 65, 80],
          overall:    76,
        });
        setLoading(false);
      });
  }, [videoId, inlineData]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#050505",
      display: "flex", flexDirection: "column",
      color: "#fff",
      animation: "blockFadeIn 0.4s ease",
    }}>

      {/* ── Header ── */}
      <header style={{
        padding: "20px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(5,5,5,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp size={20} color={isTechnical ? "#3b82f6" : "#e63946"} strokeWidth={3} />
            <h1 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Aesthetics Analysis
            </h1>
          </div>
          <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: "700", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Performance per Parametro
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ background: "rgba(255,255,255,0.08)", border: "none", padding: "10px", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={20} />
        </button>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "32px" }}>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
            <div style={{ width: "48px", height: "48px", border: `3px solid ${isTechnical ? "#3b82f6" : "#e63946"}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {!loading && chartData && (
          <>
            {/* Overall ring + title */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <OverallRing score={chartData.overall} isTechnical={isTechnical} />
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: "800", color: isTechnical ? "#3b82f6" : "#e63946", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  Aesthetics Acc
                </div>
                <div style={{ fontSize: "2.4rem", fontWeight: "900", letterSpacing: "-0.04em", fontFamily: "var(--font-heading)", lineHeight: 1 }}>
                  {chartData.overall}<span style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.4)" }}>%</span>
                </div>
                <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontWeight: "700", marginTop: "6px" }}>
                  {chartData.overall >= 75 ? "Esecuzione eccellente" : chartData.overall >= 50 ? "Buona base, margine di crescita" : "Focus su tecnica e postura"}
                </p>
              </div>
            </div>

            {/* Bar chart */}
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: "800", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
                Dettaglio Parametri
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <YAxis />
                <div style={{ display: "flex", flex: 1, gap: "8px", alignItems: "flex-end" }}>
                  {chartData.parameters.map((param, i) => (
                    <Bar
                      key={param}
                      label={param}
                      score={chartData.scores[i]}
                      delay={i * 80}
                      isTechnical={isTechnical}
                    />
                  ))}
                </div>
              </div>
              {/* X-axis label */}
              <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.55rem", fontWeight: "700", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Parametri — Aesthetics Acc (%)
              </div>
            </div>

            {/* Score legend */}
            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
              {[{ label: "Ottimo ≥ 75", color: "#22c55e" }, { label: "Sufficiente ≥ 50", color: "#f59e0b" }, { label: "Da migliorare", color: isTechnical ? "#3b82f6" : "#e63946" }].map(({ label, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: "0.6rem", fontWeight: "700", color: "rgba(255,255,255,0.45)" }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
