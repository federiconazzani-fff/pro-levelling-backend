"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Activity, Target, Zap, Clock } from "lucide-react";
import { haptic } from "@/utils/haptics";
import { getAnalysisData, expandSessionReps } from "@/utils/analyticsDb";
import { getVideo } from "@/utils/mediaDb";
import { getGpsHistory } from "@/utils/gpsDb";
import GpsHistoryCharts from "@/components/gps/GpsHistoryCharts";
import RepetitionsChart from "@/components/analytics/RepetitionsChart";
import { Navigation } from "lucide-react";
import AestheticsRoom from "@/components/analysis/AestheticsRoom";
import { parseAestheticsPayload } from "@/utils/aestheticsParser";

/**
 * SessionDetailModal - Drill-down modal for session analysis
 * Matches the "Timeline Performance" + "Dati Video" layout exactly.
 */
export default function SessionDetailModal({ open, sessions, onClose, categoryColor }) {
  const [activeRepIndex, setActiveRepIndex] = useState(0);
  const [repData, setRepData] = useState([]);
  const [videoAnalyses, setVideoAnalyses] = useState([]);
  const [linkedGpsSession, setLinkedGpsSession] = useState(null);
  const svgRef = useRef(null);

  // Toggle States for Overlapping Charts
  const [showVideoData, setShowVideoData] = useState(true);
  const [showGpsData, setShowGpsData] = useState(true);

  // Aesthetics States
  const [showAesthetics, setShowAesthetics] = useState(false);
  const [aestheticsBestReps, setAestheticsBestReps] = useState([]);
  const [isAestheticsLoading, setIsAestheticsLoading] = useState(false);

  const handleAestheticsClick = async () => {
    haptic.medium();
    setIsAestheticsLoading(true);

    try {
      let blob;
      try {
        const mediaId = sessions?.[0]?.mediaId || sessions?.[0]?.id || "v1";
        const storedBlob = await getVideo(mediaId);
        if (storedBlob) {
          blob = storedBlob;
        } else {
          const res = await fetch("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4");
          blob = await res.blob();
        }
      } catch (err) {
        const res = await fetch("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4");
        blob = await res.blob();
      }
      const formData = new FormData();
      formData.append("file", blob, "video.mp4");

      const response = await fetch("https://primary-production-5044d.up.railway.app/webhook/aesthetics-video-analisys", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Webhook fetch failed");
      
      const payload = await response.json();
      
      const formattedRep = {
        id: "webhook-rep",
        label: "AESTHETICS ANALYSIS",
        biomechanics: parseAestheticsPayload(payload, videoAnalyses[0]?.context?.lista_popup?.[0]?.biomechanics)
      };
      
      setAestheticsBestReps([formattedRep]);
      
    } catch (error) {
      console.warn("Webhook failed, using fallback data", error);
      const popups = videoAnalyses[0]?.context?.lista_popup || [];
      const bestRepsMap = {};
      
      popups.forEach(popup => {
         const cat = popup.sub_category || popup.label;
         if (!bestRepsMap[cat] || bestRepsMap[cat].score < popup.score) {
            bestRepsMap[cat] = popup;
         }
      });
      
      setAestheticsBestReps(Object.values(bestRepsMap));
    } finally {
      setIsAestheticsLoading(false);
      setShowAesthetics(true);
    }
  };

  // Load and group data
  useEffect(() => {
    if (!open || !sessions || sessions.length === 0) {
      setRepData([]);
      setVideoAnalyses([]);
      return;
    }

    let currentGlobalOffset = 0;
    const expanded = [];
    
    sessions.forEach(s => {
       const result = expandSessionReps(s, currentGlobalOffset);
       expanded.push(...result.reps);
       currentGlobalOffset = result.newOffset;
    });
    
    setRepData(expanded);
    setActiveRepIndex(0);

    const analyses = [];
    const seenMedia = new Set();
    expanded.forEach(rep => {
      if (!seenMedia.has(rep.mediaId)) {
        seenMedia.add(rep.mediaId);
        if (rep.analysisContext) {
          analyses.push({
            mediaId: rep.mediaId,
            context: rep.analysisContext,
            firstRepIndex: rep.repIndex - 1 
          });
        }
      }
    });
    setVideoAnalyses(analyses);

    // Fetch linked GPS session
    const gpsHistory = getGpsHistory();
    const linked = gpsHistory.find(gps => 
      sessions.some(s => s.id === gps.linkedVideoId)
    );
    setLinkedGpsSession(linked || null);
  }, [open, sessions]);

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
  }, [open]);

  const chartWidth = Math.max(containerWidth, repData.length * 70); 
  const chartHeight = 220;
  const chartPadding = { top: 60, right: 60, bottom: 60, left: 60 };
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maxTime = useMemo(() => {
    let t = repData[repData.length - 1]?.timestamp || 1;
    if (linkedGpsSession && linkedGpsSession.time) {
       t = Math.max(t, linkedGpsSession.time);
    }
    return t;
  }, [repData, linkedGpsSession]);

  const xScale = (timestamp) => chartPadding.left + (timestamp / maxTime) * innerWidth;
  const yScale = (score) => {
    const s = parseFloat(score) || 0;
    return chartPadding.top + innerHeight - (Math.max(0, Math.min(100, s)) / 100) * innerHeight;
  };

  const curvePath = useMemo(() => {
    if (repData.length < 2) return "";
    let path = `M ${xScale(repData[0].timestamp)},${yScale(repData[0].score)}`;
    for (let i = 0; i < repData.length - 1; i++) {
      const x1 = xScale(repData[i].timestamp), y1 = yScale(repData[i].score);
      const x2 = xScale(repData[i + 1].timestamp), y2 = yScale(repData[i + 1].score);
      const cx = x1 + (x2 - x1) / 2;
      path += ` C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    }
    return path;
  }, [repData, innerWidth, innerHeight]);

  const areaPath = useMemo(() => {
    if (repData.length < 2) return "";
    return `${curvePath} L ${xScale(repData[repData.length - 1].timestamp)},${chartHeight - chartPadding.bottom} L ${xScale(repData[0].timestamp)},${chartHeight - chartPadding.bottom} Z`;
  }, [curvePath, repData, chartHeight, chartPadding]);

  const handleMouseMove = (e) => {
    if (!svgRef.current || repData.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    let closestIdx = 0;
    let minDistance = Infinity;
    
    repData.forEach((rep, i) => {
      const distance = Math.abs(x - xScale(rep.timestamp));
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    });

    if (minDistance < 60) {
      if (activeRepIndex !== closestIdx) {
        setActiveRepIndex(closestIdx);
        haptic.light();
      }
    }
  };

  if (!open) return null;

  const currentRep = repData[activeRepIndex];

  return (
    <>
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "flex-end"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxHeight: "96vh", overflowY: "auto",
          borderTopLeftRadius: "32px", borderTopRightRadius: "32px", border: "2px solid #111",
          borderBottom: "none", paddingBottom: "40px"
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 32px", borderBottom: "2px solid #111", display: "flex",
          justifyContent: "space-between", alignItems: "center", background: "#fff",
          position: "sticky", top: 0, zIndex: 100
        }}>
          <div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "950", textTransform: "uppercase", color: "#111" }}>
              {sessions[0]?.type === "SSG" ? "Match Summary" : "Detailed Analysis"}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
               <span style={{ 
                 fontSize: "0.75rem", fontWeight: "900", color: "#fff", 
                 background: sessions[0]?.type === "SSG" 
                   ? "#ff4d80" 
                   : (sessions[0]?.macroArea === "TECHNICAL" ? "#3b82f6" : "var(--primary)"), 
                 padding: "4px 10px", borderRadius: "6px" 
               }}>
                 {sessions[0]?.type === "SSG" ? sessions[0].format : `SESSION ${sessions[0]?.date}`}
               </span>
               <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#aaa", textTransform: "uppercase" }}>
                 {sessions[0]?.type === "SSG" ? `${sessions[0].duration} MINUTES • ${sessions[0].date}` : `${repData.length} ANALYSIS POINTS`}
               </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="interactive-btn"
            style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid #111", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={24} strokeWidth={4} />
          </button>
        </div>

        {sessions[0]?.type === "SSG" ? (
          <div style={{ padding: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                { label: "Goal", val: sessions[0].stats.goals, icon: Target, color: "#ff4d80" },
                { label: "Assist", val: sessions[0].stats.assists, icon: Zap, color: "#ff4d80" },
                { label: "Dribbling", val: sessions[0].stats.dribbles, icon: Activity, color: "#ff4d80" },
                { label: "Passes", val: sessions[0].stats.passes, icon: Navigation, color: "#ff4d80" },
                { label: "Recoveries", val: sessions[0].stats.recoveries, icon: Clock, color: "#ff4d80" },
              ].map((stat, i) => (
                <div key={i} className="interactive-card" style={{ 
                  background: "#fff", border: "2.5px solid #111", borderRadius: "20px", 
                  padding: "20px", display: "flex", flexDirection: "column", gap: "8px",
                  boxShadow: "4px 4px 0px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ background: "rgba(255, 77, 128, 0.1)", borderRadius: "10px", padding: "8px", border: "1.5px solid #111" }}>
                      <stat.icon size={18} color={stat.color} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "900", textTransform: "uppercase", color: "#111" }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: "950", color: "#111", fontFamily: "var(--font-heading)" }}>
                    {stat.val}
                  </div>
                </div>
              ))}
              <div className="interactive-card" style={{ 
                background: "#111", border: "2.5px solid #111", borderRadius: "20px", 
                padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                color: "#fff", gridColumn: "span 1"
              }}>
                 <span style={{ fontSize: "0.6rem", fontWeight: "800", opacity: 0.6, textTransform: "uppercase" }}>Performance</span>
                 <div style={{ fontSize: "1.5rem", fontWeight: "950", color: "#ff4d80" }}>TOP</div>
              </div>
            </div>

            <div style={{ marginTop: "40px", padding: "24px", background: "var(--surface)", borderRadius: "24px", border: "2px dashed #111", textAlign: "center" }}>
               <p style={{ fontSize: "0.9rem", fontWeight: "800", color: "#666", lineHeight: 1.6 }}>
                 This session has been saved correctly. The data contributes to your <span style={{ color: "#111", fontWeight: "900" }}>Elite Progress</span> in the Small Sided Games area.
               </p>
            </div>
          </div>
        ) : (

        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "40px" }}>

          {/* TIMELINE PERFORMANCE SECTION */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Activity size={22} color="var(--primary)" strokeWidth={3} />
                <h4 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase" }}>Timeline Performance</h4>
              </div>
              {currentRep && (
                 <div key={currentRep.id} className="anim-spring-pop interactive-card" style={{ fontSize: "0.9rem", fontWeight: "950", color: "#fff", background: "#111", padding: "6px 16px", borderRadius: "8px", border: "2px solid #ff0000" }}>
                   SCORE: {(currentRep.score / 10).toFixed(1)}
                 </div>
              )}
            </div>

            {(() => {
              const isAthletic = sessions[0]?.macroArea?.toUpperCase() === "ATHLETIC" || sessions[0]?.macroArea?.toUpperCase() === "ATLETICA";
              
              const videoChartContent = isAthletic ? (
                <RepetitionsChart 
                  data={repData} 
                  activeRepIndex={activeRepIndex} 
                  onRepClick={(index) => { haptic.light(); setActiveRepIndex(index); }}
                  color="var(--primary)"
                />
              ) : (
                <div 
                  ref={containerRef}
                  style={{ background: "transparent", overflowX: "auto", position: "relative" }}
                >
                  <div style={{ width: chartWidth, padding: "20px 0" }}>
                    <svg 
                      ref={svgRef}
                      width={chartWidth} height={chartHeight} 
                      onMouseMove={handleMouseMove}
                      style={{ overflow: 'visible', cursor: 'crosshair' }}
                    >
                      <defs>
                        <linearGradient id="detailAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[0, 5, 10].map(v => (
                        <g key={v}>
                          <line x1={chartPadding.left} y1={yScale(v*10)} x2={chartWidth-chartPadding.right} y2={yScale(v*10)} stroke="#f3f3f3" strokeWidth="1" />
                          <text x={chartPadding.left - 20} y={yScale(v*10)+4} fontSize="10" fontWeight="900" fill="#ddd" textAnchor="end">{v}</text>
                        </g>
                      ))}

                      {/* Area fill */}
                      <path d={areaPath} fill="url(#detailAreaGrad)" style={{ transition: "all 0.4s ease" }} />

                      {/* Main Line */}
                      <path 
                        d={curvePath}
                        fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                        style={{ filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.05))" }}
                      />

                      {/* Interactive Vertical Cursor */}
                      <line 
                        x1={xScale(repData[activeRepIndex]?.timestamp || 0)} y1={chartPadding.top - 10} 
                        x2={xScale(repData[activeRepIndex]?.timestamp || 0)} y2={chartHeight - chartPadding.bottom} 
                        stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4"
                      />

                      {/* Points */}
                      {repData.map((rep, i) => {
                        const isActive = activeRepIndex === i;
                        return (
                          <g key={i} onClick={() => { haptic.light(); setActiveRepIndex(i); }} style={{ cursor: "pointer", zIndex: 10 }}>
                             {/* Halo for active point */}
                             {isActive && (
                               <circle 
                                 cx={xScale(rep.timestamp)} cy={yScale(rep.score)} r="16" 
                                 fill="var(--primary)" fillOpacity="0.1" 
                               />
                             )}
                             
                             <circle 
                               cx={xScale(rep.timestamp)} cy={yScale(rep.score)} r={isActive ? 8 : 5} 
                               fill={isActive ? "var(--primary)" : "#fff"} 
                               stroke={isActive ? "#fff" : "#111"} 
                               strokeWidth="3" 
                               style={{ transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }} 
                             />

                             {/* X-Axis labels */}
                             <text 
                               x={xScale(rep.timestamp)} y={chartHeight-chartPadding.bottom+25} 
                               textAnchor="middle" fontSize="10" fontWeight="900" 
                               fill={isActive ? "#111" : "#ccc"} 
                               style={{ transition: "all 0.2s ease" }}
                             >
                               {formatTime(rep.timestamp)}
                             </text>

                             {/* Floating Tooltip */}
                             {isActive && (
                               <g style={{ animation: "springPop 0.4s var(--spring-easing)" }}>
                                 <foreignObject x={xScale(rep.timestamp) - 40} y={yScale(rep.score) - 65} width="80" height="50">
                                   <div style={{
                                     background: "#111", color: "#fff", padding: "6px", borderRadius: "12px",
                                     textAlign: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                                     border: "1px solid rgba(255,255,255,0.1)"
                                   }}>
                                      <div style={{ fontSize: "1.1rem", fontWeight: "950" }}>{(rep.score/10).toFixed(1)}</div>
                                   </div>
                                   <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #111", margin: "-2px auto 0" }} />
                                 </foreignObject>
                               </g>
                             )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              );

              // If there's linked GPS data, overlay the two charts
              if (linkedGpsSession) {
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ position: "relative", minHeight: "280px" }}>
                      {showVideoData && (
                        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
                          {videoChartContent}
                        </div>
                      )}
                      {showGpsData && (
                        <div style={{ position: showVideoData ? "absolute" : "relative", inset: 0, zIndex: 5, opacity: showVideoData ? 0.8 : 1, pointerEvents: showVideoData ? 'none' : 'auto' }}>
                          <GpsHistoryCharts 
                            speedData={linkedGpsSession.speedData} 
                            totalKm={linkedGpsSession.distance}
                            peaks={linkedGpsSession.peaks || [linkedGpsSession.topSpeed]}
                            drops={linkedGpsSession.drops || []}
                            pauses={linkedGpsSession.pausesList || []}
                            hideLabels={false}
                            customWidth={chartWidth}
                            customHeight={chartHeight}
                            customPadding={chartPadding}
                            maxAbsTime={maxTime}
                          />
                        </div>
                      )}
                    </div>
                    {/* Toggle Buttons */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "16px" }}>
                      <button 
                        onClick={() => { haptic.light(); setShowVideoData(!showVideoData); }}
                        className="interactive-btn"
                        style={{ 
                          padding: "10px 20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px",
                          background: showVideoData ? "rgba(59, 130, 246, 0.1)" : "#f5f5f5",
                          border: showVideoData ? "2px solid #3b82f6" : "2px solid #ddd",
                          color: showVideoData ? "#3b82f6" : "#aaa", fontWeight: "900", fontSize: "0.8rem", textTransform: "uppercase"
                        }}
                      >
                        <Activity size={16} /> Video Data
                      </button>
                      <button 
                        onClick={() => { haptic.light(); setShowGpsData(!showGpsData); }}
                        className="interactive-btn"
                        style={{ 
                          padding: "10px 20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px",
                          background: showGpsData ? "rgba(107, 116, 255, 0.1)" : "#f5f5f5",
                          border: showGpsData ? "2px solid #6B74FF" : "2px solid #ddd",
                          color: showGpsData ? "#6B74FF" : "#aaa", fontWeight: "900", fontSize: "0.8rem", textTransform: "uppercase"
                        }}
                      >
                        <Navigation size={16} /> GPS Speed
                      </button>
                    </div>
                  </div>
                );
              }

              return videoChartContent;
            })()}
            <p style={{ fontSize: "0.7rem", fontWeight: "900", color: "#aaa", textAlign: "center", marginTop: "16px", textTransform: "uppercase" }}>
              SCROLL HORIZONTALLY TO SEE ALL POINTS • TAP A POINT FOR DETAILS
            </p>
          </section>

          {/* ANALISI ADVANCED SECTION (GLOBAL) */}
          {videoAnalyses.length > 0 && (
            <section style={{ 
              background: "#fff", border: "2px solid #111", borderRadius: "24px", 
              padding: "24px", boxShadow: "6px 6px 0px rgba(0,0,0,0.03)" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <Activity size={18} color="var(--primary)" />
                <span style={{ fontSize: "0.85rem", fontWeight: "950", textTransform: "uppercase", letterSpacing: "0.08em" }}>Advanced Session Analysis</span>
              </div>

              <div className="v-stack" style={{ gap: "20px" }}>
                <div>
                  <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "var(--primary)", textTransform: "uppercase" }}>Summary</span>
                  <p style={{ fontSize: "0.95rem", fontWeight: "800", color: "#111", marginTop: "4px", lineHeight: 1.5 }}>
                    {videoAnalyses[0].context.dati_box_advanced?.riassunto || "Quantitative analysis completed."}
                  </p>
                </div>

                  <div className="interactive-card" style={{ 
                    padding: "16px", background: "rgba(230, 57, 70, 0.05)", border: "1px solid var(--primary)", 
                    borderRadius: "12px", borderLeft: "6px solid var(--primary)"
                  }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: "900", color: "var(--primary)", textTransform: "uppercase" }}>Main Error:</span>
                    <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "#111", marginTop: "4px" }}>
                      {videoAnalyses[0].context.dati_box_advanced.errore_prevalente}
                    </p>
                  </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {Object.entries(videoAnalyses[0].context.dati_box_advanced || {})
                  .filter(([key]) => !['overallPattern', 'riassunto', 'score', 'voto', 'voto_complessivo', 'punteggio', 'voto_finale_sessione', 'errore_prevalente'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="interactive-card" style={{ padding: "12px", background: "#fcfcfc", border: "1px solid #ddd", borderRadius: "10px" }}>
                        <span style={{ fontSize: "0.5rem", fontWeight: "900", color: "#999", textTransform: "uppercase" }}>{key.replace(/_/g, ' ')}</span>
                        <p style={{ fontSize: "0.85rem", fontWeight: "950", color: "#111", marginTop: "1px" }}>
                          {typeof value === 'object' ? JSON.stringify(value) : value}
                        </p>
                    </div>
                  ))
                  }
                </div>


              </div>
            </section>
          )}

          {/* DATI VIDEO SECTION */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target size={14} color="var(--primary)" strokeWidth={3} />
              </div>
              <h4 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase" }}>Video Data</h4>
            </div>

            <div className="v-stack" style={{ gap: "16px" }}>
              {currentRep?.metrics?.map((m, idx) => (
                <div key={idx} className="interactive-card" style={{ 
                  background: "#fff", border: `2px solid ${m.status === 'correct' ? '#10b981' : '#ff0000'}`, 
                  borderRadius: "20px", padding: "24px", position: "relative",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: "950", textTransform: "uppercase", marginBottom: "8px" }}>
                    {m.label} - SCORE: {m.voto_1_10 || (m.score/10).toFixed(1)}
                  </div>
                  <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "#555", lineHeight: 1.5, maxWidth: "90%" }}>
                    {m.message}
                  </p>
                  <span style={{ position: "absolute", bottom: "16px", right: "24px", fontSize: "0.6rem", fontWeight: "900", color: "#aaa", textTransform: "uppercase" }}>
                    {m.sub_category}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* GPS INTEGRATION SECTION */}
          {linkedGpsSession && (
            <section style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase" }}>GPS Integration</h4>
              </div>
              
              <div style={{ background: "#fcfcfc", border: "2px solid #111", borderRadius: "24px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#777", textTransform: "uppercase" }}>Distance</span>
                    <div style={{ fontSize: "1.2rem", fontWeight: "900" }}>{linkedGpsSession.distance.toFixed(2)} km</div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#777", textTransform: "uppercase" }}>Top Speed</span>
                    <div style={{ fontSize: "1.2rem", fontWeight: "900" }}>{linkedGpsSession.topSpeed.toFixed(1)} km/h</div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#777", textTransform: "uppercase" }}>Avg. Pace</span>
                    <div style={{ fontSize: "1.2rem", fontWeight: "900" }}>{linkedGpsSession.avgSpeed.toFixed(1)} km/h</div>
                  </div>
                </div>

                {!showGpsData && (
                  <p style={{ fontSize: "0.8rem", color: "#777", textAlign: "center", fontStyle: "italic", marginTop: "12px" }}>
                    Chart is hidden. Use the toggle buttons above to display it.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      )}

        </div>
      </div>
      {showAesthetics && (
        <AestheticsRoom 
          bestReps={aestheticsBestReps} 
          onClose={() => setShowAesthetics(false)} 
        />
      )}
    </>
    );
}
