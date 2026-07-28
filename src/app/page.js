"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import IdentityHeader from "@/components/profile/IdentityHeader";
import { Navigation, Play, Activity, Focus, CalendarDays, TrendingUp, Zap, X } from "lucide-react";
import ExpandableSpiderChart from "@/components/profile/ExpandableSpiderChart";
import TacticalDonutChart from "@/components/profile/TacticalDonutChart";
import HoursDonutChart from "@/components/profile/HoursDonutChart";
import FUTCard from "@/components/profile/FUTCard";
import { calculateActualPerformance, getGpsActuals } from "@/utils/performanceUtils";
import { haptic } from "@/utils/haptics";

const DynamicStadium = ({ level, scale = 1 }) => {
  const l = Math.max(1, Math.min(level, 15));

  return (
    <div style={{ 
      width: "100%", 
      height: "100%", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      transform: `scale(${scale})`
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={`/stadiums/${l}_tight.png?v=v8`} 
        alt={`Stadio Livello ${l}`} 
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0px 10px 20px rgba(0,0,0,0.5))"
        }}
      />
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newStadiumLevel, setNewStadiumLevel] = useState(1);
  const [performance, setPerformance] = useState({ tecnica: {}, atletica: {} });
  const [gpsDataList, setGpsDataList] = useState([]);
  const [athleticismFilter, setAthleticismFilter] = useState("All");
  const [targets, setTargets] = useState(null);
  const [isStadiumModalOpen, setIsStadiumModalOpen] = useState(false);

  // Calculate Experience / Stage
  const calculateExperience = () => {
    let logMinutes = 0;
    let gpsMinutes = 0;
    if (typeof window !== "undefined") {
      const logsData = JSON.parse(localStorage.getItem("elite_pro_daily_logs") || '{}');
      Object.values(logsData).forEach(dayLogs => {
        Object.values(dayLogs).forEach(cat => {
          if (cat && cat.total) logMinutes += cat.total;
        });
      });
      const gpsData = JSON.parse(localStorage.getItem("elite_pro_gps_history") || '[]');
      gpsData.forEach(s => {
        if (s.duration) gpsMinutes += parseInt(s.duration);
      });
    }
    const totalTrainingHours = (logMinutes + gpsMinutes) / 60;
    const hoursPerStage = 300;
    const currentStage = Math.floor(totalTrainingHours / hoursPerStage) + 1;
    const progressInStage = (totalTrainingHours % hoursPerStage) / hoursPerStage * 100;
    
    const completedHours = totalTrainingHours;
    const missingHours = Math.max(0, currentStage * hoursPerStage - completedHours);
    
    return { currentStage, progressInStage, completedHours, missingHours, totalTrainingHours };
  };

  const { currentStage, progressInStage, completedHours, missingHours, totalTrainingHours } = calculateExperience();

  useEffect(() => {
    setMounted(true);
    const savedProfile = localStorage.getItem("elite_pro_profile");
    if (!savedProfile) {
      router.replace("/onboarding");
    } else {
      setProfile(JSON.parse(savedProfile));
    }

    const library = JSON.parse(localStorage.getItem('elite_pro_library') || '[]');
    const gpsData = JSON.parse(localStorage.getItem('elite_pro_gps_history') || '[]');
    const savedTargets = JSON.parse(localStorage.getItem('elite_pro_comprehensive_targets') || 'null');
    
    setPerformance(calculateActualPerformance(library));
    setGpsDataList(gpsData);
    setTargets(savedTargets);

    // Level Up Check
    const lastSeenStage = parseInt(localStorage.getItem('elite_pro_last_seen_stage') || '1');
    if (currentStage > lastSeenStage) {
      setNewStadiumLevel(currentStage);
      setShowLevelUpModal(true);
      localStorage.setItem('elite_pro_last_seen_stage', currentStage.toString());
    }
  }, [router, currentStage]);

  if (!mounted || !profile) return null;

  // Formatting data for Spider Charts
  const atleticaData = {
    "Speed": performance.atletica.velocita || 0,
    "Agility": performance.atletica.agilita || 0,
    "Coordination": performance.atletica.coordinazione || 0,
    "Change of Dir.": performance.atletica.cambi_direzione || 0,
    "Pliometria": performance.atletica.pliometria || 0,
  };

  const tecnicaData = {
    "First Touch": performance.tecnica.primo_tocco || 0,
    "Passing": performance.tecnica.passaggio || 0,
    "Control": performance.tecnica.controllo_palla || 0,
    "Dribbling": performance.tecnica.dribbling || 0,
    "Shooting": performance.tecnica.tiro || 0,
  };

  // GPS Filtering
  const TECHNICAL_CATS = ["Shooting", "Dribbling", "Ball Control", "First Touch (Aerial)", "First Touch (Ground)", "Passing", "Cross", "Freestyle"];
  const ATHLETIC_CATS = ["Speed", "Agility", "Dynamic Changes", "Coordination", "Pliometria"];
  const CATEGORIES = [...TECHNICAL_CATS, ...ATHLETIC_CATS, "VO2 Max", "Cardio"];

  const overallGpsActuals = getGpsActuals(gpsDataList);
  const filteredGpsActuals = getGpsActuals(
    athleticismFilter === "All" 
      ? gpsDataList 
      : gpsDataList.filter(s => s.type === athleticismFilter)
  );

  // Athleticism (GPS)
  const athleticismData = {
    "Top Speed": Math.min(100, (filteredGpsActuals.top_speed / (parseFloat(targets?.gps?.top_speed) || 40)) * 100),
    "Avg KM": Math.min(100, (filteredGpsActuals.km_day / (parseFloat(targets?.gps?.km_day) || 12)) * 100),
    "Total KM": Math.min(100, (filteredGpsActuals.total_km / (parseFloat(targets?.gps?.total_km) || 50)) * 100),
    "Avg Speed": Math.min(100, (filteredGpsActuals.avg_speed / (parseFloat(targets?.gps?.avg_speed) || 15)) * 100),
    "Duration": Math.min(100, (filteredGpsActuals.total_duration / (parseFloat(targets?.gps?.duration) || 600)) * 100),
  };

  // DECISION MAKING (Viola) & MOVEMENTS (Blu)
  const decisionData = { quality: 40, instinct: 30, creativity: 30 };
  const movementsData = { ball: 45, space: 35, phase: 20 };

  // Calculate Overall Performance
  const getOverallPerformance = () => {
    let totalScore = 0;
    let count = 0;
    Object.values(performance.tecnica).forEach(score => { if (score > 0) { totalScore += score; count++; } });
    Object.values(performance.atletica).forEach(score => { if (score > 0) { totalScore += score; count++; } });
    Object.values(athleticismData).forEach(score => { if (score > 0) { totalScore += score; count++; } });
    if (count === 0) return 0;
    return Math.min(100, Math.round(totalScore / count));
  };
  const overallPerformance = getOverallPerformance();

  // Get detailed training hours for new card
  const getCategoryHours = () => {
    let totals = { tecnica: 0, atletica: 0, ssg: 0, body_workout: 0, recovery: 0, meditazione: 0 };
    let gpsMins = 0;
    
    if (typeof window !== "undefined") {
      const logsData = JSON.parse(localStorage.getItem("elite_pro_daily_logs") || '{}');
      Object.values(logsData).forEach(dayLogs => {
        Object.entries(dayLogs).forEach(([cat, data]) => {
          if (totals[cat] !== undefined && data && data.total) totals[cat] += data.total;
          if (cat === "small_sided_games" && data && data.total) totals.ssg += data.total;
        });
      });
      const gpsData = JSON.parse(localStorage.getItem("elite_pro_gps_history") || '[]');
      gpsData.forEach(s => {
        if (s.duration) gpsMins += parseInt(s.duration);
      });
    }
    
    return [
      { label: "Tecnica", totalMinutes: totals.tecnica, color: "#4F46E5" },
      { label: "Atletica", totalMinutes: totals.atletica, color: "var(--primary)" },
      { label: "SSG", totalMinutes: totals.ssg, color: "#ec4899" },
      { label: "Body W.", totalMinutes: totals.body_workout, color: "#CCFF00" },
      { label: "Recovery", totalMinutes: totals.recovery, color: "#10B981" },
      { label: "Meditation", totalMinutes: totals.meditazione, color: "#A78BFA" },
      { label: "GPS", totalMinutes: gpsMins, color: "var(--color-gps, #ff4500)" },
    ];
  };
  const categoryHours = getCategoryHours();
  const futPerformance = {
    ...performance,
    gps: athleticismData
  };

  return (
    <div className="app-container page-wrapper" style={{ background: "var(--background)", paddingBottom: "140px" }}>
      <main className="main-content" style={{ gap: "32px", padding: "24px 20px" }}>
        
        {/* HEADER & ANAGRAFICA */}
        <section>
          <IdentityHeader profile={profile} />
        </section>

        {/* PREMIUM BANNER */}
        <div 
          onClick={() => { haptic.medium(); router.push('/premium'); }}
          className="pseudo-haptic"
          style={{ 
            background: "linear-gradient(135deg, #111 0%, #333 100%)", 
            borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 10px 20px rgba(0,0,0,0.15)", border: "2px solid #dcf536", cursor: "pointer", marginTop: "-8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "#dcf536", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-5deg)" }}>
              <Zap size={20} color="#111" fill="#111" />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em" }}>Elite.PRO Premium</h3>
              <p style={{ fontSize: "0.7rem", fontWeight: "700", color: "#dcf536", textTransform: "uppercase" }}>Sblocca analisi illimitate</p>
            </div>
          </div>
          <div style={{ background: "#dcf536", color: "#111", padding: "8px 12px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "900", textTransform: "uppercase" }}>
            Vedi Piani
          </div>
        </div>

        {/* CARRIERA & GLORIA */}
        <section className="v-stack" style={{ gap: "16px" }}>
          <div style={{ marginBottom: "-8px", paddingLeft: "4px" }}>
            <span style={{ fontSize: "0.65rem", color: "#a0a0a0", textTransform: "uppercase", fontStyle: "italic", letterSpacing: "0.05em", fontWeight: "700" }}>
              BENTORNATO IN CAMPO!
            </span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "900", color: "#111", textTransform: "uppercase", fontFamily: "var(--font-heading)", letterSpacing: "0.02em", lineHeight: "1.2", marginTop: "4px" }}>
              LA VOSTRA CARRIERA<br/>
              LA VOSTRA STRADA VERSO LA GLORIA
            </h2>
          </div>

          {/* SINGLE DYNAMIC STADIUM CARD */}
          <div style={{ 
            background: "linear-gradient(145deg, #33343a 0%, #202125 100%)", 
            borderRadius: "20px", 
            padding: "24px 20px", 
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            <div style={{ position: "absolute", top: 0, right: "-20%", bottom: 0, left: "30%", background: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px)", zIndex: 0 }} />
            
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Dynamic Stadium Graphic */}
              <div 
                onClick={() => setIsStadiumModalOpen(true)}
                style={{ width: "100%", height: "160px", marginBottom: "8px", display: "flex", justifyContent: "center", cursor: "pointer" }}
              >
                <DynamicStadium level={currentStage} />
              </div>
              <p style={{ fontSize: "0.6rem", fontWeight: "800", color: "#5c6bfa", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", cursor: "pointer" }} onClick={() => setIsStadiumModalOpen(true)}>
                CLICCA PER VEDERE L'EVOLUZIONE
              </p>

              <div style={{ width: "100%" }}>
                <h3 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#fff", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase" }}>
                  #{currentStage} LEGA {currentStage >= 15 ? "LEGEND" : currentStage >= 10 ? "PRO" : "AMATORI"}
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "4px" }}>
                    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid #dcf536", opacity: 0.8 }}></div>
                    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "6px solid #dcf536" }}></div>
                  </span>
                </h3>
                <p style={{ fontSize: "0.65rem", fontWeight: "700", color: "#a0a0a0", textTransform: "uppercase", fontStyle: "italic", letterSpacing: "0.05em", marginBottom: "20px" }}>
                  IL TUO STADIO SI EVOLVE CON TE: CONTINUA COSÌ
                </p>

                {/* BAR 1: PERFORMANCE FLOW */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>Performance Flow</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#dcf536" }}>{overallPerformance}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "#4a4a4a", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ width: `${overallPerformance}%`, height: "100%", background: "#dcf536", borderRadius: "3px", boxShadow: "0 0 10px rgba(220, 245, 54, 0.4)" }} />
                  </div>
                  <p style={{ fontSize: "0.6rem", fontWeight: "700", color: "#a0a0a0", textTransform: "uppercase", fontStyle: "italic", letterSpacing: "0.05em" }}>
                    {Math.round((100 - overallPerformance) * 10)} PERFORMANCE POINTS PER LA PERFEZIONE
                  </p>
                </div>

                {/* BAR 2: STAGE PROGRESS */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stage Progress</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#5c6bfa" }}>{progressInStage.toFixed(1)}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "#4a4a4a", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ width: `${progressInStage}%`, height: "100%", background: "#5c6bfa", borderRadius: "3px", boxShadow: "0 0 10px rgba(92, 107, 250, 0.4)" }} />
                  </div>
                  <p style={{ fontSize: "0.6rem", fontWeight: "700", color: "#a0a0a0", textTransform: "uppercase", fontStyle: "italic", letterSpacing: "0.05em" }}>
                    <span style={{ color: "#fff" }}>{completedHours.toFixed(1)}</span> ORE COMPLETATE <span style={{ color: "var(--primary)", margin: "0 4px" }}>|</span> <span style={{ color: "#dcf536" }}>{missingHours.toFixed(1)}</span> ORE MANCANTI AL PROSSIMO STAGE
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* GPS LIVE TRACKER CTA */}
        <section>
           <div 
             onClick={() => router.push('/gps')}
             className="pseudo-haptic"
             style={{ 
               background: "#111", 
               color: "#fff", 
               borderRadius: "24px", 
               padding: "24px", 
               display: "flex", 
               justifyContent: "space-between", 
               alignItems: "center",
               boxShadow: "8px 8px 0px rgba(0,0,0,0.1)",
               cursor: "pointer",
               border: "2px solid #111"
             }}
           >
             <div>
               <h3 style={{ fontSize: "1.5rem", fontWeight: "900", fontFamily: "var(--font-heading)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                 <Navigation size={24} color="var(--color-gps)" /> GPS Live
               </h3>
               <p style={{ fontSize: "0.8rem", fontWeight: "700", color: "#aaa", marginTop: "4px" }}>
                 Track running, speed and endurance
               </p>
             </div>
             <div style={{ background: "var(--color-gps)", width: "56px", height: "56px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
               <Play size={24} color="#fff" fill="#fff" style={{ marginLeft: "4px" }} />
             </div>
           </div>

           <button 
             onClick={() => router.push('/gps/history')}
             className="pseudo-haptic"
             style={{ 
               width: "100%", 
               marginTop: "12px",
               padding: "16px", 
               background: "#fff", 
               border: "2px solid #111", 
               borderRadius: "16px", 
               fontSize: "0.9rem", 
               fontWeight: "900", 
               textTransform: "uppercase",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               gap: "8px"
             }}
           >
             <Navigation size={18} /> View Track History
           </button>
        </section>

        {/* DASHBOARD ANALITICA */}
        <section className="v-stack" style={{ gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", borderBottom: "4px solid #111", paddingBottom: "8px", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: "900", letterSpacing: "-0.03em", fontFamily: "var(--font-heading)" }}>
              PERFORMANCE <span className="brush-highlight">DASHBOARD</span>
            </h2>
          </div>
          
          {/* A. 3 SPIDER CHARTS */}
          <div className="v-stack" style={{ gap: "16px" }}>
            
            <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "20px", padding: "20px", overflow: "hidden", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "900", color: "#111", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Activity size={20} color="#6B74FF" />
                  Athleticism
                </h3>
              </div>
              
              <div style={{ display: "flex", overflowX: "auto", width: "100%", maxWidth: "100vw", gap: "8px", paddingBottom: "16px", WebkitOverflowScrolling: "touch" }}>
                {["All", ...CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setAthleticismFilter(cat)}
                    className="interactive-btn"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontWeight: "900",
                      fontSize: "0.7rem",
                      whiteSpace: "nowrap",
                      border: athleticismFilter === cat ? "2px solid #6B74FF" : "2px solid #ddd",
                      background: athleticismFilter === cat ? "var(--surface)" : "#fff",
                      color: athleticismFilter === cat ? "#6B74FF" : "var(--gray-dim)",
                      transition: "all 0.2s",
                      flexShrink: 0
                    }}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              <ExpandableSpiderChart 
                title="" 
                data={athleticismData} 
                color="#6B74FF" 
              />
            </div>

            <ExpandableSpiderChart 
              title="Athletic" 
              data={atleticaData} 
              targetData={targets?.grades?.atletica}
              color="var(--primary)" 
            />
            <ExpandableSpiderChart 
              title="Technical" 
              data={tecnicaData} 
              targetData={targets?.grades?.tecnica}
              color="#4F46E5" 
            />
          </div>

          {/* B. 2 DONUT CHARTS (PAUSED) & REPLACED WITH STATIC CONTENT */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginTop: "16px", alignItems: "start" }}>
             {/* DONUT CHARTS TEMPORARILY PAUSED
             <TacticalDonutChart 
               title="Making" 
               data={decisionData} 
               mainColor="#8b5cf6" 
             />
             <TacticalDonutChart 
               title="Movements" 
               data={movementsData} 
               mainColor="#2563eb" 
             /> 
             */}
             
             {/* Left Card: Scheda Giocatore (FUTCard) */}
             <div 
               className="interactive-card" 
               style={{ 
                 background: "#fff", 
                 border: "2px solid #111", 
                 borderRadius: "20px", 
                 padding: "20px", 
                 display: "flex", 
                 flexDirection: "column", 
                 alignItems: "center",
                 gap: "16px", 
                 boxShadow: "4px 4px 0px rgba(0,0,0,0.1)"
               }}
             >
               <h3 style={{ fontSize: "1.1rem", fontWeight: "900", color: "#111", textTransform: "uppercase", alignSelf: "flex-start", marginBottom: "-10px" }}>
                 Scheda Giocatore
               </h3>
               <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                 <FUTCard profile={profile} performance={futPerformance} hideLabel={true} />
               </div>
             </div>

             {/* Right Card: Ore di Allenamento con Grafico a Torta */}
             <HoursDonutChart data={categoryHours} />
          </div>
        </section>

      </main>

      {/* STADIUM EVOLUTION MODAL */}
      {isStadiumModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
          <div style={{ background: "#000000", border: "1px solid #222", borderRadius: "24px", width: "95%", maxWidth: "1200px", height: "70vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#000000" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Evoluzione Stadio</h2>
              <button onClick={() => setIsStadiumModalOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
            </div>
            
            {/* Horizontal Scroll Container */}
            <div style={{ 
              padding: "32px 24px", 
              overflowX: "auto", 
              overflowY: "hidden", 
              flex: 1, 
              display: "flex", 
              gap: "32px", 
              alignItems: "center",
              scrollbarWidth: "none", // Hide scrollbar in Firefox
              msOverflowStyle: "none"   // Hide scrollbar in IE
            }}>
              {Array.from({ length: 15 }).map((_, idx) => {
                const sLevel = idx + 1;
                const hoursPerStage = 300;
                const targetHours = sLevel * hoursPerStage;
                const isUnlocked = totalTrainingHours >= (sLevel - 1) * hoursPerStage;
                const isCurrent = sLevel === currentStage;
                const missing = Math.max(0, targetHours - totalTrainingHours);

                return (
                  <div key={sLevel} style={{ 
                    background: isCurrent ? "radial-gradient(circle, rgba(92,107,250,0.15) 0%, #000000 80%)" : "#000000",
                    border: "none", 
                    borderRadius: "0", 
                    padding: "32px 20px", 
                    textAlign: "center", 
                    opacity: isUnlocked ? 1 : 0.4, 
                    position: "relative",
                    transition: "all 0.3s",
                    minWidth: "320px",
                    maxWidth: "320px",
                    flexShrink: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <div style={{ width: "100%", height: "180px", marginBottom: "24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <DynamicStadium level={sLevel} scale={1.05} />
                    </div>
                    <h4 style={{ fontSize: "1.2rem", fontWeight: "900", color: "#fff", marginBottom: "8px" }}>STAGE {sLevel}</h4>
                    {isCurrent ? (
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#dcf536", padding: "6px 12px", background: "rgba(220, 245, 54, 0.1)", borderRadius: "12px" }}>CURRENT STADIUM</span>
                    ) : isUnlocked ? (
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#a0a0a0" }}>UNLOCKED</span>
                    ) : (
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#a0a0a0" }}>MANCANO {missing.toFixed(1)}H</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* LEVEL UP REWARD MODAL */}
      {showLevelUpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", padding: "20px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: "900", color: "#dcf536", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", textAlign: "center", textShadow: "0 0 20px rgba(220, 245, 54, 0.5)", animation: "slideDown 0.5s ease" }}>
              LEVEL UP!
            </h2>
            <p style={{ fontSize: "1rem", fontWeight: "700", color: "#fff", textTransform: "uppercase", marginBottom: "40px", textAlign: "center", letterSpacing: "0.1em" }}>
              Hai sbloccato un nuovo stadio
            </p>

            <div style={{ width: "300px", height: "200px", position: "relative", marginBottom: "40px", animation: "scaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
               <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(92, 107, 250, 0.5) 0%, transparent 70%)", zIndex: 0 }} />
               <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
                 <DynamicStadium level={newStadiumLevel} scale={1.2} />
               </div>
            </div>

            <div style={{ background: "#111", border: "2px solid #333", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px", textAlign: "center", animation: "slideUp 0.5s ease 0.3s both" }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#fff", textTransform: "uppercase", marginBottom: "8px" }}>
                STAGE {newStadiumLevel}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#a0a0a0", marginBottom: "20px" }}>
                IL TUO PERCORSO VERSO LA GLORIA CONTINUA
              </p>
              
              <div style={{ width: "100%", height: "8px", background: "#333", borderRadius: "4px", overflow: "hidden", marginBottom: "24px", position: "relative" }}>
                 <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%", background: "#5c6bfa", animation: "fillBar 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both" }} />
              </div>

              <button 
                onClick={() => setShowLevelUpModal(false)}
                className="interactive-btn"
                style={{ width: "100%", padding: "16px", background: "#dcf536", color: "#111", border: "none", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer" }}
              >
                CONTINUA
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes scaleUp { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
            @keyframes fillBar { from { width: 0%; } to { width: 100%; } }
          `}</style>
        </div>
      )}
    </div>
  );
}
