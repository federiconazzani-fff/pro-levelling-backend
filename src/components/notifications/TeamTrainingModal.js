"use client";

import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { getWeeklyTargets, hasAnsweredTeamTrainingToday, logTeamTraining } from "@/utils/timeEngine";
import { haptic } from "@/utils/haptics";

export default function TeamTrainingModal() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkNotification = () => {
      // 1. Is it evening? (e.g. past 18:00)
      const now = new Date();
      // For testing purposes, we might want to comment out the hour check, but keeping it true to the prompt:
      // "Il sistema invia una Push Notification serale"
      if (now.getHours() < 18) return;

      // 2. Has it been answered today?
      if (hasAnsweredTeamTrainingToday()) return;

      // 3. Is team training programmed for today?
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const targets = getWeeklyTargets();
      const todayTarget = targets[dayOfWeek]?.team_training?.target || 0;

      if (todayTarget > 0) {
        setShow(true);
      }
    };

    // Check immediately on mount
    checkNotification();
    
    // Listen for custom event that might trigger re-evaluation (e.g. after setting targets)
    window.addEventListener('elite_time_logged', checkNotification);
    const interval = setInterval(checkNotification, 1000 * 60 * 5); // Check every 5 minutes
    
    return () => {
      window.removeEventListener('elite_time_logged', checkNotification);
      clearInterval(interval);
    };
  }, []);

  const handleAnswer = (didTrain) => {
    haptic.heavy();
    logTeamTraining(didTrain); 
    setShow(false);
  };

  if (!mounted || !show) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px"
    }}>
      <div className="anim-spring-pop" style={{
        background: "var(--background)", border: "3px solid var(--foreground)",
        borderRadius: "32px", padding: "32px", width: "100%", maxWidth: "400px",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        boxShadow: "12px 12px 0px rgba(0,0,0,0.2)"
      }}>
        <div style={{ background: "var(--foreground)", color: "var(--background)", padding: "16px", borderRadius: "50%", marginBottom: "24px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        
        <h2 style={{ fontSize: "1.5rem", fontWeight: "900", textTransform: "uppercase", marginBottom: "12px", fontFamily: "var(--font-heading)" }}>
          Team Training
        </h2>
        <p style={{ fontSize: "1rem", fontWeight: "600", color: "var(--gray-dim)", marginBottom: "32px" }}>
          Hai completato la tua sessione di allenamento con la squadra oggi?
        </p>

        <div style={{ display: "flex", gap: "16px", width: "100%" }}>
          <button 
            onClick={() => handleAnswer(false)}
            className="pseudo-haptic"
            style={{ flex: 1, padding: "16px", background: "var(--surface)", color: "var(--foreground)", border: "2px solid var(--surface-light)", borderRadius: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontWeight: "900", textTransform: "uppercase" }}
          >
            <X size={20} /> No
          </button>
          <button 
            onClick={() => handleAnswer(true)}
            className="pseudo-haptic"
            style={{ flex: 1, padding: "16px", background: "var(--foreground)", color: "var(--background)", border: "2px solid var(--foreground)", borderRadius: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontWeight: "900", textTransform: "uppercase", boxShadow: "4px 4px 0px rgba(0,0,0,0.2)" }}
          >
            <Check size={20} /> Sì
          </button>
        </div>
      </div>
    </div>
  );
}
