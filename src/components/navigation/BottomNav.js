"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, Plus, Scan, BarChart3, Users, Dumbbell, CalendarDays, Battery, Leaf } from "lucide-react";
import { haptic } from "@/utils/haptics";
 
export default function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
 
  useEffect(() => {
    setMounted(true);
  }, []);
 
  // Hide the navigation entirely on specific flows like onboarding
  // Or if not mounted to avoid hydration mismatches with dynamic path/text
  if (pathname.startsWith("/onboarding") || !mounted) {
    return null;
  }
 
  // Pre-calculate active states
  const isDashboardActive = pathname === "/";
  const isLibraryActive = pathname.startsWith("/library");
  const isAnalysisActive = pathname.startsWith("/analysis");
  const isAnalyticsActive = pathname === "/analytics";
  const isSSGActive = pathname.startsWith("/ssg");
  const isBodyWorkoutActive = pathname.startsWith("/body-workout");
  const isRecoveryActive = pathname === "/recovery";
  const isMeditationActive = pathname.startsWith("/meditazione");
  const isTargetsActive = pathname === "/targets";
  const isRingsActive = pathname === "/rings";
 
  return (
    <nav className="bottom-bar">
 
      {/* 1. DASHBOARD */}
      <Link
        href="/"
        onClick={() => { if (!isDashboardActive) haptic.light(); }}
        className={`nav-item ${isDashboardActive ? "active" : ""}`}
      >
        <Home size={28} strokeWidth={isDashboardActive ? 3 : 2} fill={isDashboardActive ? "currentColor" : "none"} />
        <span className="nav-item-label">Home</span>
      </Link>
 
      {/* 2. ANALYTICS */}
      <Link
        href="/analytics"
        onClick={() => { if (!isAnalyticsActive) haptic.light(); }}
        className={`nav-item ${isAnalyticsActive ? "active" : ""}`}
      >
        <BarChart3 size={28} strokeWidth={isAnalyticsActive ? 3 : 2} fill={isAnalyticsActive ? "currentColor" : "none"} />
        <span className="nav-item-label">Analytics</span>
      </Link>
 
      {/* 3. CENTRAL CTA (UPLOAD/ADD) */}
      <Link
        href="/upload"
        onClick={() => haptic.medium()}
        className="nav-cta"
        style={{ textDecoration: "none" }}
      >
        <Plus size={24} strokeWidth={4} />
        <span>Upload</span>
      </Link>
 
      {/* 4. ANALISI (Scan Icon) */}
      <Link
        href="/analysis"
        onClick={() => { if (!isAnalysisActive) haptic.light(); }}
        className={`nav-item ${isAnalysisActive ? "active" : ""}`}
      >
        <Scan size={28} strokeWidth={isAnalysisActive ? 3 : 2} />
        <span className="nav-item-label">Analysis</span>
      </Link>

      {/* 5. SSG (Small Sided Games) */}
      <Link
        href="/ssg"
        onClick={() => { if (!isSSGActive) haptic.light(); }}
        className={`nav-item ${isSSGActive ? "active" : ""}`}
        style={isSSGActive ? { color: "var(--color-ssg)" } : {}}
      >
        <Users size={24} strokeWidth={isSSGActive ? 3 : 2} fill={isSSGActive ? "var(--color-ssg)" : "none"} />
        <span className="nav-item-label">SSG</span>
      </Link>

      {/* 6. BODY WORKOUT */}
      <Link
        href="/body-workout"
        onClick={() => { if (!isBodyWorkoutActive) haptic.light(); }}
        className={`nav-item ${isBodyWorkoutActive ? "active" : ""}`}
        style={isBodyWorkoutActive ? { color: "var(--color-body-workout)" } : {}}
      >
        <Dumbbell size={24} strokeWidth={isBodyWorkoutActive ? 3 : 2} />
        <span className="nav-item-label">Workout</span>
      </Link>

      {/* 7. RECOVERY */}
      <Link
        href="/recovery"
        onClick={() => { if (!isRecoveryActive) haptic.light(); }}
        className={`nav-item ${isRecoveryActive ? "active" : ""}`}
        style={isRecoveryActive ? { color: "var(--color-recovery)" } : {}}
      >
        {/* Usiamo Battery al posto di Activity per avere un riempimento solido ("ricarica") */}
        <Battery size={24} strokeWidth={isRecoveryActive ? 3 : 2} fill={isRecoveryActive ? "var(--color-recovery)" : "none"} />
        <span className="nav-item-label">Recovery</span>
      </Link>

      {/* 7. MEDITATION */}
      <Link
        href="/meditazione"
        onClick={() => { if (!isMeditationActive) haptic.light(); }}
        className={`nav-item ${isMeditationActive ? "active" : ""}`}
        style={isMeditationActive ? { color: "var(--color-meditation)" } : {}}
      >
        {/* Usiamo Leaf per la meditazione */}
        <Leaf size={24} strokeWidth={isMeditationActive ? 3 : 2} fill={isMeditationActive ? "var(--color-meditation)" : "none"} />
        <span className="nav-item-label">Meditazione</span>
      </Link>

      {/* 8. LIBRERIA */}
      <Link
        href="/library"
        onClick={() => { if (!isLibraryActive) haptic.light(); }}
        className={`nav-item ${isLibraryActive ? "active" : ""}`}
      >
        <Folder size={24} strokeWidth={isLibraryActive ? 3 : 2} fill={isLibraryActive ? "currentColor" : "none"} />
        <span className="nav-item-label">Library</span>
      </Link>

      {/* 9. RINGS */}
      <Link
        href="/rings"
        onClick={() => { if (!isRingsActive) haptic.light(); }}
        className={`nav-item ${isRingsActive ? "active" : ""}`}
        style={isRingsActive ? { color: "var(--primary)" } : {}}
      >
        {/* Custom 4-nested rings icon */}
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
          stroke={isRingsActive ? "var(--primary)" : "currentColor"}
          strokeWidth={isRingsActive ? 2.5 : 2} strokeLinecap="round">
          <circle cx={12} cy={12} r={10} />
          <circle cx={12} cy={12} r={7} />
          <circle cx={12} cy={12} r={4} />
          <circle cx={12} cy={12} r={1.5} fill={isRingsActive ? "var(--primary)" : "currentColor"} stroke="none" />
        </svg>
        <span className="nav-item-label">Rings</span>
      </Link>

      {/* 10. TARGETS */}
      <Link
        href="/targets"
        onClick={() => { if (!isTargetsActive) haptic.light(); }}
        className={`nav-item ${isTargetsActive ? "active" : ""}`}
        style={isTargetsActive ? { color: "var(--primary)" } : {}}
      >
        <CalendarDays size={24} strokeWidth={isTargetsActive ? 3 : 2} />
        <span className="nav-item-label">Targets</span>
      </Link>

    </nav>
  );
}
