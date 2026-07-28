"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { haptic } from "@/utils/haptics";
import FUTCard from "@/components/profile/FUTCard";
import HeroCard from "@/components/profile/HeroCard";
import { calculateActualPerformance, getGpsActuals } from "@/utils/performanceUtils";

export default function PlayerCardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [performance, setPerformance] = useState({ tecnica: {}, atletica: {} });
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    // Load profile
    const savedProfile = localStorage.getItem("elite_pro_profile");
    if (!savedProfile) {
      router.replace("/onboarding");
      return;
    }
    setProfile(JSON.parse(savedProfile));

    // Load performance data from library
    const library = JSON.parse(localStorage.getItem('elite_pro_library') || '[]');
    const gpsData = JSON.parse(localStorage.getItem('elite_pro_gps_data') || '[]');
    const savedTargets = JSON.parse(localStorage.getItem('elite_pro_comprehensive_targets') || 'null');

    let calculatedPerformance = { tecnica: {}, atletica: {} };
    let gpsActuals = { km_day: 0, top_speed: 0, total_km: 0, avg_speed: 0, total_duration: 0 };
    
    calculatedPerformance = calculateActualPerformance(library);
    gpsActuals = getGpsActuals(gpsData);

    // Formatting data for Spider Charts and FUT Card
    const athleticismData = {
      "Top Speed": Math.round(Math.min(100, (gpsActuals.top_speed / (parseFloat(savedTargets?.gps?.top_speed) || 40)) * 100)) || 0,
      "Avg KM": Math.round(Math.min(100, (gpsActuals.km_day / (parseFloat(savedTargets?.gps?.km_day) || 12)) * 100)) || 0,
      "Total KM": Math.round(Math.min(100, (gpsActuals.total_km / (parseFloat(savedTargets?.gps?.total_km) || 50)) * 100)) || 0,
      "Avg Speed": Math.round(Math.min(100, (gpsActuals.avg_speed / (parseFloat(savedTargets?.gps?.avg_speed) || 15)) * 100)) || 0,
      "Duration": Math.round(Math.min(100, (gpsActuals.total_duration / (parseFloat(savedTargets?.gps?.duration) || 600)) * 100)) || 0,
    };

    setPerformance({
      ...calculatedPerformance,
      gps: athleticismData
    });

    // Calculate stage and streak
    const logsData = JSON.parse(localStorage.getItem("elite_pro_daily_logs") || '{}');
    let logMinutes = 0;
    const sortedDates = Object.keys(logsData).sort((a, b) => new Date(b) - new Date(a));
    let calculatedStreak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // simple streak counter
    for (let i = 0; i < sortedDates.length; i++) {
      const logDate = new Date(sortedDates[i]);
      logDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(currentDate - logDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 0 || diffDays === 1) {
         if (diffDays === 1 || i > 0) calculatedStreak++;
         currentDate = logDate;
      } else {
         break;
      }
    }
    // If they logged today, add 1 to streak logic or keep it simple. Let's just use the count of consecutive days.
    if (sortedDates.length > 0 && calculatedStreak === 0) calculatedStreak = 1;

    Object.values(logsData).forEach(dayLogs => {
      Object.values(dayLogs).forEach(cat => {
        if (cat && cat.total) logMinutes += cat.total;
      });
    });
    const totalTrainingHours = logMinutes / 60;
    setCurrentStage(Math.floor(totalTrainingHours / 300) + 1);
    
    // Add streak to performance object for easy passing
    setPerformance(prev => ({ ...prev, streak: calculatedStreak, totalHours: Math.round(totalTrainingHours) }));

  }, [router]);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const width = containerRef.current.clientWidth;
      const index = Math.round(scrollLeft / width);
      setActiveCardIndex(index);
    }
  };

  if (!profile) return <div style={{ background: "var(--background)", height: "100vh" }}></div>;

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* HEADER */}
      <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
        <button 
          onClick={() => {
            if (window.haptic) window.haptic.light();
            router.back();
          }}
          className="pseudo-haptic"
          style={{ 
            width: "44px", height: "44px", borderRadius: "50%", border: "2px solid #111", 
            background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" 
          }}
        >
          <ArrowLeft size={24} color="#111" />
        </button>
        <div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "-0.02em", textTransform: "uppercase" }}>LA TUA SCHEDA</h1>
          <p style={{ fontSize: "0.7rem", color: "var(--gray-dim)", fontWeight: "700" }}>SCORRI PER VEDERE I DETTAGLI</p>
        </div>
      </div>

      {/* SWIPEABLE CARDS CONTAINER */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        style={{ 
          flex: 1, 
          display: "flex", 
          overflowX: "auto", 
          scrollSnapType: "x mandatory", 
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none", // Hide scrollbar Firefox
          msOverflowStyle: "none", // Hide scrollbar IE
        }}
        className="hide-scrollbar"
      >
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
        
        {/* CARD 1 (FUT Style) */}
        <div style={{ minWidth: "100vw", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", padding: "20px" }}>
          <FUTCard profile={profile} performance={performance} />
        </div>

        {/* CARD 2 (Hero Style) */}
        <div style={{ minWidth: "100vw", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", padding: "20px" }}>
          <HeroCard profile={profile} stage={currentStage} performance={performance} />
        </div>
        
      </div>

      {/* DOT INDICATORS */}
      <div style={{ padding: "32px 20px", display: "flex", justifyContent: "center", gap: "8px" }}>
        <div style={{ 
          width: activeCardIndex === 0 ? "24px" : "8px", 
          height: "8px", 
          borderRadius: "4px", 
          background: activeCardIndex === 0 ? "var(--primary)" : "#d1d5db",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }} />
        <div style={{ 
          width: activeCardIndex === 1 ? "24px" : "8px", 
          height: "8px", 
          borderRadius: "4px", 
          background: activeCardIndex === 1 ? "var(--primary)" : "#d1d5db",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }} />
      </div>

    </div>
  );
}
