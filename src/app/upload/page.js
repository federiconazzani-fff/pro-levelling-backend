"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, Plus, Calendar, Type, Target, Settings, Check, Loader2, X, Zap, Trash2 } from "lucide-react";
import CompletionBadge from "./components/CompletionBadge";
import { haptic } from "@/utils/haptics";
import { saveVideo } from "@/utils/mediaDb";
import { compressVideo } from "@/utils/videoCompressor";
import { logTime } from "@/utils/timeEngine";

export default function UploadPage() {
  const router = useRouter();

  // 1. STATE
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: "",
    mode: "Single",
    reps: 1,
    title: "",
    macroArea: "",
    microAreas: []
  });

  const [files, setFiles] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const [isCompressingAll, setIsCompressingAll] = useState(false);
  
  const optimizingRef = useRef({});

  // Initialize auto-incrementing title
  useEffect(() => {
    const currentIndex = parseInt(localStorage.getItem('elite_pro_upload_index') || '0', 10);
    const formattedIndex = currentIndex.toString().padStart(2, '0');
    setFormData(prev => ({ ...prev, title: `1.0.${formattedIndex}` }));
  }, []);

  // 2. HELPERS
  const handleFocus = (id) => setFocusedInput(id);
  const handleBlur = () => setFocusedInput(null);

  const updateForm = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    haptic.light();
  };

  const toggleMicroArea = (opt) => {
    setFormData(prev => {
      const active = prev.microAreas || [];
      if (active.includes(opt)) {
        return { ...prev, microAreas: active.filter(a => a !== opt) };
      } else {
        if (active.length >= 2) return prev; // Limit to 2
        return { ...prev, microAreas: [...active, opt] };
      }
    });
    haptic.light();
  };

  // 3. HANDLERS
  const removeRep = (index) => {
    setFormData(prev => ({ ...prev, reps: Math.max(1, prev.reps - 1) }));
    setFiles(prev => {
      const newFiles = {};
      Object.keys(prev).forEach(key => {
        const k = parseInt(key);
        if (k < index) newFiles[k] = prev[k];
        if (k > index) newFiles[k - 1] = prev[k];
      });
      return newFiles;
    });
    haptic.medium();
  };

  const handleFileChange = async (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const durationMinutes = Math.ceil(video.duration / 60);
        
        setFiles(prev => ({ 
          ...prev, 
          [index]: { 
            name: file.name, 
            url: url, 
            raw: file, 
            sizeOrig: sizeMB, 
            duration: durationMinutes,
            isOptimized: false,
            progress: 0,
            status: 'ready' 
          } 
        }));
      };
      video.src = url;
      
      haptic.light();
    }
  };

  const handleCompressAll = async () => {
    const fileKeys = Object.keys(files).filter(k => !files[k].isOptimized);
    if (fileKeys.length === 0) return;

    setIsCompressingAll(true);
    haptic.medium();

    for (const index of fileKeys) {
      const fileData = files[index];
      if (!fileData || !fileData.raw) continue;

      setFiles(prev => ({ ...prev, [index]: { ...prev[index], status: 'compressing' } }));

      try {
        const compressedBlob = await compressVideo(fileData.raw, (p) => {
          setFiles(prev => ({ ...prev, [index]: { ...prev[index], progress: p } }));
        });
        
        const newUrl = URL.createObjectURL(compressedBlob);
        const newSizeMB = (compressedBlob.size / (1024 * 1024)).toFixed(1);
        
        setFiles(prev => ({
          ...prev,
          [index]: { 
            ...prev[index], 
            raw: compressedBlob, 
            url: newUrl, 
            sizeOpt: newSizeMB, 
            isOptimized: true,
            progress: 100,
            status: 'done'
          }
        }));
        haptic.light();
      } catch (err) {
        console.error("Compression failed", err);
        alert(`Errore compressione: ${err.message}`);
        setFiles(prev => ({ ...prev, [index]: { ...prev[index], status: 'ready', progress: 0 } }));
        setIsCompressingAll(false);
        return; // Stop the queue on error
      }
    }

    setIsCompressingAll(false);
    haptic.heavy();
  };

  // 4. COMPUTED
  const isTimeComplete = !!(formData.date && formData.timeSlot);
  const isModeComplete = Object.keys(files).length > 0;
  const isNameComplete = formData.title.trim().length > 2;
  const isCategoryComplete = !!(formData.macroArea && formData.microAreas?.length > 0);
  
  const selectedFilesCount = Object.keys(files).length;
  const optimizedFilesCount = Object.values(files).filter(f => f.isOptimized).length;
  const isAllOptimized = selectedFilesCount > 0 && optimizedFilesCount === selectedFilesCount;
  const isFormReady = isTimeComplete && isModeComplete && isNameComplete && isCategoryComplete && isAllOptimized;

  const microOptions = {
    "TECHNICAL": ["Shooting", "Dribbling", "Ball Control", "First Touch (Aerial)", "First Touch (Ground)", "Passing", "Cross", "Freestyle"],
    "ATHLETIC": ["Speed", "Agility", "Dynamic Changes", "Coordination", "Pliometria"]
  };
  const currentMicroOptions = formData.macroArea ? microOptions[formData.macroArea] : [];

  return (
    <div className="app-container page-wrapper" style={{ background: "var(--background)", minHeight: "100vh", paddingBottom: "100px" }}>
      
      <div style={{ background: "var(--surface)", padding: "20px 24px", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid var(--surface-light)", display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={() => { haptic.medium(); router.back(); }} className="btn-icon" style={{ background: "#fff", border: "1px solid #111" }}>
          <ArrowLeft size={20} color="#111" />
        </button>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "900", letterSpacing: "-0.02em", textTransform: "uppercase", fontFamily: "var(--font-heading)" }}>
          UPLOAD <span className="brush-highlight" style={{ zIndex: 0 }}>TRAINING</span>
        </h2>
      </div>

      <main className="v-stack" style={{ gap: "32px", padding: "24px 20px" }}>
        
        {/* BLOCK 1 */}
        <section className="card-dark hover-lift" style={{ position: "relative", border: "2px solid #111", background: "#fff" }}>
          <div style={{ position: "absolute", top: "20px", right: "20px" }}>
            <CompletionBadge isComplete={isTimeComplete} />
          </div>
          <div className="h-stack" style={{ marginBottom: "20px", gap: "8px" }}>
            <Calendar size={20} color="var(--primary)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>1. Context</h3>
          </div>
          <div className="v-stack" style={{ gap: "20px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Training Date</label>
              <input type="date" className="input-dark" value={formData.date} onChange={(e) => updateForm("date", e.target.value)} onFocus={() => handleFocus("date")} onBlur={handleBlur} style={{ borderBottom: focusedInput === "date" ? `4px solid ${formData.macroArea === "TECHNICAL" ? "#3b82f6" : "var(--primary)"}` : "4px solid var(--surface-light)", borderRadius: "8px" }} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Time Slot</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["Morning", "Afternoon", "Evening"].map(slot => (
                  <button key={slot} className="pseudo-haptic" onClick={() => updateForm("timeSlot", slot)} style={{ flex: 1, padding: "12px", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", textTransform: "uppercase", background: formData.timeSlot === slot ? "#111" : "var(--surface)", color: formData.timeSlot === slot ? "#fff" : "var(--gray-dim)", border: formData.timeSlot === slot ? "2px solid #111" : "2px solid var(--surface-light)", borderBottom: formData.timeSlot === slot ? "4px solid var(--primary)" : "2px solid var(--surface-light)", transition: "all 0.2s" }}>{slot}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK 2 */}
        <section className="card-dark hover-lift" style={{ position: "relative", border: "2px solid #111", background: "#fff" }}>
          <div style={{ position: "absolute", top: "20px", right: "20px" }}>
            <CompletionBadge isComplete={isModeComplete} />
          </div>
          <div className="h-stack" style={{ marginBottom: "20px", gap: "8px" }}>
            <Settings size={20} color="var(--primary)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>2. Structure</h3>
          </div>

          <div style={{ display: "flex", background: "var(--surface)", padding: "4px", borderRadius: "12px", marginBottom: "24px" }}>
             {["Single", "Session"].map(mode => (
               <button key={mode} onClick={() => updateForm("mode", mode)} style={{ flex: 1, padding: "12px", borderRadius: "8px", fontWeight: "900", background: formData.mode === mode ? "#fff" : "transparent", color: formData.mode === mode ? "#111" : "var(--gray-dim)", border: "none", boxShadow: formData.mode === mode ? "0 4px 12px rgba(0,0,0,0.1)" : "none", transition: "all 0.3s" }}>{mode}</button>
             ))}
          </div>

          <div className="v-stack" style={{ gap: "16px" }}>
            {Array.from({ length: formData.mode === "Single" ? 1 : formData.reps }).map((_, i) => (
              <div key={`rep-c-${i}`} className="v-stack" style={{ gap: "8px" }}>
                <div 
                  onClick={() => !files[i] && !isCompressingAll && document.getElementById(`v-in-${i}`).click()}
                  style={{ cursor: files[i] || isCompressingAll ? "default" : "pointer", display: "flex", alignItems: "center", gap: "12px", background: "var(--surface)", padding: "16px", borderRadius: "12px", border: files[i] ? "2px solid #111" : "2px dashed var(--surface-light)", transition: "all 0.2s" }}
                >
                  <div style={{ background: files[i] ? (files[i].isOptimized ? "#10b981" : "var(--primary)") : "#111", color: "#fff", fontWeight: "900", fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px" }}>REP {i+1}</div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", color: files[i] ? "#111" : "var(--gray-dim)" }}>
                    {files[i] ? (files[i].isOptimized ? <Check size={20} color="#10b981" /> : (files[i].status === 'compressing' ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />)) : <Plus size={20} />}
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px" }}>{files[i] ? files[i].name : "Select Video"}</span>
                    {files[i]?.isOptimized && <span style={{ fontSize: "0.7rem", fontWeight: "900", background: "#10b981", color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>READY: {files[i].sizeOpt} MB</span>}
                  </div>
                  {files[i] && !isCompressingAll && (
                    <button onClick={(e) => { e.stopPropagation(); setFiles(prev => { const n = {...prev}; delete n[i]; return n; }); }} style={{ background: "transparent", border: "none" }}><X size={18} color="var(--gray-dim)" /></button>
                  )}
                  {formData.mode === "Session" && formData.reps > 1 && !isCompressingAll && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeRep(i); }} 
                      style={{ background: "#fee2e2", border: "1px solid #ef4444", borderRadius: "6px", padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                    >
                      <Trash2 size={16} color="#b91c1c" />
                    </button>
                  )}
                </div>

                {files[i] && files[i].status !== 'done' && (
                  <div style={{ background: "#fff", border: "2px solid #111", borderRadius: "12px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: "800" }}>
                      <span style={{ color: "var(--gray-dim)" }}>ORIGINAL: {files[i].sizeOrig} MB</span>
                      {files[i].status === 'compressing' && <span style={{ color: "var(--primary)" }}>COMPRESSING {files[i].progress}%...</span>}
                      {files[i].status === 'ready' && <span style={{ color: "orange" }}>WAITING FOR QUEUE</span>}
                    </div>
                    {files[i].status === 'compressing' && (
                      <div style={{ width: "100%", height: "4px", background: "var(--surface)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${files[i].progress}%`, height: "100%", background: "var(--primary)", transition: "width 0.2s" }} />
                      </div>
                    )}
                  </div>
                )}
                <input id={`v-in-${i}`} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, i)} />
              </div>
            ))}

            {formData.mode === "Session" && !isCompressingAll && (
              <button onClick={() => updateForm("reps", formData.reps + 1)} style={{ padding: "16px", background: "var(--surface)", border: "2px dashed #ccc", borderRadius: "12px", fontWeight: "900", color: "#111", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}><Plus size={18} /> ADD REP</button>
            )}

            {selectedFilesCount > 0 && optimizedFilesCount < selectedFilesCount && (
              <button 
                onClick={handleCompressAll} 
                disabled={isCompressingAll}
                style={{ 
                  marginTop: "8px", background: "var(--primary)", color: "#fff", border: "2px solid #111", borderBottom: "6px solid #b91c1c", borderRadius: "12px", padding: "20px", fontWeight: "900", fontSize: "1.1rem", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  opacity: isCompressingAll ? 0.7 : 1
                }}
              >
                {isCompressingAll ? <Loader2 className="animate-spin" /> : <Zap fill="#fff" />}
                {isCompressingAll ? `FAST PREPARING ${optimizedFilesCount + 1}/${selectedFilesCount}` : "Instant Prepare Videos"}
              </button>
            )}
          </div>
        </section>

        {/* BLOCK 3 */}
        <section className="card-dark hover-lift" style={{ position: "relative", border: "2px solid #111", background: "#fff" }}>
          <div style={{ position: "absolute", top: "20px", right: "20px" }}>
            <CompletionBadge isComplete={isNameComplete} />
          </div>
          <div className="h-stack" style={{ marginBottom: "20px", gap: "8px" }}>
            <Type size={20} color="var(--primary)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>3. Indexing</h3>
          </div>
          <div className="form-group" style={{ margin: 0, position: "relative" }}>
            <label>Library Title</label>
            <input type="text" className="input-dark" placeholder="e.g. Curved Shots Session" value={formData.title} onFocus={() => handleFocus("title")} onBlur={handleBlur} onChange={(e) => updateForm("title", e.target.value)} style={{ padding: "20px 16px", fontSize: "1.2rem", fontWeight: "800", borderRadius: "8px", border: "none", background: "var(--surface)", borderBottom: "4px solid transparent", transition: "all 0.3s" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, height: "4px", background: "var(--primary)", transition: "width 0.4s", width: focusedInput === "title" || formData.title.length > 0 ? "100%" : "0%" }}></div>
          </div>
        </section>

        {/* BLOCK 4 */}
        <section className="card-dark hover-lift" style={{ position: "relative", border: "2px solid #111", background: "#fff" }}>
          <div style={{ position: "absolute", top: "20px", right: "20px" }}>
            <CompletionBadge isComplete={isCategoryComplete} />
          </div>
          <div className="h-stack" style={{ marginBottom: "20px", gap: "8px" }}>
            <Target size={20} color="var(--primary)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>4. Taxonomy</h3>
          </div>
          <div className="v-stack" style={{ gap: "24px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "800", fontSize: "0.85rem" }}>Macro-Area</label>
              <div style={{ display: "flex", gap: "12px" }}>
                {["TECHNICAL", "ATHLETIC"].map(macro => (
                  <button key={macro} onClick={() => { updateForm("macroArea", macro); updateForm("microAreas", []); }} style={{ flex: 1, padding: "16px", borderRadius: "8px", fontWeight: "900", background: formData.macroArea === macro ? (macro === "TECHNICAL" ? "#3b82f6" : "var(--primary)") : "var(--surface)", color: formData.macroArea === macro ? "#fff" : "#111", border: "2px solid #111", borderBottom: formData.macroArea === macro ? `6px solid ${macro === "TECHNICAL" ? "#1d4ed8" : "#b91c1c"}` : "2px solid #111", transition: "all 0.2s" }}>{macro}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "800", fontSize: "0.85rem" }}>Micro-Areas</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", opacity: formData.macroArea ? 1 : 0.3 }}>
                {currentMicroOptions.map(opt => (
                  <button key={opt} onClick={() => toggleMicroArea(opt)} style={{ padding: "10px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "800", background: formData.microAreas.includes(opt) ? "#111" : "var(--surface)", color: formData.microAreas.includes(opt) ? "#fff" : "var(--gray-dim)", border: "1px solid #111", transition: "all 0.2s" }}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <button
          className="btn-primary"
          disabled={!isFormReady}
          style={{ width: "100%", height: "64px", fontSize: "1.2rem", marginTop: "16px", opacity: isFormReady ? 1 : 0.3, cursor: isFormReady ? "pointer" : "not-allowed" }}
          onClick={async () => {
             if (!isFormReady) return;
             haptic.heavy();
             const uploadId = `u-${Date.now()}`;
             const newUpload = {
               id: uploadId,
               type: formData.mode === "Single" ? "single" : "session",
               title: formData.title,
               date: formData.date,
               timeSlot: formData.timeSlot,
               macroArea: formData.macroArea,
               subCategories: formData.microAreas,
               status: "NOT_ANALYZED",
               // videoUrl: null // No longer storing transient blob URLs
             };
             if (formData.mode === "Single") {
               await saveVideo(uploadId, files[0].raw);
             } else {
               newUpload.reps = await Promise.all(Object.keys(files).map(async (idx) => {
                 const repId = `${uploadId}-r${idx}`;
                 if (files[idx]?.raw) await saveVideo(repId, files[idx].raw);
                 return { id: repId, status: "NOT_ANALYZED" }; // No longer storing transient blob URLs
               }));
             }
             const existing = JSON.parse(localStorage.getItem('elite_pro_library') || '[]');
             localStorage.setItem('elite_pro_library', JSON.stringify([newUpload, ...existing]));
             
             // Log time Method A
             const totalDuration = Object.values(files).reduce((acc, f) => acc + (f.duration || 1), 0);
             const logCategory = formData.macroArea === "TECHNICAL" ? "tecnica" : "atletica";
             logTime(logCategory, totalDuration);
             
             // Increment upload index
             const currentIndex = parseInt(localStorage.getItem('elite_pro_upload_index') || '0', 10);
             localStorage.setItem('elite_pro_upload_index', (currentIndex + 1).toString());
             
             router.push('/library');
          }}
        >
          {isAllOptimized ? "GENERATE UPLOADS" : "COMPRESS ALL FIRST"} <Check size={24} />
        </button>
      </main>
    </div>
  );
}
