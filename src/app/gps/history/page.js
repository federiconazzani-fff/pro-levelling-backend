"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Navigation, Activity, Calendar, Clock, MapPin, Link as LinkIcon } from "lucide-react";
import { haptic } from "@/utils/haptics";
import { getGpsHistory, deleteGpsSession, linkGpsToVideo, unlinkGpsSession, updateGpsSessionType } from "@/utils/gpsDb";
import { getAllVideos } from "@/utils/db";
import GpsAbstractMap from "@/components/gps/GpsAbstractMap";
import GpsHistoryCharts from "@/components/gps/GpsHistoryCharts";
import TimelineChart from "@/components/analytics/TimelineChart";

export default function GpsHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // For Association
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [eligibleVideos, setEligibleVideos] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    setHistory(getGpsHistory());
  }, []);

  const TECHNICAL_CATS = ["Shooting", "Dribbling", "Ball Control", "First Touch (Aerial)", "First Touch (Ground)", "Passing", "Cross", "Freestyle"];
  const ATHLETIC_CATS = ["Speed", "Agility", "Dynamic Changes", "Coordination", "Pliometria"];
  const CATEGORIES = [...TECHNICAL_CATS, ...ATHLETIC_CATS, "VO2 Max", "Cardio"];

  const handleSelect = (session) => {
    haptic.light();
    setSelectedSession(session);
  };

  const handleBack = () => {
    haptic.light();
    if (selectedSession) setSelectedSession(null);
    else router.push("/");
  };

  const formatTimeStr = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  // -----------------------
  // ASSOCIATION LOGIC
  // -----------------------
  const openLinkModal = () => {
    haptic.medium();
    const allVideos = getAllVideos();
    
    // Attempt to find matches by date
    const matchDate = selectedSession.date;
    const matches = allVideos.filter(v => {
      const vDate = v.date || (v.createdAt ? new Date(v.createdAt).toLocaleDateString('it-IT') : null);
      return vDate === matchDate;
    });

    // If no matches, show all videos but let user know
    setEligibleVideos(allVideos);
    setShowLinkModal(true);
  };

  const confirmLink = (videoId) => {
    haptic.heavy();
    linkGpsToVideo(selectedSession.id, videoId);
    // Update local state
    setSelectedSession(prev => ({ ...prev, linkedVideoId: videoId, type: null }));
    setHistory(getGpsHistory());
    setShowLinkModal(false);
  };

  const confirmUnlink = () => {
    haptic.medium();
    unlinkGpsSession(selectedSession.id);
    setSelectedSession(prev => ({ ...prev, linkedVideoId: null }));
    setHistory(getGpsHistory());
  };

  const confirmCategory = (cat) => {
    haptic.heavy();
    updateGpsSessionType(selectedSession.id, cat);
    setSelectedSession(prev => ({ ...prev, type: cat, linkedVideoId: null }));
    setHistory(getGpsHistory());
    setShowCategoryModal(false);
  };

  // Generate chart data for the selected category
  const filteredHistory = history.filter(s => categoryFilter === "All" ? true : s.type === categoryFilter);
  const chartData = filteredHistory
    .slice() // avoid mutating history
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(s => ({
      date: s.date,
      avgScore: s.distance, // Use distance as the score for the chart
      sessionCount: 1,
      id: s.id
    }));

  // -----------------------
  // RENDER DETAIL VIEW
  // -----------------------
  if (selectedSession) {
    return (
      <div className="app-container page-wrapper" style={{ background: "#f8f8f8", minHeight: "100vh", paddingBottom: "100px" }}>
        {/* Header */}
        <header style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", background: "#fff", borderBottom: "2px solid #111", position: "sticky", top: 0, zIndex: 50 }}>
          <button onClick={handleBack} className="interactive-btn" style={{ background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={28} color="#111" />
          </button>
          <h1 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase" }}>Run Detail</h1>
        </header>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Map Overview */}
          <div style={{ height: "250px", background: "#fff", borderRadius: "24px", border: "2px solid #111", padding: "16px", position: "relative" }}>
             <GpsAbstractMap coordinates={selectedSession.path} color="#111" strokeWidth={5} />
             <div style={{ position: "absolute", top: "16px", left: "16px", background: "#111", color: "#fff", padding: "4px 12px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "900" }}>
               {selectedSession.date}
             </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
               <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "16px", padding: "16px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase" }}>Distance</span>
                  <div style={{ fontSize: "1.8rem", fontWeight: "900", fontFamily: "var(--font-heading)" }}>{selectedSession.distance.toFixed(2)} <span style={{ fontSize: "0.8rem", color: "#111" }}>km</span></div>
               </div>
               <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "16px", padding: "16px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase" }}>Effective Time</span>
                  <div style={{ fontSize: "1.8rem", fontWeight: "900", fontFamily: "var(--font-heading)" }}>{formatTimeStr(selectedSession.time)}</div>
               </div>
               <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "16px", padding: "16px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase" }}>Avg. Speed</span>
                  <div style={{ fontSize: "1.5rem", fontWeight: "900", fontFamily: "var(--font-heading)" }}>{selectedSession.avgSpeed.toFixed(1)} <span style={{ fontSize: "0.8rem", color: "#111" }}>km/h</span></div>
               </div>
               <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "16px", padding: "16px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase" }}>Top Speed</span>
                  <div style={{ fontSize: "1.5rem", fontWeight: "900", fontFamily: "var(--font-heading)" }}>{selectedSession.topSpeed.toFixed(1)} <span style={{ fontSize: "0.8rem", color: "#111" }}>km/h</span></div>
               </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#f1f1f1", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Total Time</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: "900" }}>{formatTimeStr(selectedSession.time + (selectedSession.totalPauseTime || 0))}</div>
              </div>
              <div style={{ background: "#f1f1f1", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Pause</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: "900" }}>{selectedSession.pauseCount || 0} <span style={{ fontSize: "0.7rem", color: "#777" }}>({Math.floor((selectedSession.totalPauseTime || 0)/60)}m)</span></div>
              </div>
              <div style={{ background: "#e0f2fe", borderRadius: "12px", padding: "12px", textAlign: "center", color: "#0284c7" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: "900", textTransform: "uppercase", display: "block", marginBottom: "4px", color: "inherit" }}>Fluids Lost</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: "900" }}>{Math.round(selectedSession.distance * 75 * 1.5)} <span style={{ fontSize: "0.7rem", color: "inherit" }}>ml</span></div>
              </div>
            </div>
          </div>

          {/* Association Button */}
          <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "900", textTransform: "uppercase" }}>Session Association</h3>
            {selectedSession.linkedVideoId ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "rgba(0, 194, 255, 0.1)", padding: "12px", borderRadius: "12px", border: "1px solid #00C2FF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#00C2FF" }}>
                  <LinkIcon size={20} />
                  <span style={{ fontWeight: "800", fontSize: "0.9rem" }}>Linked to Video ID: {selectedSession.linkedVideoId.substring(0,8)}</span>
                </div>
                <button onClick={confirmUnlink} style={{ background: "#fff", color: "#ef4444", border: "1px solid #ef4444", padding: "6px 12px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase" }}>
                  Unlink
                </button>
              </div>
            ) : selectedSession.type ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "rgba(107, 116, 255, 0.1)", padding: "12px", borderRadius: "12px", border: "1px solid #6B74FF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B74FF" }}>
                  <Activity size={20} />
                  <span style={{ fontWeight: "800", fontSize: "0.9rem" }}>{selectedSession.type.toUpperCase()}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => confirmCategory(null)} style={{ background: "#fff", color: "#ef4444", border: "1px solid #ef4444", padding: "6px 12px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase" }}>
                    Clear
                  </button>
                  <button onClick={() => setShowCategoryModal(true)} style={{ background: "#fff", color: "#6B74FF", border: "1px solid #6B74FF", padding: "6px 12px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase" }}>
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "0.8rem", color: "var(--gray-dim)", fontWeight: "600", lineHeight: 1.4 }}>
                  Link this GPS track to a video session or categorize it as a specific training type.
                </p>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button 
                    onClick={openLinkModal}
                    className="btn-primary interactive-btn"
                    style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#111", color: "#fff", border: "2px solid #111" }}
                  >
                    <LinkIcon size={18} strokeWidth={3} /> Link Video
                  </button>
                  <button 
                    onClick={() => { haptic.medium(); setShowCategoryModal(true); }}
                    className="btn-secondary interactive-btn"
                    style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <Activity size={18} strokeWidth={3} /> Categorize
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Charts */}
          {selectedSession.speedData && selectedSession.speedData.length > 0 && (
             <div className="chart-anim">
               <GpsHistoryCharts 
                 speedData={selectedSession.speedData} 
                 totalKm={selectedSession.distance}
                 peaks={selectedSession.peaks || [selectedSession.topSpeed]}
                 drops={selectedSession.drops || []}
                 pauses={selectedSession.pausesList || []}
               />
             </div>
          )}
        </div>

        {/* Association Modal */}
        {showLinkModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
             <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "400px", border: "2px solid #111", overflow: "hidden" }}>
                <div style={{ padding: "20px", borderBottom: "2px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase" }}>Videos on date {selectedSession.date}</h3>
                </div>
                 <div style={{ padding: "20px", maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                   {eligibleVideos.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--gray-dim)" }}>No videos in library.</p>
                        <button onClick={() => router.push('/upload')} style={{ marginTop: "12px", background: "#111", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "900" }}>UPLOAD NOW</button>
                      </div>
                   ) : (
                      eligibleVideos.map(v => {
                        const vDate = v.date || (v.createdAt ? new Date(v.createdAt).toLocaleDateString('it-IT') : "Data sconosciuta");
                        const isMatch = vDate === selectedSession.date;
                        
                        return (
                          <div 
                            key={v.id} 
                            onClick={() => confirmLink(v.id)} 
                            className="interactive-card"
                            style={{ 
                              border: isMatch ? "2px solid var(--primary)" : "2px solid #eee", 
                              background: isMatch ? "rgba(230, 57, 70, 0.02)" : "#fff",
                              borderRadius: "12px", 
                              padding: "12px", 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "12px",
                              cursor: "pointer",
                              position: "relative"
                            }}
                          >
                             {isMatch && (
                               <span style={{ position: "absolute", top: "-10px", right: "12px", background: "#6B74FF", color: "#fff", fontSize: "0.6rem", fontWeight: "900", padding: "2px 8px", borderRadius: "4px" }}>SAME DATE</span>
                             )}
                             {v.thumbnail ? (
                               <img src={v.thumbnail} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />
                             ) : (
                               <div style={{ width: "60px", height: "60px", background: "#111", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                 <Activity size={24} color="#333" />
                               </div>
                             )}
                             <div>
                                <div style={{ fontWeight: "900", fontSize: "0.9rem" }}>{v.title || (v.type === "session" ? "Multiple Session" : "Single Video")}</div>
                                <div style={{ fontSize: "0.7rem", color: "var(--gray-dim)", fontWeight: "700" }}>{vDate} • ID: {v.id.substring(0,8)}</div>
                             </div>
                          </div>
                        );
                      })
                   )}
                </div>
                <div style={{ padding: "20px", borderTop: "2px solid #111" }}>
                   <button onClick={() => setShowLinkModal(false)} className="btn-secondary" style={{ width: "100%" }}>CANCEL</button>
                </div>
             </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
             <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "400px", border: "2px solid #111", overflow: "hidden" }}>
                <div style={{ padding: "20px", borderBottom: "2px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase" }}>Select Category</h3>
                </div>
                 <div style={{ padding: "20px", maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                   {CATEGORIES.map(cat => (
                     <button
                       key={cat}
                       onClick={() => confirmCategory(cat)}
                       className="interactive-btn"
                       style={{ width: "100%", padding: "16px", background: selectedSession.type === cat ? "rgba(107, 116, 255, 0.1)" : "#f9f9f9", border: selectedSession.type === cat ? "2px solid #6B74FF" : "2px solid #eee", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "900", color: selectedSession.type === cat ? "#6B74FF" : "#111", textTransform: "uppercase", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                     >
                       {cat}
                       {selectedSession.type === cat && <Activity size={18} />}
                     </button>
                   ))}
                </div>
                <div style={{ padding: "20px", borderTop: "2px solid #111" }}>
                   <button onClick={() => setShowCategoryModal(false)} className="btn-secondary" style={{ width: "100%" }}>CANCEL</button>
                </div>
             </div>
          </div>
        )}

      </div>
    );
  }

  // -----------------------
  // RENDER LIST VIEW
  // -----------------------
  return (
    <div className="app-container page-wrapper" style={{ background: "#f8f8f8", minHeight: "100vh", paddingBottom: "100px" }}>
      <header style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", background: "#fff", borderBottom: "2px solid #111", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={handleBack} className="interactive-btn" style={{ background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={28} color="#111" />
        </button>
        <h1 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={24} color="#6B74FF" /> GPS History
        </h1>
      </header>

      <div style={{ display: "flex", overflowX: "auto", width: "100%", maxWidth: "100vw", gap: "8px", padding: "16px 24px 16px", WebkitOverflowScrolling: "touch" }}>
        {["All", ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => { haptic.light(); setCategoryFilter(cat); }}
            className="interactive-btn"
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: "900",
              fontSize: "0.75rem",
              whiteSpace: "nowrap",
              border: categoryFilter === cat ? "2px solid #6B74FF" : "2px solid #ddd",
              background: categoryFilter === cat ? "var(--surface)" : "#fff",
              color: categoryFilter === cat ? "#6B74FF" : "var(--gray-dim)",
              transition: "all 0.2s",
              flexShrink: 0
            }}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Timeline Chart based on Filter */}
        {chartData.length > 0 && categoryFilter !== "All" && (
          <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "20px", padding: "16px", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: "900", textTransform: "uppercase", marginBottom: "8px" }}>Trend Distanza (km) - {categoryFilter}</h3>
            <TimelineChart 
              data={chartData} 
              onSessionClick={(point) => handleSelect(history.find(s => s.id === point.id))}
              color="#6B74FF"
              maxValue={Math.max(5, ...chartData.map(d => d.avgScore))}
            />
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5 }}>
            <MapPin size={48} color="#111" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase" }}>No tracks</h3>
            <p style={{ fontSize: "0.9rem", fontWeight: "600", marginTop: "8px" }}>No sessions found for {categoryFilter}.</p>
          </div>
        ) : (
          filteredHistory.map(session => (
            <div 
              key={session.id} 
              onClick={() => handleSelect(session)}
              className="interactive-card"
              style={{ background: "#fff", border: "2px solid #111", borderRadius: "20px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", boxShadow: "4px 4px 0px rgba(0,0,0,0.05)" }}
            >
               <div>
                 <div style={{ fontSize: "0.7rem", fontWeight: "900", color: "#6B74FF", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                   <Calendar size={12} /> {session.date}
                   {session.type && <span style={{ marginLeft: "4px", padding: "2px 6px", background: "rgba(107, 116, 255, 0.1)", borderRadius: "4px", fontSize: "0.6rem" }}>{session.type}</span>}
                 </div>
                 <div style={{ fontSize: "1.5rem", fontWeight: "900", fontFamily: "var(--font-heading)" }}>
                   {session.distance.toFixed(2)} <span style={{ fontSize: "0.8rem", color: "var(--gray-dim)" }}>km</span>
                 </div>
               </div>
               <div style={{ textAlign: "right" }}>
                 <div style={{ fontSize: "0.7rem", fontWeight: "900", color: "#111", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                   <Clock size={12} /> Time
                 </div>
                 <div style={{ fontSize: "1.1rem", fontWeight: "900" }}>
                   {formatTimeStr(session.time)}
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
