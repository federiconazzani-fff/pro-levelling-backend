import { useState, useRef } from "react";
import { Camera, Check, Scissors } from "lucide-react";
import { haptic } from "@/utils/haptics";

export default function Step6Visual({ formData, updateFormData }) {
  const [isCropping, setIsCropping] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData({ profilePhoto: reader.result });
        setIsCropping(true);
        haptic.medium();
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmCrop = () => {
    setIsCropping(false);
    haptic.heavy();
  };

  return (
    <div className="page-wrapper" style={{ textAlign: "center", paddingTop: "10px" }}>
      <h2 style={{ fontSize: "3rem", lineHeight: "1", fontWeight: "900", marginBottom: "16px" }}>
        ELITE <span className="brush-highlight">IDENTITY</span>
      </h2>
      
      {!isCropping ? (
        <>
          <p className="text-dim" style={{ marginBottom: "32px", marginTop: "12px" }}>
            Final step. Upload your profile photo to complete your professional identity.
          </p>

          <div 
            className={`circle-upload pseudo-haptic ${formData.profilePhoto ? "anim-spring-pop" : ""}`} 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              border: formData.profilePhoto ? "4px solid var(--primary)" : "3px dashed #ddd", 
              background: "#fff",
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
              width: "180px",
              height: "180px"
            }}
          >
            {formData.profilePhoto ? (
              <img src={formData.profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <Camera size={40} color="var(--gray-dim)" />
                <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>Upload Photo</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="card-dark" style={{ textAlign: "left", marginTop: "40px", background: "#fff", border: "2px solid #111" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "900", textTransform: "uppercase", borderBottom: "4px solid var(--primary)", paddingBottom: "4px", marginBottom: "20px", display: "inline-block" }}>Identity Summary</h3>
            
            <div className="v-stack" style={{ gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
                <span className="text-dim">Athlete</span>
                <span style={{ fontWeight: "800" }}>{formData.firstName} {formData.lastName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
                <span className="text-dim">Level</span>
                <span style={{ fontWeight: "800" }}>{formData.level}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
                <span className="text-dim">Season</span>
                <span className="brush-red-text" style={{ fontWeight: "800" }}>{formData.season}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-dim">Primary Goal</span>
                <span style={{ fontWeight: "800" }}>{formData.objectives.matches.goals} Goals</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="anim-spring-pop" style={{ padding: "20px" }}>
          <p style={{ fontWeight: "900", textTransform: "uppercase", marginBottom: "20px" }}>Adjust & Crop Identity</p>
          <div style={{ 
            width: "280px", 
            height: "280px", 
            margin: "0 auto", 
            border: "4px solid var(--primary)", 
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)"
          }}>
             <img src={formData.profilePhoto} alt="Cropping" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
             <div style={{ position: "absolute", inset: 0, border: "2px solid #fff", borderRadius: "0%" }}></div>
          </div>
          <button 
            className="btn-primary anim-spring-pop" 
            onClick={confirmCrop}
            style={{ marginTop: "40px", width: "100%", height: "64px", fontSize: "1.1rem" }}
          >
            CONFIRM CROP <Check size={20} />
          </button>
        </div>
      )}

      <p style={{ marginTop: "32px", fontSize: "0.8rem", fontStyle: "italic", color: "var(--gray-dim)", opacity: 0.7 }}>
         Your biometric and performance data will be processed locally to ensure maximum privacy and speed.
      </p>
    </div>
  );
}
