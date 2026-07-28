"use client";

import { useEffect, useRef, useState } from "react";
import { X, Shield, Activity, Zap } from "lucide-react";
import { haptic } from "@/utils/haptics";

const FALLBACK_BIOMECHANICS = {
  duration_ms: 2000,
  ball_flow: "2D Continuous",
  elasticity: 0.85,
  stability: 0.9,
  keyframes: [
    {"cog":{"x":650,"y":500},"ball":{"x":660,"y":680},"skeleton":{"shoulders":{"x1":630,"y1":450,"x2":670,"y2":450},"hips":{"x1":640,"y1":520,"x2":660,"y2":520},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":580}},"ankles":{"left":{"x":630,"y":650},"right":{"x":670,"y":650}},"guide_arm":{"elbow":{"x":610,"y":480},"hand":{"x":590,"y":510}}}},
    {"cog":{"x":650,"y":500},"ball":{"x":660,"y":680},"skeleton":{"shoulders":{"x1":630,"y1":450,"x2":670,"y2":450},"hips":{"x1":640,"y1":520,"x2":660,"y2":520},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":580}},"ankles":{"left":{"x":630,"y":650},"right":{"x":670,"y":650}},"guide_arm":{"elbow":{"x":610,"y":480},"hand":{"x":590,"y":510}}}},
    {"cog":{"x":645,"y":490},"ball":{"x":650,"y":680},"skeleton":{"shoulders":{"x1":625,"y1":445,"x2":675,"y2":455},"hips":{"x1":635,"y1":515,"x2":665,"y2":525},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":560}},"ankles":{"left":{"x":630,"y":650},"right":{"x":690,"y":620}},"guide_arm":{"elbow":{"x":600,"y":470},"hand":{"x":580,"y":500}}}},
    {"cog":{"x":640,"y":480},"ball":{"x":650,"y":680},"skeleton":{"shoulders":{"x1":620,"y1":440,"x2":680,"y2":460},"hips":{"x1":630,"y1":510,"x2":670,"y2":530},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":540}},"ankles":{"left":{"x":630,"y":650},"right":{"x":710,"y":590}},"guide_arm":{"elbow":{"x":590,"y":460},"hand":{"x":570,"y":490}}}},
    {"cog":{"x":635,"y":470},"ball":{"x":640,"y":680},"skeleton":{"shoulders":{"x1":615,"y1":435,"x2":685,"y2":465},"hips":{"x1":625,"y1":505,"x2":675,"y2":535},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":520}},"ankles":{"left":{"x":630,"y":650},"right":{"x":730,"y":550}},"guide_arm":{"elbow":{"x":580,"y":450},"hand":{"x":550,"y":480}}}},
    {"cog":{"x":650,"y":500},"ball":{"x":660,"y":680},"skeleton":{"shoulders":{"x1":630,"y1":450,"x2":670,"y2":450},"hips":{"x1":640,"y1":520,"x2":660,"y2":520},"knees":{"left":{"x":630,"y":580},"right":{"x":650,"y":580}},"ankles":{"left":{"x":630,"y":650},"right":{"x":645,"y":650}},"guide_arm":{"elbow":{"x":610,"y":480},"hand":{"x":590,"y":510}}}},
    {"cog":{"x":660,"y":510},"ball":{"x":690,"y":670},"skeleton":{"shoulders":{"x1":640,"y1":460,"x2":660,"y2":440},"hips":{"x1":650,"y1":530,"x2":655,"y2":510},"knees":{"left":{"x":630,"y":580},"right":{"x":630,"y":600}},"ankles":{"left":{"x":630,"y":650},"right":{"x":610,"y":610}},"guide_arm":{"elbow":{"x":620,"y":490},"hand":{"x":600,"y":520}}}},
    {"cog":{"x":670,"y":520},"ball":{"x":720,"y":650},"skeleton":{"shoulders":{"x1":650,"y1":470,"x2":655,"y2":430},"hips":{"x1":660,"y1":540,"x2":650,"y2":500},"knees":{"left":{"x":630,"y":580},"right":{"x":610,"y":620}},"ankles":{"left":{"x":630,"y":650},"right":{"x":590,"y":580}},"guide_arm":{"elbow":{"x":630,"y":500},"hand":{"x":610,"y":530}}}},
    {"cog":{"x":680,"y":530},"ball":{"x":750,"y":630},"skeleton":{"shoulders":{"x1":660,"y1":480,"x2":650,"y2":420},"hips":{"x1":670,"y1":550,"x2":645,"y2":490},"knees":{"left":{"x":630,"y":580},"right":{"x":590,"y":640}},"ankles":{"left":{"x":630,"y":650},"right":{"x":570,"y":550}},"guide_arm":{"elbow":{"x":640,"y":510},"hand":{"x":620,"y":540}}}},
    {"cog":{"x":690,"y":540},"ball":{"x":780,"y":610},"skeleton":{"shoulders":{"x1":670,"y1":490,"x2":640,"y2":410},"hips":{"x1":680,"y1":560,"x2":640,"y2":480},"knees":{"left":{"x":630,"y":580},"right":{"x":570,"y":660}},"ankles":{"left":{"x":630,"y":650},"right":{"x":550,"y":520}},"guide_arm":{"elbow":{"x":650,"y":520},"hand":{"x":630,"y":550}}}}
  ]
};

const FrameMotionLevel = ({ title, icon: Icon, subtitle, description, levelType, biomechanics, videoUrl, is2D, stabilityScore, elasticityScore }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const durationMs = biomechanics?.duration_ms || 2000;
  
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
           setDimensions({ width, height });
           if (canvasRef.current) {
             const dpr = window.devicePixelRatio || 1;
             canvasRef.current.width = width * dpr;
             canvasRef.current.height = height * dpr;
             const ctx = canvasRef.current.getContext('2d');
             ctx.scale(dpr, dpr);
           }
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Setup resize observer to catch video layout changes
    let observer;
    if (containerRef.current) {
       observer = new ResizeObserver(() => handleResize());
       observer.observe(containerRef.current);
    }
    
    setTimeout(handleResize, 100);
    return () => {
       window.removeEventListener('resize', handleResize);
       if (observer) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.warn("Autoplay prevented:", e));
    }
  }, [videoUrl]);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !biomechanics) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const { keyframes, ball_flow, elasticity, stability } = biomechanics;
    
    const scaleX = (val) => (val / 1000) * dimensions.width;
    const scaleY = (val) => (val / 1000) * dimensions.height;
    
    const catmullRom = (p0, p1, p2, p3, t) => {
      const t2 = t * t;
      const t3 = t2 * t;
      return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    };
    
    const splineCoords = (obj0, obj1, obj2, obj3, t) => {
      if (!obj1) return obj1;
      const result = {};
      for (let key in obj1) {
        if (typeof obj1[key] === 'object') {
           result[key] = splineCoords(obj0?.[key], obj1[key], obj2?.[key], obj3?.[key], t);
        } else {
           const p0 = obj0?.[key] ?? obj1[key];
           const p1 = obj1[key];
           const p2 = obj2?.[key] ?? p1;
           const p3 = obj3?.[key] ?? p2;
           result[key] = catmullRom(p0, p1, p2, p3, t);
        }
      }
      return result;
    };

    let historyFrames = [];
    let animationId;

    const draw = () => {
      let progress = 0;
      if (videoRef.current && videoRef.current.duration) {
         progress = (videoRef.current.currentTime / videoRef.current.duration) || 0;
      } else {
         const now = performance.now();
         progress = ((now % durationMs) / durationMs);
      }
      
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.fillStyle = "rgba(5, 5, 5, 0.6)";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      const frameIndex = progress * (keyframes.length - 1);
      const currentIdx = Math.floor(frameIndex);
      const nextIdx = Math.min(currentIdx + 1, keyframes.length - 1);
      const prevIdx = Math.max(currentIdx - 1, 0);
      const nextNextIdx = Math.min(currentIdx + 2, keyframes.length - 1);
      const t = frameIndex - currentIdx;
      
      const kf0 = keyframes[prevIdx];
      const kf1 = keyframes[currentIdx];
      const kf2 = keyframes[nextIdx];
      const kf3 = keyframes[nextNextIdx];
      
      const state = {
        cog: splineCoords(kf0.cog, kf1.cog, kf2.cog, kf3.cog, t),
        ball: splineCoords(kf0.ball, kf1.ball, kf2.ball, kf3.ball, t),
        skeleton: splineCoords(kf0.skeleton, kf1.skeleton, kf2.skeleton, kf3.skeleton, t)
      };
      
      const lastHF = historyFrames.length > 0 ? historyFrames[historyFrames.length - 1] : null;
      if (!lastHF || progress - lastHF.progress > 0.05 || progress < lastHF.progress) {
         if (lastHF && progress < lastHF.progress) historyFrames = [];
         historyFrames.push({ state, progress });
         if (historyFrames.length > 5) historyFrames.shift();
      }

      if (levelType === 'skeleton') {
         const drawSkeleton = (skel, alpha) => {
           ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
           ctx.lineWidth = 3;
           ctx.lineCap = 'round';
           ctx.lineJoin = 'round';
           ctx.beginPath();
           ctx.moveTo(scaleX(skel.shoulders.x1), scaleY(skel.shoulders.y1));
           ctx.lineTo(scaleX(skel.shoulders.x2), scaleY(skel.shoulders.y2));
           const midShoulderX = (skel.shoulders.x1 + skel.shoulders.x2) / 2;
           const midShoulderY = (skel.shoulders.y1 + skel.shoulders.y2) / 2;
           const midHipX = (skel.hips.x1 + skel.hips.x2) / 2;
           const midHipY = (skel.hips.y1 + skel.hips.y2) / 2;
           ctx.moveTo(scaleX(midShoulderX), scaleY(midShoulderY));
           ctx.lineTo(scaleX(midHipX), scaleY(midHipY));
           ctx.moveTo(scaleX(skel.hips.x1), scaleY(skel.hips.y1));
           ctx.lineTo(scaleX(skel.hips.x2), scaleY(skel.hips.y2));
           ctx.moveTo(scaleX(skel.hips.x1), scaleY(skel.hips.y1));
           ctx.lineTo(scaleX(skel.knees.left.x), scaleY(skel.knees.left.y));
           ctx.lineTo(scaleX(skel.ankles.left.x), scaleY(skel.ankles.left.y));
           ctx.moveTo(scaleX(skel.hips.x2), scaleY(skel.hips.y2));
           ctx.lineTo(scaleX(skel.knees.right.x), scaleY(skel.knees.right.y));
           ctx.lineTo(scaleX(skel.ankles.right.x), scaleY(skel.ankles.right.y));
           ctx.moveTo(scaleX(skel.shoulders.x1), scaleY(skel.shoulders.y1));
           ctx.lineTo(scaleX(skel.guide_arm.elbow.x), scaleY(skel.guide_arm.elbow.y));
           ctx.lineTo(scaleX(skel.guide_arm.hand.x), scaleY(skel.guide_arm.hand.y));
           ctx.stroke();
         };
         
         historyFrames.forEach((hf, idx) => {
            const alpha = 0.05 + (idx / historyFrames.length) * 0.2;
            drawSkeleton(hf.state.skeleton, alpha);
         });
         drawSkeleton(state.skeleton, 1.0);
      }

      if (levelType === 'cog') {
         ctx.beginPath();
         ctx.moveTo(scaleX(historyFrames[0]?.state?.cog?.x ?? state.cog.x), scaleY(historyFrames[0]?.state?.cog?.y ?? state.cog.y));
         historyFrames.forEach(hf => {
            const jitterX = (1 - (stability || 0.8)) * (Math.random() - 0.5) * 20;
            const jitterY = (1 - (stability || 0.8)) * (Math.random() - 0.5) * 20;
            ctx.lineTo(scaleX(hf.state.cog.x) + jitterX, scaleY(hf.state.cog.y) + jitterY);
         });
         ctx.lineTo(scaleX(state.cog.x), scaleY(state.cog.y));
         ctx.strokeStyle = "rgba(34, 211, 238, 0.8)";
         ctx.lineWidth = 4;
         ctx.setLineDash([4, 4]);
         ctx.stroke();
         ctx.setLineDash([]);
         
         ctx.beginPath();
         ctx.arc(scaleX(state.cog.x), scaleY(state.cog.y), 10, 0, Math.PI * 2);
         ctx.fillStyle = "#22d3ee";
         ctx.shadowColor = "#22d3ee";
         ctx.shadowBlur = 20;
         ctx.fill();
         ctx.shadowBlur = 0;
      }

      if (levelType === 'ball') {
         ctx.beginPath();
         ctx.moveTo(scaleX(historyFrames[0]?.state?.ball?.x ?? state.ball.x), scaleY(historyFrames[0]?.state?.ball?.y ?? state.ball.y));
         historyFrames.forEach(hf => {
            const bY = hf.state.ball.y;
            const yOffset = ball_flow === "3D Bouncing" && Math.sin(hf.progress * Math.PI * 8) > 0 ? -15 : 0;
            ctx.lineTo(scaleX(hf.state.ball.x), scaleY(bY) + yOffset);
         });
         ctx.lineTo(scaleX(state.ball.x), scaleY(state.ball.y));
         ctx.strokeStyle = "rgba(248, 113, 113, 0.8)";
         ctx.lineWidth = 4;
         if (ball_flow === "3D Bouncing") ctx.setLineDash([5, 5]);
         ctx.stroke();
         ctx.setLineDash([]);
         
         ctx.beginPath();
         ctx.arc(scaleX(state.ball.x), scaleY(state.ball.y), 8, 0, Math.PI * 2);
         ctx.fillStyle = "#f87171";
         ctx.shadowColor = "#f87171";
         ctx.shadowBlur = 15;
         ctx.fill();
         ctx.shadowBlur = 0;
      }
      
      animationId = requestAnimationFrame(draw);
    };
    
    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [dimensions, biomechanics, levelType]);

  let valueStr = "";
  let valColor = "";
  if (levelType === 'skeleton') { valueStr = elasticityScore + "%"; valColor = "#eab308"; }
  else if (levelType === 'cog') { valueStr = stabilityScore + "%"; valColor = "#22d3ee"; }
  else if (levelType === 'ball') { valueStr = is2D ? "DRAG" : "BOUNCE"; valColor = "#f87171"; }

  return (
    <div style={{ marginBottom: "40px", display: "flex", flexDirection: "column", gap: "16px" }}>
       <div style={{ padding: "0 24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `rgba(${valColor === '#eab308' ? '234, 179, 8' : valColor === '#22d3ee' ? '34, 211, 238' : '248, 113, 113'}, 0.1)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
             <Icon size={20} color={valColor} />
          </div>
          <div>
             <h3 style={{ fontSize: "1rem", fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
             <p style={{ fontSize: "0.7rem", color: valColor, fontWeight: "700" }}>{subtitle}</p>
          </div>
          <div style={{ marginLeft: "auto", fontSize: "1.2rem", fontWeight: "900", color: valColor }}>{valueStr}</div>
       </div>
       
       <div style={{ position: "relative", width: "100%", background: "#000", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "center" }}>
          <div ref={containerRef} style={{ position: "relative", display: "inline-block", maxWidth: "100%", minHeight: "200px" }}>
             {videoUrl && (
                <video 
                   ref={videoRef}
                   src={videoUrl}
                   autoPlay
                   loop
                   muted
                   playsInline
                   onLoadedData={() => {
                     window.dispatchEvent(new Event('resize'));
                     if (videoRef.current) videoRef.current.play().catch(()=>{});
                   }}
                   style={{ display: "block", width: "100%", height: "auto", maxHeight: "65vh" }}
                />
             )}
             <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none", zIndex: 10 }} />
          </div>
       </div>
       
       <div style={{ padding: "0 24px" }}>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5 }}>{description}</p>
       </div>
    </div>
  );
};

export default function AestheticsRoom({ bestReps, videoUrl, onClose }) {
  const [currentRepIndex, setCurrentRepIndex] = useState(0);
  const currentRep = bestReps[currentRepIndex];
  
  let { biomechanics } = currentRep || {};
  if (!biomechanics || !biomechanics.keyframes || biomechanics.keyframes.length === 0) {
     biomechanics = FALLBACK_BIOMECHANICS;
  }
  
  if (!bestReps || bestReps.length === 0) return null;

  const stabilityScore = Math.round((biomechanics?.stability || 0.85) * 100);
  const elasticityScore = Math.round((biomechanics?.elasticity || 0.8) * 100);
  const is2D = biomechanics?.ball_flow === "2D Continuous";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#050505", display: "flex", flexDirection: "column", color: "#fff", animation: "blockFadeIn 0.5s ease" }}>
      <header style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", zIndex: 10, background: "rgba(5,5,5,0.8)", backdropFilter: "blur(10px)", position: "sticky", top: 0 }}>
         <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "0.1em", textTransform: "uppercase" }}>The Data Room</h1>
            <div style={{ fontSize: "0.7rem", color: "#22d3ee", fontWeight: "800", letterSpacing: "0.05em", marginTop: "4px" }}>AESTHETICS ANALYSIS</div>
         </div>
         <button onClick={() => { haptic.medium(); onClose(); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", padding: "8px", borderRadius: "50%", color: "#fff", cursor: "pointer" }}>
            <X size={20} />
         </button>
      </header>
      
      <div style={{ display: "flex", padding: "16px 24px", gap: "12px", overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 10, background: "#050505" }}>
         {bestReps.map((rep, idx) => (
            <button 
               key={rep.id}
               onClick={() => { haptic.light(); setCurrentRepIndex(idx); }}
               style={{
                  padding: "8px 16px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "900", textTransform: "uppercase", whiteSpace: "nowrap",
                  background: currentRepIndex === idx ? "#22d3ee" : "rgba(255,255,255,0.05)",
                  color: currentRepIndex === idx ? "#0f172a" : "#94a3b8",
                  border: "none", cursor: "pointer", transition: "all 0.2s"
               }}
            >
               {rep.sub_category || rep.label}
            </button>
         ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
         <FrameMotionLevel 
            title="The Spring Skeleton"
            icon={Zap}
            subtitle={elasticityScore >= 70 ? "Alta Elasticità (Stile Ekitike)" : "Rigido e Meccanico (Stile Haaland)"}
            description={elasticityScore >= 70 ? "Rivoluzione Coordinata: Il braccio guida si lancia verso il basso in sincrono con l'accelerazione dei fianchi, creando un effetto molla." : "Movimento segmentato: l'uso del braccio guida non è sincronizzato, riducendo l'efficienza elastica complessiva."}
            levelType="skeleton"
            biomechanics={biomechanics}
            videoUrl={videoUrl}
            elasticityScore={elasticityScore}
         />

         <FrameMotionLevel 
            title="Core Stability"
            icon={Shield}
            subtitle={stabilityScore >= 80 ? "Effetto Hazard" : "Oscillazione Eccessiva"}
            description={stabilityScore >= 80 ? "Curva esponenziale fluida: stabilità assoluta del baricentro nonostante i cambi di direzione e la torsione." : "Il baricentro subisce sbalzi irregolari, indicando una mancanza di isolamento del busto durante il movimento."}
            levelType="cog"
            biomechanics={biomechanics}
            videoUrl={videoUrl}
            stabilityScore={stabilityScore}
         />

         <FrameMotionLevel 
            title="Ball Flow & Verticality"
            icon={Activity}
            subtitle={is2D ? "Fluidità 2D (Drags)" : "Asprezza 3D"}
            description={is2D ? "La palla rimane entro la soglia minima dall'asse Y virtuale. Fluidità estrema nei trascinamenti continui (drags)." : "Il pallone mostra picchi verticali evidenti. Asprezza del movimento e tocco ruvido (Stile Salah/Haaland)."}
            levelType="ball"
            biomechanics={biomechanics}
            videoUrl={videoUrl}
            is2D={is2D}
         />
      </div>
    </div>
  );
}
