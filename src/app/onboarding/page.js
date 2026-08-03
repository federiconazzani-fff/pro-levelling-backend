"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { haptic } from "@/utils/haptics";
import { auth, db } from "@/utils/firebase";
import { doc, setDoc } from "firebase/firestore";
import { syncUserDataToFirestore } from "@/utils/syncDb";

import Step1Identity from "./components/Step1Identity";
import Step2Biometrics from "./components/Step2Biometrics";
import Step3Context from "./components/Step3Context";
import Step5Psychology from "./components/Step5Psychology";
import Step6Visual from "./components/Step6Visual";

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Single source of truth for the entire onboarding
  const [formData, setFormData] = useState({
    email: "", 
    password: "", 
    firstName: "", 
    lastName: "", 
    birthDate: "", 
    weight: "", 
    height: "",
    level: "Dilettante", 
    teamName: "", 
    category: "",
    role: "CM",
    season: "2025/2026",
    objectives: {
      matches: {
        total: 20,
        minutes: 1800,
        rating: 6.5,
        goals: 5,
        assists: 5,
      },
      training: {
        minutes: 500,
        rating: 7.0
      }
    },
    idol: "", 
    skills: [], 
    profilePhoto: null,
  });

  // Carica i dati esistenti se si sta modificando il profilo
  useEffect(() => {
    const saved = localStorage.getItem("elite_pro_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch(e) {}
    }
  }, []);

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      haptic.medium(); // Medium for step progress
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      haptic.light();
    }
  };

  const handleFinish = () => {
    haptic.heavy(); // Heavy for completion
    localStorage.setItem("elite_pro_profile", JSON.stringify(formData));
    
    // Start 7-day free trial if not already started
    if (!localStorage.getItem("elite_pro_trial_start")) {
      localStorage.setItem("elite_pro_trial_start", Date.now().toString());
    }

    const uid = formData.uid || auth.currentUser?.uid;
    if (uid) {
      // Sincronizza su Firestore in background senza bloccare la navigazione
      (async () => {
        try {
          await setDoc(doc(db, "users", uid), {
            ...formData,
            uid,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          await syncUserDataToFirestore(uid);
        } catch (e) {
          console.warn("Error saving profile to Firestore:", e);
        }
      })();
    }

    // Reindirizza istantaneamente alla Home
    router.push("/");
  };

  return (
    <div className="app-container page-wrapper" style={{ background: "var(--background)", minHeight: "100vh" }}>
      
      {/* Header & Progress */}
      <header style={{ padding: "24px 20px 0" }}>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 className="text-serif" style={{ fontSize: "1.2rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Setup Profile</h2>
            <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--primary)" }}>{currentStep} / {totalSteps}</span>
         </div>
         <div className="progress-container" style={{ height: "10px", background: "var(--surface-light)", overflow: "hidden" }}>
            <div className="progress-bar anim-spring-expand" style={{ 
              width: `${(currentStep / totalSteps) * 100}%`,
              height: "100%",
              background: "var(--primary)",
              transition: "width 0.6s var(--spring-easing)"
            }}></div>
         </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content" style={{ paddingBottom: "110px" }}>
        <div key={currentStep} className="page-wrapper">
          {currentStep === 1 && <Step1Identity formData={formData} updateFormData={updateFormData} onNext={nextStep} />}
          {currentStep === 2 && <Step2Biometrics formData={formData} updateFormData={updateFormData} />}
          {currentStep === 3 && <Step3Context formData={formData} updateFormData={updateFormData} />}
          {currentStep === 4 && <Step5Psychology formData={formData} updateFormData={updateFormData} />}
          {currentStep === 5 && <Step6Visual formData={formData} updateFormData={updateFormData} />}
        </div>
      </main>

      {/* Dynamic Bottom Actions */}
      <div className="bottom-actions" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", padding: "20px" }}>
        {currentStep > 1 ? (
            <button className="btn-secondary pseudo-haptic" style={{ flex: 1, height: "64px" }} onClick={prevStep}>
              <ArrowLeft size={20} /> BACK
            </button>
        ) : (
             <div style={{ flex: 1 }}></div>
        )}
        
        {currentStep < totalSteps ? (
            <button className="btn-primary pseudo-haptic anim-spring-pop" style={{ flex: 2, height: "64px", fontSize: "1.1rem" }} onClick={nextStep}>
              CONTINUE <ArrowRight size={22} className="anim-spring-rotate" />
            </button>
        ) : (
            <button className="btn-primary pseudo-haptic anim-spring-pop" style={{ flex: 2, background: "var(--primary)", color: "#fff", height: "64px", fontSize: "1.1rem", border: "none" }} onClick={handleFinish}>
              FINISH <Check size={22} />
            </button>
        )}
      </div>

    </div>
  );
}
