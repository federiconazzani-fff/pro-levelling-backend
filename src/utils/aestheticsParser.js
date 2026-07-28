export function parseAestheticsPayload(rawPayload, fallbackBiomechanics) {
  let payload = rawPayload;
  
  // 1. Auto-extract if n8n returned the raw AI array with markdown
  if (Array.isArray(payload) && payload[0]?.content?.parts?.[0]?.text) {
     const rawText = payload[0].content.parts[0].text;
     const cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
     try {
        payload = JSON.parse(cleanJsonStr);
     } catch(e) {
        console.error("Failed to parse AI markdown JSON", e);
     }
  }
  
  // 2. Map AI format (best_rep_analysis) to AestheticsRoom format
  let finalBiomechanics = payload.biomechanics;
  if (!finalBiomechanics && payload.best_rep_analysis) {
     const { gesture_metadata, frames_data } = payload.best_rep_analysis;
     const mapJoints = (j) => j && j.l ? { left: {x: j.l[0], y: j.l[1]}, right: {x: j.r[0], y: j.r[1]} } : j;
     
     finalBiomechanics = {
       duration_ms: 3000,
       stability: 0.88,
       elasticity: (gesture_metadata?.aesthetic_score || 85) / 100,
       ball_flow: "3D Bouncing",
       keyframes: (frames_data || []).map(fd => {
          const pts = fd.points || {};
          const skel = pts.skeleton || {};
          return {
             cog: pts.cog || { x: 500, y: 500 },
             ball: pts.ball || { x: 500, y: 500 },
             skeleton: {
               shoulders: skel.shoulders?.l ? { x1: skel.shoulders.l[0], y1: skel.shoulders.l[1], x2: skel.shoulders.r[0], y2: skel.shoulders.r[1] } : skel.shoulders,
               hips: skel.hips?.l ? { x1: skel.hips.l[0], y1: skel.hips.l[1], x2: skel.hips.r[0], y2: skel.hips.r[1] } : skel.hips,
               knees: mapJoints(skel.knees),
               ankles: mapJoints(skel.ankles),
               guide_arm: Array.isArray(skel.guide_arm) ? { elbow: {x: skel.guide_arm[0], y: skel.guide_arm[1]}, hand: {x: skel.guide_arm[0]+20, y: skel.guide_arm[1]+30} } : skel.guide_arm
             }
          };
       })
     };
  }
  
  return finalBiomechanics || fallbackBiomechanics;
}
