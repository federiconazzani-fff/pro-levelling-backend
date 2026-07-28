"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Zap } from "lucide-react";
import { haptic } from "@/utils/haptics";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Sblocca il passaporto Premium
    localStorage.setItem('elite_pro_isPremium', 'true');
    haptic.heavy();

    // 2. Reindirizza dopo 3 secondi
    const timer = setTimeout(() => {
      router.push('/library');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="app-container page-wrapper" style={{ background: "#111", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      
      <div className="anim-spring-pop" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", textAlign: "center" }}>
        
        <div style={{ position: "relative", width: "100px", height: "100px" }}>
          <div style={{ position: "absolute", inset: 0, background: "#dcf536", borderRadius: "50%", opacity: 0.2, animation: "pulse 2s infinite" }} />
          <div style={{ position: "absolute", inset: "10px", background: "#dcf536", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(220, 245, 54, 0.4)" }}>
            <CheckCircle2 size={48} color="#111" strokeWidth={3} />
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            Sei <span style={{ color: "#dcf536" }}>Premium</span>!
          </h1>
          <p style={{ fontSize: "1rem", color: "#888", fontWeight: "600", maxWidth: "280px" }}>
            Pagamento completato. Tutte le funzionalità intelligenti sono sbloccate.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", padding: "12px 20px", borderRadius: "100px", marginTop: "16px" }}>
          <Zap size={16} color="#dcf536" className="animate-spin-slow" />
          <span style={{ fontSize: "0.8rem", color: "#fff", fontWeight: "700", textTransform: "uppercase" }}>Preparazione AI in corso...</span>
        </div>

      </div>

    </div>
  );
}
