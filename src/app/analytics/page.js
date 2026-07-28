"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, Activity, TrendingUp, Calendar, Trophy } from "lucide-react";
import { haptic } from "@/utils/haptics";
import TimelineChart from "@/components/analytics/TimelineChart";
import SessionDetailModal from "@/components/analytics/SessionDetailModal";
import {
  getAllAnalyzedSessions,
  filterLibraryByCategory,
  groupSessionsByDate,
  getCategoriesForMacroArea
} from "@/utils/analyticsDb";
import { getGpsHistory } from "@/utils/gpsDb";

const MICRO_OPTIONS = {
  "TECHNICAL": ["Shooting", "Dribbling", "Ball Control", "First Touch (Aerial)", "First Touch (Ground)", "Passing", "Cross", "Freestyle"],
  "ATHLETIC": ["Speed", "Agility", "Dynamic Changes", "Coordination", "Pliometria"],
  "SSG": ["Goal", "Assist", "Dribbling", "Passes", "Recoveries"],
  "ATHLETICISM": ["Shooting", "Dribbling", "Ball Control", "First Touch (Aerial)", "First Touch (Ground)", "Passing", "Cross", "Freestyle", "Speed", "Agility", "Dynamic Changes", "Coordination", "Pliometria", "VO2 Max", "Cardio"]
};

const CATEGORY_COLORS = {
  "Shooting": "#1d3557",
  "Dribbling": "#e63946",
  "Ball Control": "#14b8a6",
  "First Touch (Aerial)": "#38bdf8",
  "First Touch (Ground)": "#3b82f6",
  "Passing": "#a855f7",
  "Cross": "#f97316",
  "Freestyle": "#ec4899",
  "Speed": "#f97316",
  "Agility": "#14b8a6",
  "Dynamic Changes": "#3b82f6",
  "Coordination": "#a855f7",
  "Pliometria": "#e63946",
  "Goal": "#ff4d80",
  "Assist": "#ff4d80",
  "Dribbling SSG": "#ff4d80", 
  "Passes SSG": "#ff4d80",
  "Recoveries": "#ff4d80"
};

export default function AnalyticsPage() {
  const [macroTab, setMacroTab] = useState("TECHNICAL");
  const [subFilter, setSubFilter] = useState("All");
  const [libraryData, setLibraryData] = useState([]);
  const [ssgData, setSsgData] = useState([]);
  const [gpsData, setGpsData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  // Load library data on mount
  useEffect(() => {
    const saved = localStorage.getItem('elite_pro_library');
    if (saved) {
      try { setLibraryData(JSON.parse(saved)); } catch (e) {}
    }
    const savedSsg = localStorage.getItem('elite_pro_ssg_history');
    if (savedSsg) {
      try { setSsgData(JSON.parse(savedSsg)); } catch (e) {}
    }
    setGpsData(getGpsHistory());
  }, []);

  // Filter and aggregate data when filters change
  useEffect(() => {
    if (macroTab === "ATHLETICISM") {
      if (gpsData.length === 0) {
        setChartData([]);
        return;
      }
      
      const filtered = subFilter === "All" 
        ? gpsData 
        : gpsData.filter(session => session.type === subFilter);

      const dateMap = new Map();
      filtered.forEach(item => {
        const date = item.date;
        if (!dateMap.has(date)) dateMap.set(date, { date, scores: [], sessions: [] });
        
        // For athleticism, we'll plot distance or max speed. Let's use distance for trend
        const entry = dateMap.get(date);
        entry.scores.push(item.distance);
        entry.sessions.push({ ...item, score: item.distance, title: `GPS: ${item.type || 'Uncategorized'}` });
      });

      const aggregated = Array.from(dateMap.values()).map(entry => ({
        date: entry.date,
        avgScore: entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length,
        sessionCount: entry.sessions.length,
        sessions: entry.sessions
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setChartData(aggregated);
      return;
    }

    if (macroTab === "SSG") {
      if (ssgData.length === 0) {
        setChartData([]);
        return;
      }
      // Group SSG data
      const dateMap = new Map();
      ssgData.forEach(item => {
        const date = item.date;
        if (!dateMap.has(date)) dateMap.set(date, { date, scores: [], sessions: [] });
        
        let value = 0;
        if (subFilter === "All") {
          value = item.stats.goals || 0;
        } else {
          const mapping = {
            "GOAL": "goals",
            "ASSIST": "assists",
            "DRIBBLING": "dribbles",
            "PASSES": "passes",
            "RECOVERIES": "recoveries"
          };
          const key = mapping[subFilter.toUpperCase()] || subFilter.toLowerCase();
          value = item.stats[key] || 0;
        }
        
        const entry = dateMap.get(date);
        entry.scores.push(value);
        entry.sessions.push({ ...item, score: value, title: `SSG ${item.format}` });
      });

      const aggregated = Array.from(dateMap.values()).map(entry => ({
        date: entry.date,
        avgScore: entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length,
        sessionCount: entry.sessions.length,
        sessions: entry.sessions
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setChartData(aggregated);
      return;
    }

    if (libraryData.length === 0) {
      setChartData([]);
      return;
    }

    // Filter by macro-area and category
    const filtered = filterLibraryByCategory(libraryData, macroTab, subFilter);

    // Group by date and calculate average scores
    const aggregated = groupSessionsByDate(filtered);
    setChartData(aggregated);
  }, [libraryData, macroTab, subFilter]);

  // Get available categories for current macro-area
  const availableCategories = useMemo(() => {
    return getCategoriesForMacroArea(libraryData, macroTab);
  }, [libraryData, macroTab]);

  // Get category color
  const getCategoryColor = () => {
    if (macroTab === "ATHLETICISM") return "#6B74FF"; // Special color for GPS
    if (macroTab === "SSG") return "#ff4d80";
    if (macroTab === "TECHNICAL") return "#3b82f6";
    if (subFilter === "All") return "#e63946";
    return CATEGORY_COLORS[subFilter] || "#1d3557";
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return { total: 0, avg: 0, best: 0, trend: 0 };

    const totalSessions = chartData.reduce((acc, d) => acc + d.sessionCount, 0);
    const avgScore = chartData.reduce((acc, d) => acc + d.avgScore, 0) / chartData.length;
    const bestScore = Math.max(...chartData.map(d => d.avgScore));

    // Calculate trend (last 3 sessions vs previous 3)
    const recent = chartData.slice(-3);
    const previous = chartData.slice(-6, -3);
    const recentAvg = recent.reduce((acc, d) => acc + d.avgScore, 0) / recent.length;
    const previousAvg = previous.length > 0
      ? previous.reduce((acc, d) => acc + d.avgScore, 0) / previous.length
      : recentAvg;

    const trend = ((recentAvg - previousAvg) / previousAvg) * 100;

    return { total: totalSessions, avg: avgScore, best: bestScore, trend };
  }, [chartData]);

  const handleSessionClick = (sessionData) => {
    setSelectedSession(sessionData);
  };

  const chartMaxValue = useMemo(() => {
    if (macroTab === "ATHLETICISM") {
      if (chartData.length === 0) return 10;
      const max = Math.max(...chartData.map(d => d.avgScore));
      return Math.max(5, Math.ceil(max * 1.2)); // Distance usually single digits or small tens
    }
    if (macroTab !== "SSG") return 100;
    if (chartData.length === 0) return 10;
    const max = Math.max(...chartData.map(d => d.avgScore));
    return Math.max(5, Math.ceil(max * 1.2)); // Add 20% headroom
  }, [chartData, macroTab]);

  return (
    <div className="app-container page-wrapper" style={{ background: "#fff", minHeight: "100vh", paddingBottom: "100px" }} suppressHydrationWarning>

      {/* HEADER */}
      <header style={{
        background: "#fff",
        zIndex: 100,
        position: "sticky",
        top: 0,
        borderBottom: "2px solid #111"
      }}>
        <div style={{ padding: "24px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Performance Tracking
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: "900", letterSpacing: "-0.04em", textTransform: "uppercase", fontFamily: "var(--font-heading)", lineHeight: 0.9 }}>
              ANALYTICS
              <span style={{ position: "relative" }}>
                <div style={{ position: "absolute", bottom: "-2px", left: 0, right: 0, height: "8px", background: "rgba(230, 57, 70, 0.15)", zIndex: -1, transform: "skewX(-15deg)" }}></div>
              </span>
            </h2>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#111" }}>{stats.total}</div>
            <div style={{ fontSize: "0.6rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>Total Sessions</div>
          </div>
        </div>

        {/* MACRO-AREA TABS */}
        <div style={{ display: "flex", padding: "0 24px", gap: "24px" }}>
          {["ATHLETICISM", "ATHLETIC", "TECHNICAL", "SSG"].map(tab => (
            <button
              key={tab}
              onClick={() => { haptic.light(); setMacroTab(tab); setSubFilter("All"); }}
              className="interactive-btn"
              style={{
                padding: "12px 0 16px",
                fontWeight: "900",
                fontSize: "0.95rem",
                textTransform: "uppercase",
                color: macroTab === tab ? (tab === "SSG" ? "#ff4d80" : (tab === "ATHLETICISM" ? "#6B74FF" : "#111")) : "var(--gray-dim)",
                borderBottom: macroTab === tab 
                  ? `4px solid ${tab === "SSG" ? "#ff4d80" : (tab === "TECHNICAL" ? "#3b82f6" : (tab === "ATHLETICISM" ? "#6B74FF" : "var(--primary)"))}` 
                  : "4px solid transparent",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                position: "relative"
              }}
            >
              {tab === "ATHLETICISM" && <Activity size={16} color={macroTab === "ATHLETICISM" ? "#6B74FF" : "currentColor"} />}
              {tab === "ATHLETIC" && <Activity size={16} />}
              {tab === "TECHNICAL" && <BarChart3 size={16} color={macroTab === "TECHNICAL" ? "#3b82f6" : "currentColor"} />}
              {tab === "SSG" && <Trophy size={16} color={macroTab === "SSG" ? "#ff4d80" : "currentColor"} />}
              {tab === "SSG" ? "Small Sided" : (tab === "ATHLETICISM" ? "GPS / Athleticism" : tab)}
              {macroTab === tab && (
                <div style={{ position: "absolute", bottom: "4px", left: "-8px", right: "-8px", height: "40%", background: "var(--surface)", zIndex: -1, borderRadius: "4px", transform: "skewX(-10deg)" }}></div>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="v-stack" style={{ gap: "24px", padding: "24px 20px" }}>

        {/* STATS CARDS */}
        {chartData.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <div className="interactive-card" style={{
              padding: "16px",
              background: "#fff",
              border: "2px solid #111",
              borderRadius: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.6rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>Average</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#111", marginTop: "4px" }}>{stats.avg.toFixed(1)}</div>
            </div>
            <div className="interactive-card" style={{
              padding: "16px",
              background: "var(--primary)",
              border: "2px solid #111",
              borderRadius: "12px",
              textAlign: "center",
              color: "#fff"
            }}>
              <div style={{ fontSize: "0.6rem", fontWeight: "800", opacity: 0.9, textTransform: "uppercase" }}>Best</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "900", marginTop: "4px" }}>{stats.best.toFixed(0)}</div>
            </div>
            <div className="interactive-card" style={{
              padding: "16px",
              background: "#fff",
              border: "2px solid #111",
              borderRadius: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.6rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>Trend</div>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "900",
                color: stats.trend >= 0 ? "#10b981" : "var(--primary)",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px"
              }}>
                {stats.trend >= 0 ? "+" : ""}{stats.trend.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY FILTERS */}
        <div style={{ display: "flex", overflowX: "auto", width: "100%", maxWidth: "100vw", gap: "8px", paddingTop: "8px", paddingBottom: "16px", marginTop: "-8px", marginBottom: "-8px", WebkitOverflowScrolling: "touch" }}>
          <button
            onClick={() => { haptic.light(); setSubFilter("All"); }}
            className="interactive-btn"
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: "900",
              fontSize: "0.75rem",
              whiteSpace: "nowrap",
              border: "2px solid #111",
              background: subFilter === "All" ? "#111" : "#fff",
              color: subFilter === "All" ? "#fff" : "#111",
              boxShadow: subFilter === "All" ? "4px 4px 0px #eee" : "none",
              transition: "all 0.2s",
              flexShrink: 0
            }}
          >
            ALL
          </button>

          {macroTab === "SSG" || macroTab === "ATHLETICISM" ? (
            MICRO_OPTIONS[macroTab].map(opt => (
              <button
                key={opt}
                onClick={() => { haptic.light(); setSubFilter(opt); }}
                className="interactive-btn"
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontWeight: "900",
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                  border: subFilter === opt ? `2px solid ${macroTab === "SSG" ? "#ff4d80" : "#6B74FF"}` : "2px solid var(--surface-light)",
                  background: subFilter === opt ? (macroTab === "SSG" ? "rgba(255, 77, 128, 0.1)" : "rgba(107, 116, 255, 0.1)") : "#fff",
                  color: subFilter === opt ? (macroTab === "SSG" ? "#ff4d80" : "#6B74FF") : "var(--gray-dim)",
                  transition: "all 0.2s",
                  flexShrink: 0
                }}
              >
                {opt.toUpperCase()}
              </button>
            ))
          ) : (
            availableCategories.map(opt => (
              <button
                key={opt}
                onClick={() => { haptic.light(); setSubFilter(opt); }}
                className="interactive-btn"
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontWeight: "900",
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                  border: subFilter === opt ? `2px solid ${macroTab === "TECHNICAL" ? "#3b82f6" : "var(--primary)"}` : "2px solid var(--surface-light)",
                  background: subFilter === opt ? "var(--surface)" : "#fff",
                  color: subFilter === opt ? (macroTab === "TECHNICAL" ? "#3b82f6" : "var(--primary)") : "var(--gray-dim)",
                  transition: "all 0.2s",
                  flexShrink: 0
                }}
              >
                {opt.toUpperCase()}
              </button>
            ))
          )}
        </div>

        {/* TIMELINE CHART (Hidden for SSG as requested) */}
        {macroTab !== "SSG" && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <TrendingUp size={18} color={getCategoryColor()} />
              <h3 style={{ fontSize: "0.9rem", fontWeight: "900", textTransform: "uppercase", color: "#111" }}>
                Trend Over Time
              </h3>
            </div>

            <div className="chart-anim">
              <TimelineChart
                data={chartData}
                onSessionClick={handleSessionClick}
                color={getCategoryColor()}
                maxValue={chartMaxValue}
              />
            </div>

            {chartData.length > 0 && (
              <p style={{
                fontSize: "0.7rem",
                fontWeight: "700",
                color: "var(--gray-dim)",
                textAlign: "center",
                marginTop: "12px",
                textTransform: "uppercase"
              }}>
                Click on a point to see session details
              </p>
            )}
          </section>
        )}

        {/* SESSION LIST VIEW ( undeniability factor ) */}
        <section style={{ marginTop: "16px" }}>
           <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Calendar size={18} color={getCategoryColor()} />
            <h3 style={{ fontSize: "0.9rem", fontWeight: "900", textTransform: "uppercase", color: "#111" }}>
              Saved Sessions
            </h3>
          </div>

          <div className="v-stack" style={{ gap: "12px" }}>
            {chartData.length > 0 ? (
              chartData.flatMap(d => d.sessions).map((session, idx) => (
                <div 
                  key={`${session.id}-${idx}`}
                  onClick={() => handleSessionClick({ sessions: [session], date: session.date })}
                  className="interactive-card"
                  style={{
                    padding: "16px",
                    background: "#fff",
                    border: "2px solid #111",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#111" }}>{session.title}</span>
                    <span style={{ fontSize: "0.65rem", fontWeight: "700", color: "var(--gray-dim)", textTransform: "uppercase" }}>
                      {session.date} • {session.type === "SSG" ? `${session.duration} min` : (session.type === "session" ? `${session.reps?.length || 0} Reps` : "Single Video")}
                    </span>
                  </div>
                  <div style={{ 
                    width: "44px", height: "44px", borderRadius: "8px", background: macroTab === "SSG" ? "rgba(255, 77, 128, 0.1)" : "var(--surface)", 
                    border: macroTab === "SSG" ? "2px solid #ff4d80" : "2px solid #111", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: "900", color: macroTab === "SSG" ? "#ff4d80" : "#111"
                  }}>
                    {Math.round(session.score)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px", textAlign: "center", background: "var(--surface)", borderRadius: "16px", border: "2px dashed #ccc" }}>
                 <p style={{ fontSize: "0.8rem", fontWeight: "800", color: "#999", textTransform: "uppercase" }}>No sessions found for these filters</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* SESSION DETAIL MODAL */}
      {macroTab !== "ATHLETICISM" ? (
        <SessionDetailModal
          open={selectedSession !== null}
          sessions={selectedSession?.sessions || []}
          onClose={() => setSelectedSession(null)}
          categoryColor={getCategoryColor()}
        />
      ) : selectedSession !== null && (
        // Render a simplified modal for GPS-only sessions
        <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 1000, overflowY: "auto" }}>
           <header style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #111", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                 <Activity size={24} color="#6B74FF" />
                 <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase" }}>{selectedSession.sessions[0].title}</h2>
                    <div style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>{selectedSession.date}</div>
                 </div>
              </div>
              <button onClick={() => setSelectedSession(null)} style={{ fontSize: "0.7rem", fontWeight: "900", background: "none", border: "none" }}>CLOSE</button>
           </header>
           <div style={{ padding: "24px" }}>
             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#777", textTransform: "uppercase" }}>Distance</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: "900" }}>{selectedSession.sessions[0].distance.toFixed(2)} km</div>
                </div>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#777", textTransform: "uppercase" }}>Top Speed</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: "900" }}>{selectedSession.sessions[0].topSpeed.toFixed(1)} km/h</div>
                </div>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#777", textTransform: "uppercase" }}>Avg. Pace</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: "900" }}>{selectedSession.sessions[0].avgSpeed.toFixed(1)} km/h</div>
                </div>
              </div>

              {/* Just load the GPS component dynamically */}
              <div style={{ border: "2px solid #111", borderRadius: "24px", padding: "16px", background: "#fcfcfc" }}>
                {(() => {
                   const GpsCharts = require('@/components/gps/GpsHistoryCharts').default;
                   return <GpsCharts 
                     speedData={selectedSession.sessions[0].speedData} 
                     totalKm={selectedSession.sessions[0].distance}
                     peaks={selectedSession.sessions[0].peaks}
                     drops={selectedSession.sessions[0].drops}
                     pauses={selectedSession.sessions[0].pausesList}
                   />;
                })()}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
