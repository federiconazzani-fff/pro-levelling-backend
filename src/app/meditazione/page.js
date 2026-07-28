"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, Trash2, Clock, Check, X, Wind, Moon, Leaf, Sparkles, ChevronDown, ChevronUp, Video, Play, UploadCloud, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { haptic } from "@/utils/haptics";
import { logTime } from "@/utils/timeEngine";
import { saveVideo } from "@/utils/mediaDb";
import CompletionBadge from "@/app/upload/components/CompletionBadge";

const ACCENT = "#a78bfa";
const PRESETS = [5, 10, 15, 20, 30];

export default function MeditationPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [meditations, setMeditations] = useState([]);
  const [completed, setCompleted] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("10");
  
  // Expanded & Form states
  const [expandedId, setExpandedId] = useState(null);
  const [showFormFor, setShowFormFor] = useState(null);
  const [unmarkTarget, setUnmarkTarget] = useState(null);
  
  // Video and custom options per card
  const [pendingVideo, setPendingVideo] = useState({});
  const [pendingVideoUrl, setPendingVideoUrl] = useState({});
  const [selectedDuration, setSelectedDuration] = useState({});
  const [selectedDate, setSelectedDate] = useState({});
  const todayDate = new Date().toISOString().split("T")[0];

  useEffect(()=>{
    setMounted(true);
    const s=localStorage.getItem("elite_pro_meditations_simple");
    if(s){setMeditations(JSON.parse(s));}
    else{
      const d=[{id:1,title:"Deep Focus",duration:15},{id:2,title:"Box Breathing",duration:5},{id:3,title:"Mindfulness",duration:10}];
      setMeditations(d);localStorage.setItem("elite_pro_meditations_simple",JSON.stringify(d));
    }
    const c=localStorage.getItem("elite_pro_meditations_completed");
    if(c) setCompleted(JSON.parse(c));
  },[]);

  const persistMeds=(m)=>{setMeditations(m);localStorage.setItem("elite_pro_meditations_simple",JSON.stringify(m));};
  const persistCompleted=(c)=>{setCompleted(c);localStorage.setItem("elite_pro_meditations_completed",JSON.stringify(c));};

  const removeFromHistory = (medId) => {
    const med = meditations.find(m => m.id === medId);
    if (!med) return null;
    
    const hist = JSON.parse(localStorage.getItem("elite_pro_meditations_history") || "[]");
    const idx = hist.findIndex(s => s.activities?.some(a => a.title === med.title));
    if (idx !== -1) {
      const copy = [...hist];
      const removed = copy.splice(idx, 1)[0];
      localStorage.setItem("elite_pro_meditations_history", JSON.stringify(copy));
      return removed;
    }
    return null;
  };

  const handleIncrement = (med) => {
    haptic.medium();
    setExpandedId(med.id);
    setShowFormFor(med.id);
  };

  const handleDecrement = (med) => {
    const id = med.id;
    const current = completed[id];
    const count = current?.count || 0;
    
    if (count > 1) {
      haptic.medium();
      const newCount = count - 1;
      const logged = current?.loggedDurations || [];
      const dur = logged[logged.length - 1] || med.duration || 10;
      
      const updated = {
        ...completed,
        [id]: {
          ...current,
          count: newCount,
          loggedDurations: logged.slice(0, -1)
        }
      };
      persistCompleted(updated);
      
      // Remove from history
      const removed = removeFromHistory(id);
      const targetDate = removed ? removed.date.split("T")[0] : undefined;
      
      // Subtract from ring
      logTime("meditation", -dur, null, targetDate);
    } else if (count === 1) {
      haptic.heavy();
      setUnmarkTarget(med);
    }
  };

  const confirmUnmark = () => {
    if (!unmarkTarget) return;
    const id = unmarkTarget.id;
    const current = completed[id];
    const logged = current?.loggedDurations || [];
    const dur = logged[logged.length - 1] || unmarkTarget.duration || 10;
    
    const updated = { ...completed };
    delete updated[id];
    persistCompleted(updated);
    
    // Remove from history
    const removed = removeFromHistory(id);
    const targetDate = removed ? removed.date.split("T")[0] : undefined;
    
    // Subtract from ring
    logTime("meditation", -dur, null, targetDate);
    
    setUnmarkTarget(null);
  };

  const addMed=()=>{
    if(!newTitle.trim()) return;
    haptic.medium();
    const m={id:Date.now(),title:newTitle.trim(),duration:parseInt(newDuration)||10};
    persistMeds([m,...meditations]);
    setNewTitle("");setNewDuration("10");setShowAdd(false);
  };

  const deleteMed=(id,e)=>{
    e.stopPropagation();haptic.heavy();
    persistMeds(meditations.filter(m=>m.id!==id));
    const c={...completed};delete c[id];persistCompleted(c);
  };

  const handleVideoChange = async (e, medId) => {
    const file = e.target.files[0];
    if (!file) return;
    haptic.medium();
    setPendingVideo(p => ({ ...p, [medId]: file }));
    setPendingVideoUrl(p => ({ ...p, [medId]: URL.createObjectURL(file) }));
  };

  const addSessionInstance = async (medId, videoAttached = false) => {
    const med = meditations.find(m => m.id === medId);
    if (!med) return;

    haptic.heavy();
    
    const userDurStr = selectedDuration[medId];
    const finalDurStr = userDurStr !== undefined ? userDurStr : String(med.duration);
    const dur = parseInt(finalDurStr);
    if (isNaN(dur) || dur <= 0) return;
    
    const chosenDateStr = selectedDate[medId] || todayDate;
    const isToday = chosenDateStr === todayDate;
    const chosenDateIso = isToday ? new Date().toISOString() : `${chosenDateStr}T12:00:00.000Z`;

    let videoUrl = null;
    let newSessionId = Date.now() + Math.random();
    
    if (videoAttached && pendingVideo[medId]) {
      const file = pendingVideo[medId];
      const uid = `m-${Date.now()}`;
      try {
        await saveVideo(uid, file);
        const entry = {
          id: uid,
          type: "single",
          title: `${med.title} Video`,
          date: chosenDateStr,
          macroArea: "MEDITATION",
          subCategory: med.title,
          status: "NOT_ANALYZED"
        };
        const lib = JSON.parse(localStorage.getItem("elite_pro_library") || "[]");
        localStorage.setItem("elite_pro_library", JSON.stringify([entry, ...lib]));
        videoUrl = URL.createObjectURL(file);
      } catch (err) {
        console.error(err);
      }
    }
    
    const current = completed[medId];
    const newCount = (current?.count || 0) + 1;
    
    const updated = {
      ...completed,
      [medId]: {
        count: newCount,
        loggedDurations: [...(current?.loggedDurations || []), dur]
      }
    };
    persistCompleted(updated);
    
    // Log to ring
    logTime("meditation", dur, null, chosenDateStr);
    
    // Add to history
    const session = {
      id: newSessionId,
      date: chosenDateIso,
      type: "meditation",
      activities: [{ title: med.title, duration: dur, videoAttached, videoUrl }],
      totalDuration: dur
    };
    const hist = JSON.parse(localStorage.getItem("elite_pro_meditations_history") || "[]");
    localStorage.setItem("elite_pro_meditations_history", JSON.stringify([session, ...hist]));
    
    // Reset inputs
    setPendingVideo(p => { const n = { ...p }; delete n[medId]; return n; });
    setPendingVideoUrl(p => { const n = { ...p }; delete n[medId]; return n; });
    setSelectedDuration(p => { const n = { ...p }; delete n[medId]; return n; });
    setExpandedId(null);
    setShowFormFor(null);
  };

  const completedCount = meditations.filter(m => !!completed[m.id]?.count).length;
  const totalMin = meditations.reduce((acc, m) => {
    const logged = completed[m.id]?.loggedDurations || [];
    const sum = logged.reduce((a, b) => a + b, 0);
    return acc + sum;
  }, 0);
  
  const progress = meditations.length ? (completedCount / meditations.length) * 100 : 0;
  if(!mounted) return null;

  return(
    <div className="app-container page-wrapper" style={{ minHeight: "100vh", paddingBottom: "100px", background: "linear-gradient(160deg, var(--background) 0%, #ffffff 50%, rgba(167, 139, 250, 0.12) 100%)", position: "relative", overflowX: "hidden" }} suppressHydrationWarning>
      
      {/* Decorative Blobs */}
      <div style={{ position: "absolute", top: "-5%", right: "-10%", width: "250px", height: "250px", background: "radial-gradient(circle, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0) 70%)", borderRadius: "50%", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "-10%", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, rgba(167,139,250,0) 70%)", borderRadius: "50%", zIndex: 0, pointerEvents: "none" }} />

      {/* PREMIUM HEADER SECTION */}
      <header style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)", zIndex: 100, position: "sticky", top: 0, borderBottom: "2px solid #111" }}>
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
                Mental Training
              </span>
            </div>
            
            <h2 style={{ fontSize: "2rem", fontWeight: "900", letterSpacing: "-0.04em", textTransform: "uppercase", fontFamily: "var(--font-heading)", lineHeight: 0.9, marginTop: "4px" }}>
              MEDITAZIONE{' '}
              <span style={{ position: "relative", display: "inline-block" }}>
                 <span>SPACE</span>
                 <span style={{ 
                   position: "absolute", 
                   bottom: "-2px", 
                   left: 0, 
                   right: 0, 
                   height: "8px", 
                   background: "rgba(167, 139, 250, 0.4)", 
                   zIndex: -1, 
                   transform: "skewX(-15deg)" 
                 }}></span>
              </span>
            </h2>
          </div>

          <div style={{ textAlign: "right" }}>
            <button 
              onClick={()=>{haptic.light();setShowAdd(true);}} 
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
              <Plus size={16} strokeWidth={3} /> ADD
            </button>
          </div>
        </div>

        {/* Progress Bar inside Header */}
        {meditations.length > 0 && (
          <div style={{ padding: "0 24px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Today's Mindfulness</span>
              <span style={{ fontSize: "0.6rem", fontWeight: "900", color: completedCount > 0 ? "#111" : "var(--gray-dim)" }}>
                {completedCount} / {meditations.length} · {totalMin} min
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", position: "relative", zIndex: 1 }}>
          <div className="interactive-card" style={{ padding: "16px", background: "#fff", border: "2px solid #111", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "4px 4px 0px rgba(167, 139, 250, 0.4)" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(167, 139, 250, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Leaf size={20} color={ACCENT} strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#111", lineHeight: 1 }}>{meditations.length}</div>
              <div style={{ fontSize: "0.65rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase", marginTop: "4px", letterSpacing: "0.05em" }}>Sessions</div>
            </div>
          </div>
          
          <div className="interactive-card" style={{ padding: "16px", background: "#fff", border: "2px solid #111", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "4px 4px 0px rgba(59, 130, 246, 0.3)" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={20} color="#3b82f6" strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#111", lineHeight: 1 }}>{totalMin}</div>
              <div style={{ fontSize: "0.65rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase", marginTop: "4px", letterSpacing: "0.05em" }}>Min Logged</div>
            </div>
          </div>
        </div>

        {/* STACK LIST */}
        <section style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Leaf size={18} color="#111" />
            <h3 style={{ fontSize: "0.9rem", fontWeight: "900", textTransform: "uppercase", color: "#111" }}>
              Your Practice
            </h3>
          </div>

          {meditations.length === 0 && (
            <div style={{ 
              padding: "40px 24px", textAlign: "center", color: "var(--gray-dim)", 
              display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
              background: "var(--surface)", borderRadius: "16px", border: "2px dashed var(--surface-light)"
            }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#fff", border: "2px solid #eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wind size={24} color="#ccc" strokeWidth={2}/>
              </div>
              <div className="v-stack" style={{ gap: "4px" }}>
                <p style={{ fontWeight: "900", fontSize: "1rem", color: "#111", textTransform: "uppercase" }}>No sessions yet</p>
                <p style={{ fontSize: "0.75rem", fontWeight: "700", maxWidth: "200px", margin: "0 auto" }}>Tap <span style={{ color: "#111", fontWeight: "900" }}>ADD</span> to start your mindfulness practice.</p>
              </div>
            </div>
          )}

          <div className="v-stack" style={{ gap: "12px" }}>
            {meditations.map((med, idx) => {
              const done = !!completed[med.id]?.count;
              const count = completed[med.id]?.count || 0;
              const open = expandedId === med.id;
              const fileObj = pendingVideo[med.id];
              const currentDur = selectedDuration[med.id] || String(med.duration);

              return (
                  <div 
                  key={med.id} 
                  className="interactive-card"
                  style={{ 
                    background: done ? "rgba(167, 139, 250, 0.08)" : "#fff", 
                    border: "2px solid #111", 
                    borderRadius: "16px", 
                    overflow: "hidden", 
                    boxShadow: open ? "4px 4px 0px rgba(0,0,0,0.1)" : "0px 2px 4px rgba(0,0,0,0.02)",
                    animation: `blockFadeIn 0.3s cubic-bezier(0.1, 0.9, 0.2, 1) ${idx * 0.05}s both`,
                    transition: "all 0.2s"
                  }}
                >
                  {/* Card Header */}
                  <div 
                    onClick={() => { haptic.light(); setExpandedId(open ? null : med.id); }} 
                    style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer" }}
                  >
                    {/* Status Icon */}
                    <div style={{ 
                      width: "48px", height: "48px", borderRadius: "50%", 
                      background: done ? ACCENT : "rgba(167, 139, 250, 0.1)", 
                      border: done ? `2px solid ${ACCENT}` : "2px solid rgba(167, 139, 250, 0.3)", 
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: done ? `0 4px 12px rgba(167, 139, 250, 0.3)` : "none",
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }}>
                      {done ? <CompletionBadge isComplete={true} showText={false} color="#111" /> : <Leaf size={22} color={ACCENT} />}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "1rem", fontWeight: "900", color: "#111", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {med.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={12} color={done ? "#111" : "var(--gray-dim)"} />
                          <span style={{ fontSize: "0.7rem", fontWeight: "800", color: done ? "#111" : "var(--gray-dim)" }}>{med.duration} min</span>
                        </div>
                        {done && (
                          <span style={{ fontSize: "0.6rem", fontWeight: "900", textTransform: "uppercase", padding: "2px 6px", borderRadius: "4px", background: "#111", color: ACCENT, border: "1px solid #111" }}>
                            COMPLETED
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Multiplier / Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {done && (
                        <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#111", color: "#fff", borderRadius: "8px", padding: "6px 12px" }}>
                          <button onClick={() => handleDecrement(med)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={14} strokeWidth={3}/></button>
                          <span style={{ fontSize: "0.8rem", fontWeight: "900", color: ACCENT }}>x{count}</span>
                          <button onClick={() => handleIncrement(med)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} strokeWidth={3}/></button>
                        </div>
                      )}
                      
                      {!open && !done && (
                        <button 
                          onClick={e => { e.stopPropagation(); deleteMed(med.id, e); }} 
                          style={{ width: "36px", height: "36px", borderRadius: "8px", border: "2px solid var(--surface-light)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Trash2 size={16} color="var(--gray-dim)" />
                        </button>
                      )}
                      
                      {open ? <ChevronUp size={20} color="#111" /> : <ChevronDown size={20} color="var(--gray-dim)" />}
                    </div>
                  </div>

                  {/* EXPANDED PANEL */}
                  {open && (
                    <div onClick={e => e.stopPropagation()} style={{ borderTop: "2px solid var(--surface-light)", padding: "24px 16px", background: "var(--surface)", animation: "slideUp 0.2s ease" }}>
                      {(!done || showFormFor === med.id) && (
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
                              value={selectedDate[med.id] || todayDate} 
                              onChange={e => setSelectedDate(prev => ({ ...prev, [med.id]: e.target.value }))} 
                              style={{ width: "100%", padding: "14px 16px", borderRadius: "10px", border: "2px solid var(--surface-light)", fontSize: "0.9rem", fontWeight: "700", outline: "none", background: "#fff", fontFamily: "inherit", transition: "border 0.3s" }} 
                              onFocus={(e) => e.target.style.borderColor = "#111"}
                              onBlur={(e) => e.target.style.borderColor = "var(--surface-light)"}
                            />
                          </div>

                          {/* Duration row */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#111", marginBottom: "8px" }}>Duration</label>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                              {PRESETS.map(p=>{
                                const sel = currentDur === String(p);
                                return(
                                  <button key={p} className="interactive-btn" onClick={()=>setSelectedDuration(prev=>({...prev, [med.id]: String(p)}))} style={{padding:"8px 16px",borderRadius:"8px",border:sel?`2px solid #111`:"2px solid var(--surface-light)",background:sel?ACCENT:"#fff",color:sel?"#111":"var(--gray-dim)",fontSize:"0.75rem",fontWeight:900,cursor:"pointer",transition:"all 0.2s"}}>
                                    {p}m
                                  </button>
                                );
                              })}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:"2px solid #111",borderRadius:"10px",padding:"10px 14px"}}>
                              <Clock size={16} color="#111"/>
                              <input type="number" inputMode="numeric" placeholder="Custom (minutes)" value={currentDur} onChange={e=>{
                                const v = e.target.value;
                                const p = parseInt(v);
                                setSelectedDuration(prev=>({...prev, [med.id]: (!isNaN(p) && p < 0) ? "0" : v}));
                              }} style={{background:"transparent",border:"none",outline:"none",fontSize:"1rem",fontWeight:900,width:"100%",color:"#111",fontFamily:"inherit"}}/>
                              <span style={{fontSize:"0.7rem",fontWeight:800,color:"var(--gray-dim)",textTransform:"uppercase"}}>MIN</span>
                            </div>
                          </div>

                          {/* Videos upload block */}
                          <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "12px", padding: "20px" }}>
                            <div className="h-stack" style={{ gap: "8px", marginBottom: "8px" }}>
                              <Video size={16} color="var(--primary)" />
                              <h4 style={{ fontSize: "0.85rem", fontWeight: "900", color: "#111", textTransform: "uppercase" }}>Video Evidence (Optional)</h4>
                            </div>


                            
                            <div 
                              onClick={() => document.getElementById(`video-in-${med.id}`).click()}
                              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", background: "var(--surface)", padding: "16px", borderRadius: "10px", border: fileObj ? "2px solid #111" : "2px dashed var(--surface-light)", transition: "all 0.2s" }}
                            >
                              <div style={{ background: fileObj ? ACCENT : "#111", color: fileObj ? "#111" : "#fff", fontWeight: "900", fontSize: "0.7rem", padding: "4px 8px", borderRadius: "6px", textTransform: "uppercase" }}>
                                VIDEO
                              </div>
                              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", color: fileObj ? "#111" : "var(--gray-dim)", minWidth: 0 }}>
                                {fileObj ? <Check size={18} color={ACCENT} /> : <UploadCloud size={18} />}
                                <span style={{ fontSize: "0.85rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {fileObj ? fileObj.name : "Select Video"}
                                </span>
                              </div>
                              {fileObj && (
                                <button onClick={(e) => { 
                                  e.stopPropagation(); 
                                  haptic.light();
                                  setPendingVideo(p => { const n = { ...p }; delete n[med.id]; return n; });
                                  setPendingVideoUrl(p => { const n = { ...p }; delete n[med.id]; return n; });
                                }} style={{ background: "transparent", border: "none", cursor:"pointer", display: "flex", alignItems: "center" }}>
                                  <X size={18} color="var(--gray-dim)" />
                                </button>
                              )}
                            </div>
                            
                            <input id={`video-in-${med.id}`} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleVideoChange(e, med.id)} onClick={(e) => { e.target.value = null; }} />

                            {pendingVideoUrl[med.id] && (
                              <div style={{borderRadius:"8px",overflow:"hidden",border:"2px solid #111",position:"relative",background:"#000",aspectRatio:"16/9",maxHeight:160,marginTop:16}}>
                                <video src={pendingVideoUrl[med.id]} controls playsInline style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                              </div>
                            )}
                          </div>

                          {/* Complete Buttons */}
                          <div style={{display:"flex",gap:12,marginTop:8}}>
                            {(() => {
                              const cDate = selectedDate[med.id] !== undefined ? selectedDate[med.id] : todayDate;
                              const cDurStr = selectedDuration[med.id] !== undefined ? selectedDuration[med.id] : String(med.duration);
                              const cDur = parseInt(cDurStr);
                              const isReady = cDate && !isNaN(cDur) && cDur > 0;
                              return (
                                <button 
                                  className="interactive-btn" 
                                  onClick={() => isReady && addSessionInstance(med.id, !!fileObj)} 
                                  style={{ 
                                    flex: 1, padding: "16px", borderRadius: "10px", 
                                    background: isReady ? "#111" : "var(--surface)", 
                                    color: isReady ? "#fff" : "var(--gray-dim)", 
                                    fontSize: "0.85rem", fontWeight: "900", textTransform: "uppercase", 
                                    cursor: isReady ? "pointer" : "not-allowed", border: "2px solid #111"
                                  }}
                                >
                                  SAVE SESSION
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {done && showFormFor !== med.id && (
                        <div style={{display:"flex",flexDirection:"column",gap:12, marginTop: "8px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:"0.6rem",fontWeight:900,color:"var(--gray-dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Today's Logs</span>
                            <button className="interactive-btn" onClick={() => handleIncrement(med)} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:"8px",background:"#111",color:"#fff",fontSize:"0.7rem",fontWeight:900,textTransform:"uppercase",border:"none",cursor:"pointer"}}>
                              <Plus size={14} strokeWidth={3}/> Add More
                            </button>
                          </div>
                          
                          <div style={{display:"flex",flexDirection:"column",gap:8}}>
                            {(completed[med.id]?.loggedDurations || []).map((loggedDur, sIdx) => (
                              <div key={sIdx} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",border:"2px solid #111",borderRadius:"10px",padding:"12px 16px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <Clock size={14} color="#111"/>
                                  <span style={{fontSize:"0.85rem",fontWeight:900,color:"#111"}}>Session {sIdx+1}: {loggedDur} min</span>
                                </div>
                                <span style={{fontSize:"0.6rem",fontWeight:900,color:ACCENT,background:"#111",padding:"4px 8px",borderRadius:"6px",textTransform:"uppercase"}}>DONE</span>
                              </div>
                            ))}
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

      {/* ADD MODAL */}
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",width:"100%",maxWidth:380,borderRadius:"20px",padding:"24px",border:"2px solid #111",boxShadow:"0 20px 40px rgba(0,0,0,0.2)",animation:"slideUp 0.3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div>
                <p style={{fontSize:"0.6rem",fontWeight:900,color:"var(--gray-dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>New Practice</p>
                <h3 style={{fontSize:"1.4rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"-0.03em",color:"#111"}}>Add Session</h3>
              </div>
              <button onClick={()=>setShowAdd(false)} className="interactive-btn" style={{width:36,height:36,borderRadius:"10px",border:"2px solid var(--surface-light)",background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color="#111"/></button>
            </div>
            <input autoFocus placeholder="e.g. Mindfulness, Box Breathing..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMed()} style={{width:"100%",padding:"14px 16px",borderRadius:"10px",border:"2px solid #111",fontSize:"0.9rem",fontWeight:700,outline:"none",background:"#fff",fontFamily:"inherit",marginBottom:16}}/>
            
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:"0.75rem",fontWeight:"800",color:"#111",marginBottom:"8px"}}>Duration</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                {PRESETS.map(p=>{
                  const sel = newDuration === String(p);
                  return(
                  <button key={p} className="interactive-btn" onClick={()=>setNewDuration(String(p))} style={{padding:"8px 16px",borderRadius:"8px",border:sel?`2px solid #111`:"2px solid var(--surface-light)",background:sel?ACCENT:"#fff",color:sel?"#111":"var(--gray-dim)",fontSize:"0.75rem",fontWeight:900,cursor:"pointer",transition:"all 0.2s"}}>
                    {p}m
                  </button>
                );})}
              </div>
              <input type="number" placeholder="Custom (minutes)" value={newDuration} onChange={e=>{ const v=e.target.value; const p=parseInt(v); setNewDuration((!isNaN(p) && p<0)?"0":v); }} style={{width:"100%",padding:"12px 14px",borderRadius:"10px",border:"2px solid var(--surface-light)",fontSize:"0.9rem",fontWeight:700,outline:"none",background:"#fff",fontFamily:"inherit"}}/>
            </div>
            
            <button className="interactive-btn" onClick={addMed} style={{width:"100%",padding:"16px",background:"#111",color:"#fff",border:"none",borderRadius:"10px",fontSize:"0.85rem",fontWeight:900,textTransform:"uppercase",cursor:"pointer"}}>
              Create Session
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM UNMARK CONFIRMATION MODAL */}
      {unmarkTarget && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",width:"100%",maxWidth:360,borderRadius:"20px",padding:"24px",border:"2px solid #111",boxShadow:"0 20px 40px rgba(0,0,0,0.2)",animation:"slideUp 0.25s ease"}}>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={16} color="#ef4444" />
                </div>
                <h3 style={{fontSize:"1.2rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"-0.03em",color:"#111"}}>Remove Session?</h3>
              </div>
              <p style={{fontSize:"0.85rem",color:"var(--gray-dim)",fontWeight:700,lineHeight:1.5,marginTop:8}}>
                Are you sure you want to unmark <strong>{unmarkTarget.title}</strong>? This will remove the session and subtract the time from the ring.
              </p>
            </div>
            <div style={{display:"flex",gap:12}}>
              <button className="interactive-btn" onClick={() => { haptic.medium(); setUnmarkTarget(null); }} style={{flex:1,padding:"14px",borderRadius:"10px",border:"2px solid var(--surface-light)",background:"var(--surface)",color:"#111",fontSize:"0.85rem",fontWeight:900,textTransform:"uppercase",cursor:"pointer"}}>
                Cancel
              </button>
              <button className="interactive-btn" onClick={confirmUnmark} style={{flex:1,padding:"14px",borderRadius:"10px",border:"2px solid #111",background:"#ef4444",color:"#fff",fontSize:"0.85rem",fontWeight:900,textTransform:"uppercase",cursor:"pointer"}}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
