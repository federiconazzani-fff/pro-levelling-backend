import { useState, useEffect } from "react";
import { X, PlayCircle, CheckCircle2, AlertCircle, RefreshCcw, Layers } from "lucide-react";
import TripleLockDeleteButton from "./TripleLockDeleteButton";
import { useRouter } from "next/navigation";
import { haptic } from "@/utils/haptics";
import { getPersistentVideoUrl } from "@/utils/mediaDb";

export default function SessionDetailModal({ open, data, onClose, onDelete, onRepAnalyze }) {
  const router = useRouter();
  const [activeRepIdx, setActiveRepIdx] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const activeRep = data?.reps?.[activeRepIdx];

  // Load persistent video URL when modal opens or active rep changes
  useEffect(() => {
    if (!open || !data || !activeRep) return;

    setVideoError(false);

    const loadVideo = async () => {
      // If it's a mock video or already has a placeholder URL, use it
      if (activeRep.videoUrl && !activeRep.videoUrl.startsWith('blob:')) {
        setVideoUrl(activeRep.videoUrl);
      } else {
        // Try loading from IndexedDB using the rep ID
        try {
          const url = await getPersistentVideoUrl(activeRep.id);
          if (url) {
            setVideoUrl(url);
          } else if (activeRep.videoUrl) {
            // Fallback to what was in the data (might be expired, but we try)
            setVideoUrl(activeRep.videoUrl);
          } else {
            // Ultimate fallback
            setVideoUrl("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4");
          }
        } catch (e) {
          console.error("Error loading video from IDB:", e);
          setVideoError(true);
        }
      }
    };

    loadVideo();
  }, [open, data?.id, activeRepIdx]);

  if (!open || !data) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "#fff",
      display: "flex", flexDirection: "column", animation: "blockFadeIn 0.3s ease-out"
    }}>
      {/* TOP HEADER - Premium Editorial */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 32px", alignItems: "center", borderBottom: "2px solid #111", background: "#fff", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
           <TripleLockDeleteButton onDelete={() => onDelete(data.id)} />
           <div style={{ paddingLeft: "24px", borderLeft: "2px solid var(--surface-light)" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <Layers size={14} color="var(--primary)" />
                <span style={{ fontSize: "0.65rem", color: "var(--gray-dim)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session Storage • {data.date} • {data.subCategories ? data.subCategories.join(" + ") : data.subCategory}</span>
             </div>
             <h3 style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "-0.01em", color: "#111", textTransform: "uppercase" }}>{data.title}</h3>
           </div>
        </div>
        <button className="btn-icon pseudo-haptic" onClick={onClose} style={{ border: "2px solid #111", borderRadius: "50%", padding: "10px", background: "#fff", boxShadow: "4px 4px 0px #eee" }}>
          <X size={20} color="#111" />
        </button>
      </div>

      {/* ASYMMETRIC CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" }} className="mobile-wrap-column">
        
        {/* LEFT: MAIN PLAYER */}
        <div style={{ flex: 1, background: "#000", display: "flex", flexDirection: "column", position: "relative" }}>
           <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              {videoError ? (
                 <div style={{ textAlign: "center", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px" }}>
                   <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(230, 57, 70, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--primary)" }}>
                      <AlertCircle size={32} color="var(--primary)" />
                   </div>
                   <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase" }}>Sequence interrupted</h3>
                   <p style={{ opacity: 0.7, fontSize: "0.85rem", maxWidth: "260px", lineHeight: "1.4" }}>
                     The source links for these clips have expired. A fresh upload is required to re-initiate analysis.
                   </p>
                   <button onClick={() => router.push('/upload')} style={{ background: "#fff", color: "#111", padding: "12px 24px", borderRadius: "12px", fontWeight: "900", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", border: "none" }}>
                     <RefreshCcw size={14} /> Restore Session
                   </button>
                 </div>
              ) : (
                <video 
                  key={`${data.id}-${activeRepIdx}`}
                  src={videoUrl} 
                  controls 
                  playsInline
                  autoPlay
                  onError={() => setVideoError(true)}
                  style={{ width: "100%", height: "100%", objectFit: "contain", outline: "none", zIndex: 5 }}
                />
              )}
              
              {!videoError && (
                <div style={{ position: "absolute", top: "24px", left: "24px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "6px 16px", borderRadius: "20px", color: "#fff", zIndex: 10, fontSize: "0.8rem", fontWeight: "900", display: "flex", gap: "12px", alignItems: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                   <span style={{ color: "var(--primary)" }}>LIVE STREAM</span>
                   <span style={{ opacity: 0.3 }}>|</span>
                   <span>REP {activeRepIdx + 1} OF {data.reps.length}</span>
                 </div>
              )}
           </div>

           {/* BOTTOM ACTION BAR (Tactical) */}
           <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", borderTop: "1px solid #222" }}>
             <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                   <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "#666", textTransform: "uppercase" }}>Rep Identifier</span>
                   <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#fff", fontFamily: "monospace" }}>#{activeRep?.id?.split('-').pop()}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                   <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "#666", textTransform: "uppercase" }}>Analysis status</span>
                   <span style={{ fontSize: "0.85rem", fontWeight: "900", color: activeRep?.status === "ANALYZED" ? "#fff" : "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                     {activeRep?.status}
                   </span>
                </div>
                {activeRep?.status === "ANALYZED" && (
                   <button 
                     onClick={() => { haptic.medium(); router.push(`/analysis/detail?id=${data.id}&rep=${activeRep.id}`); }}
                     style={{ background: "var(--primary)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontWeight: "900", fontSize: "0.75rem", border: "none", cursor: "pointer", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}
                   >
                     View Analysis
                   </button>
                )}
             </div>
           </div>
        </div>

        {/* RIGHT: SCROLLBAR REPS LIST - Modern Editorial List */}
        <div style={{ width: "340px", background: "#fff", borderLeft: "2px solid #111", display: "flex", flexDirection: "column" }} className="mobile-full-width">
           <div style={{ padding: "24px", borderBottom: "1px solid var(--surface-light)", background: "#fff" }}>
             <h4 style={{ fontSize: "0.9rem", fontWeight: "900", color: "#111", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session Content</h4>
             <span style={{ fontSize: "0.7rem", color: "var(--gray-dim)", fontWeight: "700" }}>Select a clip to initiate preview</span>
           </div>
           
           <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.reps.map((rep, idx) => (
                 <div
                   key={rep.id}
                   onClick={() => { setActiveRepIdx(idx); haptic.light(); }}
                   className="pseudo-haptic"
                   style={{
                     padding: "16px", borderRadius: "12px", border: activeRepIdx === idx ? "2px solid #111" : "1px solid var(--surface-light)",
                     background: activeRepIdx === idx ? "var(--surface)" : "transparent", cursor: "pointer",
                     display: "flex", alignItems: "center", gap: "16px", transition: "all 0.2s"
                   }}
                 >
                   <div style={{ 
                     width: "40px", height: "40px", background: activeRepIdx === idx ? "#111" : "var(--surface-light)", 
                     color: activeRepIdx === idx ? "#fff" : "#111", borderRadius: "8px",
                     display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "0.8rem"
                   }}>
                     {idx + 1}
                   </div>
                   <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                     <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#111" }}>Clip Sequence {idx+1}</span>
                     <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--gray-dim)" }}>TAGS: {data.subCategories ? data.subCategories.join(" + ").toUpperCase() : data.subCategory?.toUpperCase()}</span>
                   </div>
                   {rep.status === "ANALYZED" && (
                     <CheckCircle2 size={20} color="var(--primary)" />
                   )}
                 </div>
              ))}
           </div>
           
           <div style={{ padding: "20px", background: "var(--surface)", borderTop: "1px solid var(--surface-light)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "var(--gray-dim)" }}>PROGRESSION</span>
                 <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "#111" }}>{Math.round((data.reps.filter(r => r.status === "ANALYZED").length / data.reps.length) * 100)}%</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "#ddd", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
                 <div style={{ width: `${(data.reps.filter(r => r.status === "ANALYZED").length / data.reps.length) * 100}%`, height: "100%", background: "var(--primary)", transition: "width 0.5s" }}></div>
              </div>
           </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 900px) {
          .mobile-wrap-column { flex-direction: column !important; }
          .mobile-full-width { width: 100% !important; flex: 1; border-left: none !important; border-top: 2px solid #111 !important; }
        }
      `}</style>
    </div>
  );
}
