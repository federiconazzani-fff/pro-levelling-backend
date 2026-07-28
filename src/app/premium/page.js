"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Sparkles, Zap, Shield, Crown } from "lucide-react";
import { haptic } from "@/utils/haptics";

const PLANS = [
  { id: "1m", months: 1, price: 7, title: "1 Mese", link: "https://buy.stripe.com/dRmaEY8MkdC51KjcBv6g801" },
  { id: "2m", months: 2, price: 10, title: "2 Mesi", link: "https://buy.stripe.com/7sY9AUd2A7dHgFd9pj6g802", recommended: true },
  { id: "3m", months: 3, price: 18, title: "3 Mesi", link: "https://buy.stripe.com/dRm4gAfaIfKd88H44Z6g803" }
];

export default function PremiumPage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState("2m");

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId);

  return (
    <div className="app-container page-wrapper" style={{ background: "var(--background)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Header */}
      <header style={{ padding: "32px 20px", background: "#fff", borderBottom: "4px solid #111", display: "flex", alignItems: "center", gap: "20px", position: "sticky", top: 0, zIndex: 10 }}>
        <button 
          onClick={() => { haptic.light(); router.back(); }} 
          className="btn-secondary pseudo-haptic" 
          style={{ border: "2px solid #111", background: "#fff", padding: "10px", borderRadius: "12px" }}
        >
          <ArrowLeft size={20} color="#111" strokeWidth={4} />
        </button>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#111", textTransform: "uppercase", lineHeight: 1 }}>
            Elite.PRO <span style={{ color: "#dcf536", textShadow: "1px 1px 0 #111, -1px -1px 0 #111, 1px -1px 0 #111, -1px 1px 0 #111" }}>Premium</span>
          </h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="v-stack" style={{ padding: "32px 20px", gap: "32px", flex: 1 }}>
        
        {/* Title Section */}
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "64px", height: "64px", background: "#111", borderRadius: "20px", marginBottom: "16px", transform: "rotate(-5deg)", border: "2px solid #dcf536", boxShadow: "4px 4px 0 #dcf536" }}>
            <Crown size={32} color="#dcf536" />
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "900", textTransform: "uppercase", lineHeight: 1.1, color: "#111", letterSpacing: "-0.03em" }}>
            Sblocca il tuo<br/>Vero Potenziale
          </h1>
          <p style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--gray-dim)", marginTop: "12px", maxWidth: "300px", margin: "12px auto 0" }}>
            Unisciti ai professionisti e ottieni analisi illimitate. <br/>
            <span style={{ color: "#dcf536" }}>Ogni nuovo account include 7 giorni di prova gratuita!</span>
          </p>
        </div>

        {/* Plan Selector */}
        <div className="v-stack" style={{ gap: "12px" }}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div 
                key={plan.id}
                onClick={() => { haptic.medium(); setSelectedPlanId(plan.id); }}
                style={{
                  padding: "20px", 
                  borderRadius: "16px", 
                  border: isSelected ? "3px solid #111" : "2px solid var(--surface-light)",
                  background: isSelected ? "#fff" : "transparent",
                  boxShadow: isSelected ? "4px 4px 0 #111" : "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                {plan.recommended && (
                  <div style={{ position: "absolute", top: "-10px", right: "20px", background: "#dcf536", color: "#111", padding: "4px 10px", borderRadius: "12px", fontSize: "0.6rem", fontWeight: "900", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px", border: "2px solid #111" }}>
                    <Sparkles size={12} /> Consigliato
                  </div>
                )}
                
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    width: "24px", height: "24px", borderRadius: "50%", 
                    border: isSelected ? "6px solid #dcf536" : "2px solid var(--gray-dim)",
                    background: isSelected ? "#111" : "transparent",
                    transition: "all 0.2s"
                  }} />
                  <span style={{ fontSize: "1.2rem", fontWeight: "900", color: "#111", textTransform: "uppercase" }}>
                    {plan.title}
                  </span>
                </div>
                
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#111" }}>${plan.price}</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--gray-dim)" }}>
                    ${(plan.price / plan.months).toFixed(2)} / mese
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Card */}
        <div className="card-dark anim-spring-pop" style={{
          background: "#111", border: "4px solid #111", borderRadius: "24px",
          padding: "32px", position: "relative", overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
        }}>

          <h3 style={{ fontSize: "1.2rem", fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Cosa Includiamo</h3>
          
          <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.1)", marginBottom: "24px", marginTop: "16px" }} />

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { icon: Zap, text: "Analisi AI Video Illimitate" },
              { icon: Shield, text: "Tracciamento Biomeccanico Avanzato" },
              { icon: Check, text: "Cronologia GPS Integrata" },
              { icon: Check, text: "Zero Pubblicità" }
            ].map((feature, idx) => (
              <li key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(220, 245, 54, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <feature.icon size={14} color="#dcf536" strokeWidth={3} />
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#fff" }}>{feature.text}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={() => {
              haptic.heavy();
              window.location.href = selectedPlan.link;
            }}
            className="interactive-btn"
            style={{
              width: "100%", padding: "18px", marginTop: "32px",
              background: "#dcf536", color: "#111", border: "none", borderRadius: "16px",
              fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em",
              boxShadow: "0 8px 0 #a3b817"
            }}
          >
            Abbonati a ${selectedPlan.price}
          </button>
          
          <p style={{ textAlign: "center", fontSize: "0.65rem", color: "#888", marginTop: "24px", fontWeight: "600" }}>
            Accesso valido per {selectedPlan.months} {selectedPlan.months === 1 ? 'mese' : 'mesi'}. Nessun rinnovo automatico.
          </p>
        </div>

      </main>
    </div>
  );
}
