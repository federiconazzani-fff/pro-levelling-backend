import { useState, useEffect } from "react";
import { X, Play, AlertCircle, RefreshCcw, Calendar, Target } from "lucide-react";
import TripleLockDeleteButton from "./TripleLockDeleteButton";
import { useRouter } from "next/navigation";
import { haptic } from "@/utils/haptics";
import { getPersistentVideoUrl } from "@/utils/mediaDb";

export default function SingleDetailModal({ open, data, onClose, onDelete }) {
  const [videoError, setVideoError] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const router = useRouter();

  // Load persistent video URL when modal opens
  useEffect(() => {
    if (!open || !data) return;

    setVideoError(false);

    const loadVideo = async () => {
      // If it's a mock video or already has a placeholder URL, use it
      if (data.videoUrl && !data.videoUrl.startsWith('blob:')) {
        setVideoUrl(data.videoUrl);
      } else {
        // Try loading from IndexedDB using the item ID
        try {
          const url = await getPersistentVideoUrl(data.id);
          if (url) {
            setVideoUrl(url);
          } else if (data.videoUrl) {
            // Fallback to what was in the data (might be expired, but we try)
            setVideoUrl(data.videoUrl);
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
  }, [open, data?.id]);

  if (!open || !data) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "#fff",
      display: "flex", flexDirection: "column", animation: "blockFadeIn 0.3s ease-out"
    }}>
      {/* TOP HEADER - Editorial Style */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "24px", alignItems: "center", borderBottom: "2px solid #111" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
           <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
             <span style={{ fontSize: "0.65rem", fontWeight: "900", color: "var(--primary)", textTransform: "uppercase", background: "var(--surface)", padding: "2px 6px", borderRadius: "4px" }}>
               {data.subCategories ? data.subCategories.join(" + ") : data.subCategory}
             </span>
             <span style={{ fontSize: "0.65rem", fontWeight: "800", color: "var(--gray-dim)" }}>{data.date}</span>
           </div>
           <h3 style={{ fontSize: "1.4rem", fontWeight: "900", letterSpacing: "-0.03em", textTransform: "uppercase", color: "#111" }}>{data.title}</h3>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <TripleLockDeleteButton onDelete={() => onDelete(data.id)} />
          <button className="btn-icon pseudo-haptic" onClick={onClose} style={{ border: "2px solid #111", borderRadius: "50%", padding: "10px", background: "#fff", boxShadow: "4px 4px 0px #eee" }}>
            <X size={20} color="#111" />
          </button>
        </div>
      </div>

      {/* CENTER PLAYER AREA */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#000", position: "relative", overflow: "hidden" }}>
         {videoError ? (
           <div style={{ textAlign: "center", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px" }}>
             <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(230, 57, 70, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--primary)" }}>
                <AlertCircle size={40} color="var(--primary)" />
             </div>
             <h3 style={{ fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase" }}>Video Link Expired</h3>
             <p style={{ opacity: 0.7, fontSize: "0.85rem", maxWidth: "260px", lineHeight: "1.4" }}>
                Browser session security has expired this temporary video link. Please re-upload the clip for a new analysis session.
             </p>
             <button onClick={() => router.push('/upload')} style={{ background: "transparent", border: "1px solid #fff", color: "#fff", padding: "12px 24px", borderRadius: "12px", fontWeight: "900", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase" }}>
               <RefreshCcw size={16} /> Restore Content
             </button>
           </div>
         ) : (
           <video 
             key={data.id}
             src={videoUrl} 
             controls 
             playsInline
             autoPlay
             onError={() => setVideoError(true)}
             style={{ width: "100%", height: "100%", objectFit: "contain", outline: "none" }}
           />
         )}
         
         {/* TACTICAL WATERMARK */}
         {!videoError && (
           <div style={{ position: "absolute", bottom: "30px", right: "30px", opacity: 0.5, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: "0.2em" }}>ELITE.PRO</div>
              <div style={{ fontSize: "0.5rem", color: "#fff" }}>SECURE_ENCRYPTION_STREAM</div>
           </div>
         )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #111", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
               <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase" }}>Current Zone</span>
               <span style={{ fontSize: "0.9rem", fontWeight: "900", color: "#111" }}>{data.macroArea}</span>
            </div>
            <div style={{ width: "1px", height: "30px", background: "var(--surface-light)" }}></div>
            <div style={{ display: "flex", flexDirection: "column" }}>
               <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase" }}>Analysis status</span>
               <span style={{ fontSize: "0.9rem", fontWeight: "900", color: data.status === "ANALYZED" ? "#111" : "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                 {data.status === "ANALYZED" ? "READY" : "PENDING"}
               </span>
            </div>
        </div>
      </div>
    </div>
  );
}
