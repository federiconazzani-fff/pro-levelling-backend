import { Play, Copy, Zap } from "lucide-react";

export default function VideoCard({ data, onClick }) {
  const isSession = data.type === "session";
  const isUserUploaded = data.id.startsWith("u-");

  return (
    <div 
      className="card-dark pseudo-haptic" 
      onClick={() => onClick(data)}
      style={{ 
        cursor: "pointer", 
        border: "1px solid var(--surface-light)", 
        background: "#ffffff", 
        padding: "10px", 
        display: "flex", 
        flexDirection: "column", 
        gap: "14px",
        borderRadius: "16px",
        transition: "all 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)",
        boxShadow: "0 6px 16px rgba(0,0,0,0.03)",
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
        e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.12)";
        e.currentTarget.style.borderColor = "#111";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.03)";
        e.currentTarget.style.borderColor = "var(--surface-light)";
      }}
    >
      {/* THUMBNAIL AREA */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-light) 100%)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", overflow: isSession ? "visible" : "hidden" }}>
        
        {isSession ? (
           <div style={{ position: "relative", width: "100%", height: "100%" }}>
             <div style={{ position: "absolute", top: "-4px", left: "8px", right: "-4px", bottom: "8px", background: "var(--surface)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "10px", transform: "rotate(4deg)", zIndex: 1 }} className="card-layer-1"></div>
             <div style={{ position: "absolute", top: "-2px", left: "4px", right: "-2px", bottom: "4px", background: "#f8f9fa", border: "1px solid rgba(0,0,0,0.2)", borderRadius: "10px", transform: "rotate(2deg)", zIndex: 2 }} className="card-layer-2"></div>
             <div style={{ position: "absolute", inset: 0, background: "linear-gradient(45deg, #111, #222)", borderRadius: "10px", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", overflow: "hidden", border: "1px solid #111" }}>
                 <Copy size={28} color="#fff" style={{ opacity: 0.9, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
                 <span style={{ fontSize: "0.75rem", fontWeight: "900", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>{data.reps?.length || 0} CLIPS</span>
             </div>
           </div>
        ) : (
           <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #222 0%, #111 100%)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #111" }}>
             <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "radial-gradient(circle at 100% 100%, #ffffff 0%, transparent 50%)" }}></div>
             <div className="play-button" style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.4)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", transition: "all 0.3s", zIndex: 2 }}>
               <Play size={20} color="#fff" fill="#fff" style={{ marginLeft: "4px" }} />
             </div>
           </div>
        )}

        {/* TOP STATUS OVERLAYS */}
        <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", display: "flex", justifyContent: "space-between", zIndex: 10 }}>

           
           {data.status === "ANALYZED" && (
             <div style={{ background: "var(--primary)", color: "#fff", fontSize: "0.6rem", fontWeight: "900", padding: "4px 10px", borderRadius: "8px", letterSpacing: "0.05em", border: "1px solid rgba(0,0,0,0.1)", marginLeft: "auto" }}>
               ANALYZED
             </div>
           )}
        </div>
      </div>

      {/* METADATA AREA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 4px" }}>
         
         <div className="v-stack" style={{ gap: "2px" }}>
           <span style={{ fontSize: "0.65rem", fontWeight: "900", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
             {data.subCategories && data.subCategories.length > 0 
               ? [...data.subCategories].sort().join(" e ") 
               : data.subCategory}
           </span>
           <h4 style={{ fontSize: "1.1rem", fontWeight: "900", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
             {data.title}
           </h4>
         </div>
         
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
               <span style={{ fontSize: "0.65rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>{data.date}</span>
               <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "#111" }}>{data.timeSlot}</span>
            </div>
            
            <div style={{ background: "var(--surface)", border: "1px solid var(--surface-light)", padding: "4px 8px", borderRadius: "8px" }}>
               <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "#111", textTransform: "uppercase" }}>{isSession ? "Session" : "Single"}</span>
            </div>
         </div>
      </div>

    </div>
  );
}
