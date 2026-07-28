import { useState } from "react";
import { Trash2 } from "lucide-react";
import { haptic } from "@/utils/haptics";

export default function TripleLockDeleteButton({ onDelete }) {
  const [step, setStep] = useState(0);

  const handleClick = () => {
    haptic.medium();
    if (step === 0) setStep(1);
    else if (step === 1) setStep(2);
    else if (step === 2) {
      haptic.heavy();
      onDelete();
      setStep(0);
    }
  };

  // UI States
  const states = [
    { text: "ELIMINA", bg: "var(--surface)", color: "var(--primary)", border: "1px solid var(--surface-light)", icon: <Trash2 size={16} /> },
    { text: "SEI SICURO?", bg: "var(--warning)", color: "#111", border: "1px solid #111", icon: null },
    { text: "IRREVERSIBILE. ELIMINA.", bg: "var(--primary)", color: "#fff", border: "2px solid #111", icon: <Trash2 size={16} color="#fff" /> }
  ];

  const current = states[step];

  return (
    <button 
      onClick={handleClick}
      className="pseudo-haptic anim-spring-pop"
      style={{ 
        display: "flex", alignItems: "center", gap: "6px", 
        background: current.bg, color: current.color, border: current.border,
        padding: "8px 16px", borderRadius: "12px",
        fontWeight: "900", fontSize: "0.7rem", textTransform: "uppercase", transition: "all 0.2s var(--spring-easing)"
      }}
    >
      {current.icon}
      {current.text}
    </button>
  );
}
