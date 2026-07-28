"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, Trash2, Check, X, Dumbbell, Video, Clock, Target, Flame, ChevronDown, ChevronUp, Loader2, UploadCloud, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import CompletionBadge from "@/app/upload/components/CompletionBadge";
import { haptic } from "@/utils/haptics";
import { logTime } from "@/utils/timeEngine";
import { saveVideo } from "@/utils/mediaDb";
import { compressVideo } from "@/utils/videoCompressor";

const ACCENT = "#CCFF00"; // Giallo Fluo Verdino
const MUSCLES = ["Quadricipite","Ischio","Polpaccio","Core","Dorsale","Petto","Bicipite","Tricipite","Miofasciale"];

export default function BodyWorkoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [dailyCompleted, setDailyCompleted] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [showFormFor, setShowFormFor] = useState(null);
  const [nextVideos, setNextVideos] = useState({}); // { [workoutId]: { [idx]: { file, url, sizeOrig, dur, isOptimized, progress, status, name } } }
  const [compressingAll, setCompressingAll] = useState({});
  const [unmarkTarget, setUnmarkTarget] = useState(null); // { workout, sessionIndex }
  const [selectedDate, setSelectedDate] = useState({});
  const todayDate = new Date().toISOString().split("T")[0];

  useEffect(()=>{
    setMounted(true);
    const w=localStorage.getItem("elite_pro_workouts"); if(w) setWorkouts(JSON.parse(w));
    const s=localStorage.getItem("elite_pro_workout_sessions"); if(s) setSessions(JSON.parse(s));
    const today=new Date().toISOString().split("T")[0];
    const d=localStorage.getItem("elite_pro_daily_workouts");
    if(d){
      const p=JSON.parse(d);
      if(p.date===today) {
        const items = p.items || {};
        const migrated = {};
        Object.keys(items).forEach(id => {
          const item = items[id];
          if (Array.isArray(item)) {
            migrated[id] = item;
          } else if (item && typeof item === 'object') {
            const count = item.count || 1;
            const list = [];
            for (let i = 0; i < count; i++) {
              list.push({
                id: `${id}-${i}-${Date.now()}`,
                videoAttached: i === 0 ? !!item.videoAttached : false,
                videoDuration: i === 0 ? (item.videoDuration || 0) : 0,
                completedAt: item.completedAt || new Date().toISOString()
              });
            }
            migrated[id] = list;
          }
        });
        setDailyCompleted(migrated);
      }
    }
  },[]);

  const persist=(w)=>{setWorkouts(w);localStorage.setItem("elite_pro_workouts",JSON.stringify(w));};
  const saveDaily=(items)=>{setDailyCompleted(items);localStorage.setItem("elite_pro_daily_workouts",JSON.stringify({date:new Date().toISOString().split("T")[0],items}));};

  const addToHistory = (workout, videoAttached = false, chosenDateIso) => {
    const sessionEntry = {
      id: Date.now() + Math.random(),
      workoutId: workout.id,
      videoAttached,
      completedAt: chosenDateIso || new Date().toISOString(),
      workoutName: workout.name
    };
    const all = [sessionEntry, ...sessions];
    setSessions(all);
    localStorage.setItem("elite_pro_workout_sessions", JSON.stringify(all));
  };

  const removeFromHistory = (workoutId) => {
    const idx = sessions.findIndex(s => s.workoutId === workoutId);
    if (idx !== -1) {
      const copy = [...sessions];
      copy.splice(idx, 1);
      setSessions(copy);
      localStorage.setItem("elite_pro_workout_sessions", JSON.stringify(copy));
    }
  };

  const addSessionInstance = async (workoutId, videoAttached = false) => {
    haptic.heavy();
    const workout = workouts.find(w => w.id === workoutId);
    const workoutVids = nextVideos[workoutId] || {};
    
    const chosenDateStr = selectedDate[workoutId] !== undefined ? selectedDate[workoutId] : todayDate;
    if (!chosenDateStr) return;
    const isToday = chosenDateStr === todayDate;
    const chosenDateIso = isToday ? new Date().toISOString() : `${chosenDateStr}T12:00:00.000Z`;

    let totalDur = 0;
    if (videoAttached) {
      totalDur = Object.values(workoutVids).reduce((acc, f) => acc + (f.dur || 1), 0);
    }
    if (totalDur === 0) totalDur = parseInt(workout?.time) || 10;
    
    // Save video files to indexdb mediaDb if attached
    if (videoAttached && Object.keys(workoutVids).length > 0) {
      const uploadId = `u-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      const newUpload = {
        id: uploadId,
        type: "session",
        title: `${workout?.name || "Workout"}`,
        date: chosenDateStr,
        macroArea: "WORKOUT",
        subCategories: [workout?.name || "Workout"],
        status: "NOT_ANALYZED"
      };
      
      try {
        const validExercises = workout?.exercises?.filter(e => e.name) || [];
        let computedSlots = [];
        if (validExercises.length === 0) {
          computedSlots = [{ title: "Video Allenamento" }];
        } else {
          validExercises.forEach((ex) => {
            const numSets = parseInt(ex.sets) || 1;
            for(let s=0; s<numSets; s++) {
              computedSlots.push({ title: `${ex.name} - SET ${s+1}` });
            }
          });
        }
        
        newUpload.reps = await Promise.all(Object.keys(workoutVids).map(async (idx) => {
           const repId = `${uploadId}-r${idx}`;
           const exName = computedSlots[idx]?.title || `Esercizio ${parseInt(idx)+1}`;
           if (workoutVids[idx]?.file) await saveVideo(repId, workoutVids[idx].file);
           return { id: repId, status: "NOT_ANALYZED", title: exName };
        }));
        
        const lib = JSON.parse(localStorage.getItem("elite_pro_library") || "[]");
        localStorage.setItem("elite_pro_library", JSON.stringify([newUpload, ...lib]));
      } catch (err) {
        console.error("Failed to save session videos", err);
      }
    }

    const currentList = dailyCompleted[workoutId] || [];
    const newSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      videoAttached,
      videoDuration: totalDur,
      videoUrl: videoAttached && workoutVids[0] ? workoutVids[0].url : "", // Just previewing the first one if needed
      completedAt: chosenDateIso
    };

    const updatedList = [...currentList, newSession];
    saveDaily({
      ...dailyCompleted,
      [workoutId]: updatedList
    });

    // Clear the selected video input state for this workout
    setNextVideos(prev => {
      const copy = { ...prev };
      delete copy[workoutId];
      return copy;
    });
    
    setExpandedId(null);
    setShowFormFor(null);

    // Log to ring
    logTime("body_workout", totalDur, null, chosenDateStr);

    // Add to history
    if (workout) addToHistory(workout, videoAttached, chosenDateIso);
  };

  const handleIncrement = (workout) => {
    haptic.medium();
    setExpandedId(workout.id);
    setShowFormFor(workout.id);
  };

  const handleDecrement = (workout) => {
    const workoutId = workout.id;
    const currentList = dailyCompleted[workoutId] || [];
    if (currentList.length > 0) {
      haptic.medium();
      setUnmarkTarget({ workout, sessionIndex: currentList.length - 1 });
    }
  };

  const confirmUnmark = () => {
    if (!unmarkTarget) return;
    const { workout, sessionIndex } = unmarkTarget;
    const workoutId = workout.id;
    const currentList = dailyCompleted[workoutId] || [];
    
    if (currentList.length > 0 && sessionIndex >= 0 && sessionIndex < currentList.length) {
      const removed = currentList[sessionIndex];
      const dur = removed.videoDuration || parseInt(workout.time) || 10;
      const targetDate = removed.completedAt ? removed.completedAt.split("T")[0] : undefined;
      
      const updatedList = [...currentList];
      updatedList.splice(sessionIndex, 1);
      
      const updatedCompleted = { ...dailyCompleted };
      if (updatedList.length === 0) {
        delete updatedCompleted[workoutId];
      } else {
        updatedCompleted[workoutId] = updatedList;
      }
      
      saveDaily(updatedCompleted);
      
      // Subtract from ring
      logTime("body_workout", -dur, null, targetDate);
      
      // Remove from history
      removeFromHistory(workoutId);
    }
    
    setUnmarkTarget(null);
  };


  const handleVideoSelect = (e, workoutId, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      const dur = Math.ceil(vid.duration / 60) || 1;
      setNextVideos(prev => ({
        ...prev,
        [workoutId]: {
          ...(prev[workoutId] || {}),
          [index]: { name: file.name, url, dur, file, sizeOrig: sizeMB, isOptimized: false, progress: 0, status: 'ready' }
        }
      }));
      haptic.medium();
    };
    vid.src = url;
  };

  const handleCompressAll = async (workoutId) => {
    const workoutVids = nextVideos[workoutId] || {};
    const fileKeys = Object.keys(workoutVids).filter(k => !workoutVids[k].isOptimized);
    if (fileKeys.length === 0) return;

    setCompressingAll(prev => ({...prev, [workoutId]: true}));
    haptic.medium();

    for (const index of fileKeys) {
      const fileData = workoutVids[index];
      if (!fileData || !fileData.file) continue;

      setNextVideos(prev => ({
        ...prev,
        [workoutId]: { ...prev[workoutId], [index]: { ...prev[workoutId][index], status: 'compressing' } }
      }));

      try {
        const compressedBlob = await compressVideo(fileData.file, (p) => {
          setNextVideos(prev => ({
            ...prev,
            [workoutId]: { ...prev[workoutId], [index]: { ...prev[workoutId][index], progress: p } }
          }));
        });
        
        const newUrl = URL.createObjectURL(compressedBlob);
        const newSizeMB = (compressedBlob.size / (1024 * 1024)).toFixed(1);
        
        setNextVideos(prev => ({
          ...prev,
          [workoutId]: {
            ...prev[workoutId],
            [index]: { ...prev[workoutId][index], file: compressedBlob, url: newUrl, sizeOpt: newSizeMB, isOptimized: true, progress: 100, status: 'done' }
          }
        }));
        haptic.light();
      } catch (err) {
        console.error("Compression failed", err);
        alert(`Errore compressione: ${err.message}`);
        setNextVideos(prev => ({
          ...prev,
          [workoutId]: { ...prev[workoutId], [index]: { ...prev[workoutId][index], status: 'ready', progress: 0 } }
        }));
        setCompressingAll(prev => ({...prev, [workoutId]: false}));
        return; 
      }
    }

    setCompressingAll(prev => ({...prev, [workoutId]: false}));
    haptic.heavy();
  };


  const completedCount = Object.keys(dailyCompleted).filter(id => dailyCompleted[id]?.length > 0).length;
  const progress = workouts.length ? (completedCount / workouts.length) * 100 : 0;
  if (!mounted) return null;

  const inp = {padding:"13px 15px",borderRadius:"10px",border:"2px solid #e5e5e5",fontSize:"0.9rem",fontWeight:700,outline:"none",background:"#fafafa",fontFamily:"inherit",width:"100%"};

  return (
    <div className="app-container page-wrapper" style={{ minHeight: "100vh", paddingBottom: "100px", background: "var(--background)" }} suppressHydrationWarning>
      
      {/* PREMIUM HEADER SECTION */}
      <header style={{ background: "#fff", zIndex: 100, position: "sticky", top: 0, borderBottom: "2px solid #111" }}>
        <div style={{ padding: "24px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button 
                onClick={()=>{haptic.medium();router.back();}} 
                className="interactive-btn"
                style={{ width: "32px", height: "32px", borderRadius: "8px", border: "2px solid #111", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ArrowLeft size={16} color="#111" strokeWidth={3}/>
              </button>
              <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "#111", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Daily Training
              </span>
            </div>
            
            <h2 style={{ fontSize: "2rem", fontWeight: "900", letterSpacing: "-0.04em", textTransform: "uppercase", fontFamily: "var(--font-heading)", lineHeight: 0.9, marginTop: "4px" }}>
              BODY{' '}
              <span style={{ position: "relative", display: "inline-block" }}>
                 <span>WORKOUT</span>
                 <span style={{ 
                   position: "absolute", 
                   bottom: "-2px", 
                   left: 0, 
                   right: 0, 
                   height: "8px", 
                   background: "rgba(204, 255, 0, 0.4)", 
                   zIndex: -1, 
                   transform: "skewX(-15deg)" 
                 }}></span>
              </span>
            </h2>
          </div>

          <div style={{ textAlign: "right" }}>
            <button 
              onClick={()=>{haptic.light();router.push("/body-workout/create");}} 
              className="interactive-btn"
              style={{ 
                padding: "10px 16px", 
                borderRadius: "10px", 
                fontWeight: "900", 
                fontSize: "0.75rem", 
                background: ACCENT, 
                color: "#111", 
                border: "2px solid #111", 
                display: "flex", 
                alignItems: "center", 
                gap: "6px",
                boxShadow: "4px 4px 0px #eee",
                transition: "all 0.2s"
              }}
            >
              <Plus size={16} strokeWidth={3} /> NEW
            </button>
          </div>
        </div>

        {/* Progress Bar inside Header */}
        {workouts.length > 0 && (
          <div style={{ padding: "0 24px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Completion</span>
              <span style={{ fontSize: "0.6rem", fontWeight: "900", color: completedCount > 0 ? "#111" : "var(--gray-dim)" }}>
                {completedCount} / {workouts.length}
              </span>
            </div>
            <div style={{ height: "6px", background: "var(--surface)", borderRadius: "3px", border: "1px solid var(--surface-light)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: ACCENT, borderRadius: "3px", transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}/>
            </div>
          </div>
        )}
      </header>

      <main className="v-stack" style={{ gap: "24px", padding: "24px 20px" }}>

        {/* STATS CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          <div className="interactive-card" style={{ padding: "16px", background: "#fff", border: "2px solid #111", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flame size={16} color={ACCENT} strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#111", lineHeight: 1 }}>{sessions.length}</div>
              <div style={{ fontSize: "0.65rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase", marginTop: "4px" }}>Total Sessions</div>
            </div>
          </div>
          
          <div className="interactive-card" style={{ padding: "16px", background: "#fff", border: "2px solid #111", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Target size={16} color="#4F46E5" strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#111", lineHeight: 1 }}>{workouts.length}</div>
              <div style={{ fontSize: "0.65rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase", marginTop: "4px" }}>Saved Workouts</div>
            </div>
          </div>
        </div>

        {/* WORKOUT LIST */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Dumbbell size={18} color="#111" />
            <h3 style={{ fontSize: "0.9rem", fontWeight: "900", textTransform: "uppercase", color: "#111" }}>
              Your Routines
            </h3>
          </div>

          {workouts.length === 0 && (
            <div style={{ 
              padding: "40px 24px", textAlign: "center", color: "var(--gray-dim)", 
              display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
              background: "var(--surface)", borderRadius: "16px", border: "2px dashed var(--surface-light)"
            }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#fff", border: "2px solid #eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Dumbbell size={24} color="#ccc" strokeWidth={2}/>
              </div>
              <div className="v-stack" style={{ gap: "4px" }}>
                <p style={{ fontWeight: "900", fontSize: "1rem", color: "#111", textTransform: "uppercase" }}>No Workouts Saved</p>
                <p style={{ fontSize: "0.75rem", fontWeight: "700", maxWidth: "200px", margin: "0 auto" }}>Tap <span style={{ color: "#111", fontWeight: "900" }}>NEW</span> to build your first routine.</p>
              </div>
            </div>
          )}

          <div className="v-stack" style={{ gap: "12px" }}>
            {workouts.map((workout, idx) => {
              const currentList = dailyCompleted[workout.id] || [];
              const count = currentList.length;
              const done = count > 0;
              const open = expandedId === workout.id;
              
              return (
                <div 
                  key={workout.id} 
                  className="interactive-card"
                  style={{ 
                    background: done ? "rgba(204, 255, 0, 0.05)" : "#fff", 
                    border: done ? `2px solid #111` : "2px solid #111", 
                    borderRadius: "12px", 
                    overflow: "hidden", 
                    animation: `blockFadeIn 0.3s cubic-bezier(0.1, 0.9, 0.2, 1) ${idx * 0.05}s both`,
                    transition: "all 0.2s"
                  }}
                >
                  {/* Card Header */}
                  <div 
                    onClick={() => { haptic.light(); setExpandedId(open ? null : workout.id); }} 
                    style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer" }}
                  >
                    {/* Status Icon */}
                    <div style={{ 
                      width: "48px", height: "48px", borderRadius: done ? "50%" : "10px", 
                      background: done ? "#10B981" : "var(--surface)", 
                      border: done ? "2px solid #10B981" : "2px solid var(--surface-light)", 
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: done ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }}>
                      {done ? <CompletionBadge isComplete={true} showText={false} color="#fff" /> : <Dumbbell size={20} color="#111" />}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "1rem", fontWeight: "900", color: "#111", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {workout.name}
                      </p>
                      <div style={{ display: "flex", gap: "10px", marginTop: "6px", alignItems: "center" }}>
                        {workout.time && (
                          <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--gray-dim)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={12}/> {workout.time}m
                          </span>
                        )}
                        {workout.objective && (
                          <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--gray-dim)" }}>
                            {workout.objective}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Multiplier / Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {done && (
                        <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#111", color: "#fff", borderRadius: "8px", padding: "6px 12px" }}>
                          <button onClick={() => handleDecrement(workout)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={14} strokeWidth={3}/></button>
                          <span style={{ fontSize: "0.8rem", fontWeight: "900", color: ACCENT }}>x{count}</span>
                          <button onClick={() => handleIncrement(workout)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} strokeWidth={3}/></button>
                        </div>
                      )}
                      
                      {!open && !done && (
                        <button 
                          onClick={e => { e.stopPropagation(); haptic.heavy(); persist(workouts.filter(w => w.id !== workout.id)); }} 
                          style={{ width: "36px", height: "36px", borderRadius: "8px", border: "2px solid var(--surface-light)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Trash2 size={16} color="var(--gray-dim)" />
                        </button>
                      )}
                      
                      {open ? <ChevronUp size={20} color="#111" /> : <ChevronDown size={20} color="var(--gray-dim)" />}
                    </div>
                  </div>

                  {/* Muscles Tags */}
                  {workout.muscles?.length > 0 && (
                    <div style={{ padding: "0 16px 16px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {workout.muscles.map(m => (
                        <span key={m} style={{ 
                          fontSize: "0.6rem", fontWeight: "900", textTransform: "uppercase", padding: "4px 8px", borderRadius: "6px", 
                          background: done ? "#111" : "var(--surface)", color: done ? ACCENT : "var(--gray-dim)", 
                          border: done ? "1px solid #111" : "1px solid var(--surface-light)" 
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* EXPANDED PANEL */}
                  {open && (
                    <div onClick={e => e.stopPropagation()} style={{ borderTop: "2px solid var(--surface-light)", padding: "24px 16px", background: "var(--surface)", animation: "slideUp 0.2s ease" }}>
                      
                      {/* Exercises List */}
                      {workout.exercises?.filter(e => e.name).length > 0 && (
                        <div style={{ marginBottom: "24px" }}>
                          <p style={{ fontSize: "0.6rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)", letterSpacing: "0.1em", marginBottom: "12px" }}>
                            Exercise List
                          </p>
                          <div className="v-stack" style={{ gap: "8px" }}>
                            {workout.exercises.filter(e => e.name).map((ex, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#fff", borderRadius: "10px", border: "1px solid var(--surface-light)" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#111" }}>{ex.name}</span>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  {ex.weights && (
                                    <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#111", background: "#CCFF00", padding: "4px 10px", borderRadius: "6px" }}>
                                      {ex.weights} kg
                                    </span>
                                  )}
                                  <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "var(--gray-dim)", background: "var(--surface)", padding: "4px 10px", borderRadius: "6px" }}>
                                    {ex.sets && `${ex.sets}×`}{ex.value} {ex.type === "reps" ? "reps" : "min"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Active Completed Sessions */}
                      {done && (
                        <div style={{ marginBottom: "24px" }}>
                          <p style={{ fontSize: "0.6rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)", letterSpacing: "0.1em", marginBottom: "12px" }}>
                            Completed Today
                          </p>
                          <div className="v-stack" style={{ gap: "12px" }}>
                            {currentList.map((session, sIdx) => (
                              <div key={session.id} style={{ background: "#fff", border: "2px solid #111", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#111" }}>Session #{sIdx + 1} ({session.videoDuration}m)</span>
                                  <button 
                                    onClick={() => { haptic.heavy(); setUnmarkTarget({ workout, sessionIndex: sIdx }); }} 
                                    style={{ padding: "6px 12px", background: "#fee2e2", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase", cursor: "pointer" }}
                                  >
                                    Remove
                                  </button>
                                </div>
                                {session.videoAttached && session.videoUrl && (
                                  <div style={{ borderRadius: "8px", overflow: "hidden", border: "2px solid #111", background: "#000" }}>
                                    <video src={session.videoUrl} controls playsInline style={{ width: "100%", maxHeight: "160px", display: "block", objectFit: "contain" }}/>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Log Action Area */}
                      {(!done || showFormFor === workout.id) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ flex: 1, height: "1px", background: "var(--surface-light)" }}></div>
                            <span style={{ fontSize: "0.6rem", fontWeight: "900", textTransform: "uppercase", color: "var(--gray-dim)", letterSpacing: "0.1em" }}>
                              {done ? "Log Additional Session" : "Log Session"}
                            </span>
                            <div style={{ flex: 1, height: "1px", background: "var(--surface-light)" }}></div>
                          </div>

                          {/* Date Selection */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#111", marginBottom: "8px" }}>Session Date</label>
                            <input 
                              type="date" 
                              max={todayDate} 
                              value={selectedDate[workout.id] || todayDate} 
                              onChange={e => setSelectedDate(prev => ({ ...prev, [workout.id]: e.target.value }))} 
                              style={{ width: "100%", padding: "14px 16px", borderRadius: "10px", border: "2px solid var(--surface-light)", fontSize: "0.9rem", fontWeight: "700", outline: "none", background: "#fff", fontFamily: "inherit", transition: "border 0.3s" }} 
                              onFocus={(e) => e.target.style.borderColor = "#111"}
                              onBlur={(e) => e.target.style.borderColor = "var(--surface-light)"}
                            />
                          </div>

                          {/* Video Upload Section */}
                          <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "12px", padding: "20px" }}>
                            <div className="h-stack" style={{ gap: "8px", marginBottom: "8px" }}>
                              <Target size={16} color="var(--primary)" />
                              <h4 style={{ fontSize: "0.85rem", fontWeight: "900", color: "#111", textTransform: "uppercase" }}>Video Evidence (Optional)</h4>
                            </div>



                            <div className="v-stack" style={{ gap: "12px" }}>
                              {(() => {
                                const validExercises = workout.exercises?.filter(e => e.name) || [];
                                let slots = [];
                                if (validExercises.length === 0) {
                                  slots = [{ title: "Workout Video", exName: "Workout", setNum: "" }];
                                } else {
                                  validExercises.forEach((ex) => {
                                    const numSets = parseInt(ex.sets) || 1;
                                    for (let s = 0; s < numSets; s++) {
                                      slots.push({ title: `${ex.name} - SET ${s + 1}`, exName: ex.name, setNum: `SET ${s + 1}` });
                                    }
                                  });
                                }
                                
                                return slots.map((slot, i) => {
                                  const wVids = nextVideos[workout.id] || {};
                                  const fileObj = wVids[i];
                                  const isComp = compressingAll[workout.id];
                                  const isFirstSet = slot.setNum === "SET 1" || slot.setNum === "";
                                  
                                  return (
                                    <div key={`w-${workout.id}-rep-${i}`} className="v-stack" style={{ gap: "8px", marginTop: (i > 0 && isFirstSet) ? "12px" : "0" }}>
                                      {isFirstSet && slot.exName !== "Workout" && (
                                        <p style={{ fontSize: "0.75rem", fontWeight: "900", color: "#111", textTransform: "uppercase", paddingLeft: "4px" }}>
                                          {slot.exName}
                                        </p>
                                      )}
                                      <div 
                                        onClick={() => !fileObj && !isComp && document.getElementById(`w-in-${workout.id}-${i}`).click()}
                                        style={{ 
                                          cursor: fileObj || isComp ? "default" : "pointer", 
                                          display: "flex", alignItems: "center", gap: "12px", 
                                          background: "var(--surface)", padding: "16px", borderRadius: "10px", 
                                          border: fileObj ? "2px solid #111" : "2px dashed var(--surface-light)", 
                                          transition: "all 0.2s" 
                                        }}
                                      >
                                        <div style={{ background: fileObj ? (fileObj.isOptimized ? "#10b981" : "var(--primary)") : "#111", color: "#fff", fontWeight: "900", fontSize: "0.7rem", padding: "4px 8px", borderRadius: "6px", textTransform: "uppercase" }}>
                                          {slot.setNum || "VIDEO"}
                                        </div>
                                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", color: fileObj ? "#111" : "var(--gray-dim)" }}>
                                          {fileObj ? (fileObj.isOptimized ? <Check size={18} color="#10b981" /> : (fileObj.status === 'compressing' ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />)) : <Plus size={18} />}
                                          <span style={{ fontSize: "0.85rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>{fileObj ? fileObj.name : "Select Video"}</span>
                                          {fileObj?.isOptimized && <span style={{ fontSize: "0.7rem", fontWeight: "900", background: "#10b981", color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>READY</span>}
                                        </div>
                                        {fileObj && !isComp && (
                                          <button onClick={(e) => { e.stopPropagation(); setNextVideos(prev => { const n = {...prev}; if(n[workout.id]) { const w = {...n[workout.id]}; delete w[i]; n[workout.id]=w; } return n; }); }} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={18} color="var(--gray-dim)" /></button>
                                        )}
                                      </div>
                                      
                                      {/* Compression Progress */}
                                      {fileObj && fileObj.status !== 'done' && (
                                        <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "8px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: "800" }}>
                                            <span style={{ color: "var(--gray-dim)" }}>ORIG: {fileObj.sizeOrig} MB</span>
                                            {fileObj.status === 'compressing' && <span style={{ color: "var(--primary)" }}>COMPRESSING {fileObj.progress}%</span>}
                                            {fileObj.status === 'ready' && <span style={{ color: "orange" }}>WAITING QUEUE</span>}
                                          </div>
                                          {fileObj.status === 'compressing' && (
                                            <div style={{ width: "100%", height: "4px", background: "var(--surface)", borderRadius: "2px", overflow: "hidden" }}>
                                              <div style={{ width: `${fileObj.progress}%`, height: "100%", background: "var(--primary)", transition: "width 0.2s" }} />
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <input id={`w-in-${workout.id}-${i}`} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleVideoSelect(e, workout.id, i)} />
                                    </div>
                                  );
                                });
                              })()}
                              
                              {/* Fast Prepare Button */}
                              {(() => {
                                const wVids = nextVideos[workout.id] || {};
                                const selCount = Object.keys(wVids).length;
                                const optCount = Object.values(wVids).filter(f => f.isOptimized).length;
                                if (selCount > 0 && optCount < selCount) {
                                  return (
                                    <button 
                                      onClick={() => handleCompressAll(workout.id)} 
                                      disabled={compressingAll[workout.id]}
                                      className="interactive-btn"
                                      style={{ 
                                        marginTop: "8px", background: "var(--primary)", color: "#fff", border: "2px solid #111", borderBottom: "4px solid #b91c1c", borderRadius: "10px", padding: "16px", fontWeight: "900", fontSize: "0.9rem", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                        opacity: compressingAll[workout.id] ? 0.7 : 1, cursor: "pointer"
                                      }}
                                    >
                                      {compressingAll[workout.id] ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} fill="#fff" />}
                                      {compressingAll[workout.id] ? `PREPARING ${optCount + 1}/${selCount}` : "Insta-Prepare Videos"}
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                            {(() => {
                              const wVids = nextVideos[workout.id] || {};
                              const selCount = Object.keys(wVids).length;
                              const optCount = Object.values(wVids).filter(f => f.isOptimized).length;
                              const cDate = selectedDate[workout.id] !== undefined ? selectedDate[workout.id] : todayDate;
                              const hasDate = !!cDate;
                              const isReady = hasDate && (selCount === 0 || selCount === optCount);
                              
                              if (selCount === 0) {
                                return (
                                  <button 
                                    className="interactive-btn" 
                                    onClick={() => { hasDate && addSessionInstance(workout.id, false); }} 
                                    style={{ 
                                      flex: 1, padding: "16px", background: hasDate ? "#111" : "var(--surface)", color: hasDate ? "#fff" : "var(--gray-dim)", 
                                      borderRadius: "10px", fontSize: "0.85rem", fontWeight: "900", textTransform: "uppercase", cursor: hasDate ? "pointer" : "not-allowed", border: "2px solid #111", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" 
                                    }}
                                  >
                                    <Check size={18} strokeWidth={3} color={hasDate ? ACCENT : "currentColor"}/> COMPLETE (NO VIDEO)
                                  </button>
                                );
                              } else {
                                return (
                                  <button 
                                    className="interactive-btn" 
                                    onClick={() => isReady && addSessionInstance(workout.id, true)} 
                                    style={{ 
                                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", 
                                      background: isReady ? ACCENT : "var(--surface)", color: isReady ? "#111" : "var(--gray-dim)", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "900", textTransform: "uppercase", cursor: isReady ? "pointer" : "not-allowed", border: "2px solid #111" 
                                    }}
                                  >
                                    {isReady ? <><Check size={18} strokeWidth={3} color="#111"/> SAVE + {selCount} VIDEOS</> : "COMPRESS VIDEOS FIRST"}
                                  </button>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* CUSTOM UNMARK CONFIRMATION MODAL */}
      {unmarkTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "360px", borderRadius: "20px", padding: "24px", border: "2px solid #111", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", animation: "slideUp 0.25s ease" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={16} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "-0.03em", color: "#111" }}>Remove Session?</h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--gray-dim)", fontWeight: "700", lineHeight: 1.5, marginTop: "8px" }}>
                Are you sure you want to remove this training session for <strong style={{ color: "#111" }}>{unmarkTarget.workout.name}</strong>? This will delete any attached video.
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => { haptic.medium(); setUnmarkTarget(null); }} 
                className="interactive-btn"
                style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "2px solid var(--surface-light)", background: "var(--surface)", color: "#111", fontSize: "0.85rem", fontWeight: "900", textTransform: "uppercase", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmUnmark} 
                className="interactive-btn"
                style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "2px solid #111", background: "#ef4444", color: "#fff", fontSize: "0.85rem", fontWeight: "900", textTransform: "uppercase", cursor: "pointer" }}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
