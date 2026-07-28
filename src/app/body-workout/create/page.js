"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target, Settings, Check, Dumbbell, AlignLeft, Plus, X, Trash2 } from "lucide-react";
import { haptic } from "@/utils/haptics";
import CompletionBadge from "@/app/upload/components/CompletionBadge";

const ACCENT = "#CCFF00";

export default function CreateWorkoutPage() {
  const router = useRouter();
  const [focusedInput, setFocusedInput] = useState(null);
  
  const [form, setForm] = useState({ 
    name:"", 
    objective:"", 
    time:"", 
    muscles:[], 
    exercises:[{name:"",type:"reps",sets:"",value:"",weights:""}] 
  });

  const handleFocus = (id) => setFocusedInput(id);
  const handleBlur = () => setFocusedInput(null);

  const updateForm = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };



  const addExercise = () => {
    haptic.medium();
    setForm(p => ({
      ...p,
      exercises: [...p.exercises, { name: "", type: "reps", sets: "", value: "", weights: "" }]
    }));
  };

  const removeExercise = (idx) => {
    haptic.medium();
    setForm(p => {
      const arr = [...p.exercises];
      arr.splice(idx, 1);
      return { ...p, exercises: arr };
    });
  };

  const updateExercise = (idx, key, val) => {
    setForm(p => {
      const arr = [...p.exercises];
      arr[idx][key] = val;
      return { ...p, exercises: arr };
    });
  };

  const saveWorkout = () => {
    haptic.heavy();
    const existing = JSON.parse(localStorage.getItem("elite_pro_workouts") || "[]");
    localStorage.setItem("elite_pro_workouts", JSON.stringify([{ ...form, id: Date.now(), createdAt: new Date().toISOString() }, ...existing]));
    router.push('/body-workout');
  };

  const isContextComplete = form.name.trim().length > 2 && form.time;
  const validEx = form.exercises.filter(e => e.name.trim().length > 0 && e.sets && e.value);
  const isStructureComplete = validEx.length > 0;
  const isFormReady = isContextComplete && isStructureComplete;

  return (
    <div className="app-container page-wrapper" style={{ background: "var(--background)", minHeight: "100vh", paddingBottom: "100px" }}>
      
      <div style={{ background: "#111", padding: "20px 24px", position: "sticky", top: 0, zIndex: 10, borderBottom: "3px solid #111", display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={() => { haptic.medium(); router.back(); }} className="btn-icon" style={{ background: "#222", border: "2.5px solid #333" }}>
          <ArrowLeft size={20} color="#fff" />
        </button>
        <div>
          <p style={{fontSize:"0.58rem",fontWeight:900,textTransform:"uppercase",color:ACCENT,letterSpacing:"0.18em",marginBottom:2}}>Routine Builder</p>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "900", letterSpacing: "-0.02em", textTransform: "uppercase", color: "#fff", lineHeight: 1 }}>
            CREATE <span style={{ color: ACCENT }}>WORKOUT</span>
          </h2>
        </div>
      </div>

      <main className="v-stack" style={{ gap: "32px", padding: "24px 20px" }}>
        
        {/* BLOCK 1: Context */}
        <section className="card-dark hover-lift" style={{ position: "relative", border: "2px solid #111", background: "#fff", padding: "24px" }}>
          <div style={{ position: "absolute", top: "20px", right: "20px" }}>
            <CompletionBadge isComplete={isContextComplete} />
          </div>
          <div className="h-stack" style={{ marginBottom: "20px", gap: "8px" }}>
            <AlignLeft size={20} color={ACCENT} style={{filter:"brightness(0.7)"}} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>1. Info</h3>
          </div>
          
          <div className="v-stack" style={{ gap: "20px" }}>
            <div className="form-group" style={{ margin: 0, position: "relative" }}>
              <label>Workout Name</label>
              <input type="text" className="input-dark" placeholder="e.g. Leg Day" value={form.name} onFocus={() => handleFocus("name")} onBlur={handleBlur} onChange={(e) => updateForm("name", e.target.value)} style={{ padding: "16px 16px", fontSize: "1.1rem", fontWeight: "800", borderRadius: "10px", border: "none", background: "var(--surface)", borderBottom: "4px solid transparent", transition: "all 0.3s" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, height: "4px", background: ACCENT, transition: "width 0.4s", width: focusedInput === "name" || form.name.length > 0 ? "100%" : "0%" }}></div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Objective</label>
                <input type="text" className="input-dark" placeholder="e.g. Hypertrophy" value={form.objective} onChange={(e) => updateForm("objective", e.target.value)} style={{ borderBottom: "4px solid var(--surface-light)", borderRadius: "10px" }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Duration (min)</label>
                <input type="number" className="input-dark" placeholder="45" value={form.time} onChange={(e) => { const p = parseInt(e.target.value); updateForm("time", (!isNaN(p) && p < 0) ? "0" : e.target.value); }} style={{ borderBottom: "4px solid var(--surface-light)", borderRadius: "10px" }} />
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK 2: Structure */}
        <section className="card-dark hover-lift" style={{ position: "relative", border: "2px solid #111", background: "#fff", padding: "24px" }}>
          <div style={{ position: "absolute", top: "20px", right: "20px" }}>
            <CompletionBadge isComplete={isStructureComplete} />
          </div>
          <div className="h-stack" style={{ marginBottom: "20px", gap: "8px" }}>
            <Dumbbell size={20} color={ACCENT} style={{filter:"brightness(0.7)"}} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>2. Structure</h3>
          </div>
          
          <div className="v-stack" style={{ gap: "16px" }}>
            {form.exercises.map((ex, i) => (
              <div key={i} style={{ background: "var(--surface)", borderRadius: "14px", border: "2px solid #eee", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
                
                {form.exercises.length > 1 && (
                  <button onClick={() => removeExercise(i)} style={{ position: "absolute", top: "-10px", right: "-10px", background: "#fee2e2", border: "2px solid #ef4444", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                    <Trash2 size={14} color="#b91c1c" />
                  </button>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <input type="text" className="input-dark" placeholder="Exercise name (e.g. Squat)" value={ex.name} onChange={(e) => updateExercise(i, "name", e.target.value)} style={{ padding: "14px", borderRadius: "10px", borderBottom: "4px solid transparent" }} />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "10px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.65rem" }}>Sets</label>
                    <input type="number" className="input-dark" placeholder="4" value={ex.sets} onChange={(e) => updateExercise(i, "sets", e.target.value)} style={{ padding: "12px", borderRadius: "10px", borderBottom: "4px solid transparent" }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <label style={{ fontSize: "0.65rem", margin: 0 }}>Target</label>
                      <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: "1px solid #ccc" }}>
                        {["reps", "min"].map(t => (
                          <button key={t} onClick={() => updateExercise(i, "type", t==="reps"?"reps":"minutes")} style={{ padding: "2px 6px", fontSize: "0.55rem", fontWeight: "900", textTransform: "uppercase", background: ((t==="reps"&&ex.type==="reps")||(t==="min"&&ex.type==="minutes")) ? "#111" : "#fff", color: ((t==="reps"&&ex.type==="reps")||(t==="min"&&ex.type==="minutes")) ? "#fff" : "#111", border: "none", cursor: "pointer" }}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <input type="number" className="input-dark" placeholder={ex.type === "reps" ? "12" : "2"} value={ex.value} onChange={(e) => updateExercise(i, "value", e.target.value)} style={{ padding: "12px", borderRadius: "10px", borderBottom: "4px solid transparent" }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.65rem" }}>Pesi (kg)</label>
                    <input type="number" min="0" className="input-dark" placeholder="Es. 20" value={ex.weights || ""} onChange={(e) => { const val = parseFloat(e.target.value); updateExercise(i, "weights", (!isNaN(val) && val < 0) ? "0" : e.target.value); }} style={{ padding: "12px", borderRadius: "10px", borderBottom: "4px solid transparent" }} />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addExercise} style={{ padding: "16px", background: "transparent", border: "2px dashed #ccc", borderRadius: "14px", fontWeight: "900", color: "#111", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <Plus size={18} /> ADD EXERCISE
            </button>
          </div>
        </section>

        <button
          className="btn-primary"
          disabled={!isFormReady}
          style={{ width: "100%", height: "64px", fontSize: "1.2rem", marginTop: "8px", opacity: isFormReady ? 1 : 0.3, cursor: isFormReady ? "pointer" : "not-allowed", background: "#111", color: "#fff", border: "none", borderBottom: "4px solid #000" }}
          onClick={saveWorkout}
        >
          SAVE WORKOUT <Check size={24} color={ACCENT} />
        </button>

      </main>
    </div>
  );
}
