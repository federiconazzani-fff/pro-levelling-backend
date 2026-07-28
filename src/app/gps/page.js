"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Navigation, Activity } from "lucide-react";
import { haptic } from "@/utils/haptics";
import { saveGpsSession, calculateDistance } from "@/utils/gpsDb";
import { registerPlugin } from "@capacitor/core";
const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");
import dynamic from "next/dynamic";
const GpsRealMap = dynamic(() => import("@/components/gps/GpsRealMap"), { 
  ssr: false,
  loading: () => <div style={{ flex: 1, background: "#fafafa", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading map...</div>
});


export default function GpsTrackerPage() {
  const router = useRouter();
  
  const [status, setStatus] = useState("IDLE"); // IDLE, RUNNING, PAUSED
  const [time, setTime] = useState(0); // in seconds
  const sessionStartTimeRef = useRef(null);
  const sessionAccumulatedTimeRef = useRef(0);
  const [distance, setDistance] = useState(0); // in km
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [topSpeed, setTopSpeed] = useState(0); // km/h
  const [speedData, setSpeedData] = useState([]); // [{ time: 'MM:SS', speed: 12.5 }]
  const [path, setPath] = useState([]); // [{ lat, lon }]
  
  const [pauseCount, setPauseCount] = useState(0);
  const [totalPauseTime, setTotalPauseTime] = useState(0); // in seconds
  const [pausesList, setPausesList] = useState([]); // [{ time: 123, duration: 45 }]
  const [currentPauseStart, setCurrentPauseStart] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  
  const timerRef = useRef(null);
  const geoWatchRef = useRef(null);
  const simulationRef = useRef(null);

  // Get initial position for map centering
  useEffect(() => {
    // Paywall check TEMPORANEAMENTE DISATTIVATO PER I TEST
    /*
    const isPremium = localStorage.getItem('elite_pro_isPremium');
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    */

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setInitialRegion({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => console.log("Initial pos err", err),
        { enableHighAccuracy: true }
      );
    }
  }, [router]);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Formatting helpers
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // -------------------------
  // TIMER LOGIC
  // -------------------------
  useEffect(() => {
    if (status === "RUNNING") {
      timerRef.current = setInterval(() => {
        if (sessionStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
          setTime(sessionAccumulatedTimeRef.current + elapsed);
        }
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // -------------------------
  // GPS GEOLOCATION
  // -------------------------
  const startTracking = () => {
    BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "Tracciamento sessione sportiva in corso.",
        backgroundTitle: "Elite.PRO GPS",
        requestPermissions: true,
        stale: false,
        distanceFilter: 1
      },
      function callback(location, error) {
        if (error) {
          if (error.code === "NOT_AUTHORIZED") {
            if (window.confirm("App requires location tracking permission. Open settings?")) {
              BackgroundGeolocation.openSettings();
            }
          }
          return console.error(error);
        }

        // Use ref to get the absolute latest status without closure issues
        if (statusRef.current !== "RUNNING") return;
        
        // Update time even in background
        if (sessionStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
          setTime(sessionAccumulatedTimeRef.current + elapsed);
        }

        const { latitude, longitude, speed } = location;
        const speedKmH = speed ? (speed * 3.6) : 0;
        
        setPath(prev => {
          let newDistance = 0;
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const dist = calculateDistance(last.lat, last.lon, latitude, longitude);
            // Ignore tiny movements to avoid jitter
            if (dist > 0.002) {
              setDistance(d => d + dist);
            }
          }
          return [...prev, { lat: latitude, lon: longitude }];
        });
        
        setCurrentSpeed(speedKmH);
        setTopSpeed(prev => Math.max(prev, speedKmH));
        setSpeedData(prev => [...prev, { time: time, speed: speedKmH }]);
      }
    ).then((watcher_id) => {
      geoWatchRef.current = watcher_id;
    });
  };

  const stopTracking = () => {
    if (geoWatchRef.current) {
      BackgroundGeolocation.removeWatcher({ id: geoWatchRef.current });
      geoWatchRef.current = null;
    }
  };

  // -------------------------
  // SIMULATION MODE (For PC Testing)
  // -------------------------
  const startSimulation = () => {
    let lat = 45.4642; // Milan center
    let lon = 9.1900;
    
    simulationRef.current = setInterval(() => {
      if (statusRef.current !== "RUNNING") return;
      
      // Simulate random running movement
      lat += (Math.random() - 0.2) * 0.0002;
      lon += (Math.random() - 0.5) * 0.0003;
      
      const speedKmH = 8 + Math.random() * 6; // Between 8 and 14 km/h
      
      setPath(prev => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const dist = calculateDistance(last.lat, last.lon, lat, lon);
          setDistance(d => d + dist);
        }
        return [...prev, { lat, lon }];
      });
      
      setCurrentSpeed(speedKmH);
      setTopSpeed(prev => Math.max(prev, speedKmH));
      setSpeedData(prev => [...prev, { time: time, speed: speedKmH }]); 
    }, 1000);
  };

  const stopSimulation = () => {
    if (simulationRef.current) clearInterval(simulationRef.current);
  };

  // -------------------------
  // CONTROLS
  // -------------------------
  const handleStart = () => {
    haptic.heavy();
    // Reset session
    sessionStartTimeRef.current = Date.now();
    sessionAccumulatedTimeRef.current = 0;
    setPath([]);
    setDistance(0);
    setTime(0);
    setSpeedData([]);
    setTopSpeed(0);
    setPauseCount(0);
    setTotalPauseTime(0);
    setPausesList([]);
    
    setStatus("RUNNING");
    startTracking(); 
  };

  const handlePause = () => {
    haptic.medium();
    if (sessionStartTimeRef.current) {
      const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      sessionAccumulatedTimeRef.current += elapsed;
      sessionStartTimeRef.current = null;
    }
    setStatus("PAUSED");
    setPauseCount(prev => prev + 1);
    setCurrentPauseStart({ timeAtPause: time, realTimeMs: Date.now() });
  };

  const handleResume = () => {
    haptic.light();
    sessionStartTimeRef.current = Date.now();
    setStatus("RUNNING");
    if (currentPauseStart) {
      const durationSecs = Math.floor((Date.now() - currentPauseStart.realTimeMs) / 1000);
      setTotalPauseTime(prev => prev + durationSecs);
      setPausesList(prev => [...prev, { time: currentPauseStart.timeAtPause, duration: durationSecs }]);
      setCurrentPauseStart(null);
    }
  };

  const handleStop = () => {
    haptic.heavy();
    setStatus("IDLE");
    stopTracking();
    stopSimulation();
    
    let finalPausesList = [...pausesList];
    if (currentPauseStart) {
      const durationSecs = (Date.now() - currentPauseStart.realTimeMs) / 1000;
      finalPausesList.push({ time: currentPauseStart.timeAtPause, duration: durationSecs });
    }
    
    // Calculate final metrics
    const avgSpeed = time > 0 ? (distance / (time / 3600)) : 0;
    
    // Identify peaks and drops
    const validSpeeds = speedData.filter(d => d.speed > 0);
    const calculatedTopSpeed = validSpeeds.length ? Math.max(...validSpeeds.map(d => d.speed)) : 0;
    
    const peaks = validSpeeds.filter(d => d.speed >= calculatedTopSpeed * 0.95).map(d => d.speed);
    const drops = validSpeeds.filter(d => d.speed < avgSpeed * 0.5).map(d => d.speed);

    // Save
    saveGpsSession({
      date: new Date().toLocaleDateString('en-US'),
      time: time,
      distance: distance,
      topSpeed: calculatedTopSpeed || topSpeed,
      avgSpeed: avgSpeed,
      pauseCount: pauseCount,
      totalPauseTime: totalPauseTime,
      pausesList: finalPausesList,
      drops: drops,
      peaks: peaks,
      path: path,
      speedData: speedData.map(d => ({...d, time: formatTime(d.time), rawTime: d.time})), // format times but keep rawTime for mapping
    });
    
    // Navigate to history
    router.replace('/gps/history');
  };

  return (
    <div className="app-container page-wrapper" style={{ background: "#fff", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: 0 }}>
      
      {/* HEADER */}
      <header style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #111", background: "#fff", zIndex: 10 }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
          <Navigation size={20} color="#6B74FF" /> GPS Tracker
        </h1>
        <button onClick={() => router.back()} style={{ fontSize: "0.7rem", fontWeight: "900", background: "none", border: "none", color: "var(--gray-dim)" }}>
          CLOSE
        </button>
      </header>

      {/* METRICS DASHBOARD */}
      <div style={{ background: "#111", color: "#fff", borderBottomLeftRadius: "32px", borderBottomRightRadius: "32px", padding: "20px 24px", zIndex: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
        
        {/* METRICS DASHBOARD - COMPACT VISUALIZATION */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "900", color: "#6B74FF", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>Active Time</span>
            <div style={{ fontSize: "3.5rem", fontWeight: "900", fontFamily: "var(--font-heading)", lineHeight: 1 }}>
              {formatTime(time)}
            </div>
            {status === "PAUSED" && (
              <span style={{ fontSize: "0.7rem", color: "var(--gray-dim)", marginTop: "4px", fontWeight: "700", textTransform: "uppercase" }}>Paused</span>
            )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", padding: "0 8px" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#777", textTransform: "uppercase" }}>Distance</span>
            <div style={{ fontSize: "1.4rem", fontWeight: "900", fontFamily: "var(--font-heading)" }}>{distance.toFixed(2)} <span style={{ fontSize: "0.7rem", color: "#777" }}>km</span></div>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#777", textTransform: "uppercase" }}>Pace</span>
            <div style={{ fontSize: "1.4rem", fontWeight: "900", fontFamily: "var(--font-heading)" }}>{currentSpeed.toFixed(1)} <span style={{ fontSize: "0.7rem", color: "#777" }}>km/h</span></div>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#777", textTransform: "uppercase" }}>Max</span>
            <div style={{ fontSize: "1.4rem", fontWeight: "900", fontFamily: "var(--font-heading)" }}>{topSpeed.toFixed(1)} <span style={{ fontSize: "0.7rem", color: "#777" }}>km/h</span></div>
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          {status === "IDLE" && (
            <button 
              onClick={handleStart}
              className="pseudo-haptic interactive-btn"
              style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#6B74FF", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(107,116,255,0.3)" }}
            >
              <Play size={28} color="#fff" fill="#fff" style={{ marginLeft: "4px" }} />
            </button>
          )}

          {status === "RUNNING" && (
            <button 
              onClick={handlePause}
              className="pseudo-haptic interactive-btn"
              style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(0,0,0,0.3)" }}
            >
              <Pause size={28} color="#111" fill="#111" />
            </button>
          )}

          {status === "PAUSED" && (
            <>
              <button 
                onClick={handleResume}
                className="pseudo-haptic interactive-btn"
                style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#6B74FF", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(107,116,255,0.3)" }}
              >
                <Play size={20} color="#fff" fill="#fff" style={{ marginLeft: "2px" }} />
              </button>
              <button 
                onClick={handleStop}
                className="pseudo-haptic interactive-btn"
                style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#ef4444", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(0,0,0,0.3)" }}
              >
                <Square size={20} color="#fff" fill="#fff" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* MAP AREA (Real) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", background: "#fff", padding: "16px", paddingBottom: "100px" }}>
         <GpsRealMap coordinates={path} initialRegion={initialRegion} color="#6B74FF" strokeWidth={6} />
      </div>
    </div>
  );
}
