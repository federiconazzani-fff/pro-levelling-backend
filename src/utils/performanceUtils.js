import { getVideoScore } from "./analyticsDb";

export const SKILL_MAP = {
  tiro: "shooting",
  passaggio: "passing",
  primo_tocco: "first touch",
  controllo_palla: "ball control",
  velocita: "speed",
  coordinazione: "coordination",
  agilita: "agility",
  cambi_direzione: "dynamic changes",
  pliometria: "pliometria"
};

export const calculateActualPerformance = (library) => {
  const results = { tecnica: {}, atletica: {} };

  const processCategory = (macroArea, domainKey, fields) => {
    fields.forEach(skill => {
      const italianTerm = skill.toLowerCase().replace('_', ' ');
      const englishTerm = SKILL_MAP[skill.toLowerCase()] || "";

      const matchingSessions = library.filter(item => {
        if (item.macroArea?.toUpperCase() !== macroArea) return false;
        const subCats = (item.subCategories || (item.subCategory ? [item.subCategory] : [])).map(s => s.toLowerCase());
        return subCats.some(sc => sc.includes(italianTerm) || (englishTerm && sc.includes(englishTerm)));
      });

      const scores = matchingSessions.map(s => {
        if (s.type === "session" && s.reps) {
          const repScores = s.reps.map(r => getVideoScore(r.id)).filter(v => v !== null);
          return repScores.length > 0 ? repScores.reduce((a, b) => a + b, 0) / repScores.length : null;
        }
        return getVideoScore(s.id);
      }).filter(v => v !== null);

      results[domainKey][skill.toLowerCase()] = scores.length > 0 
        ? (scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    });
  };

  processCategory("TECHNICAL", "tecnica", ['Generale', 'Dribbling', 'Tiro', 'Passaggio', 'Primo_tocco', 'Controllo_palla']);
  processCategory("ATHLETIC", "atletica", ['Generale', 'Velocita', 'Coordinazione', 'Agilita', 'Cambi_direzione', 'Pliometria']);

  return results;
};

export const getGpsActuals = (gpsData) => {
  if (!gpsData || gpsData.length === 0) return { km_day: 0, top_speed: 0, total_km: 0, avg_speed: 0, total_duration: 0 };
  
  const totalKm = gpsData.reduce((acc, curr) => acc + (parseFloat(curr.distance) || parseFloat(curr.total_km) || 0), 0);
  const totalDuration = gpsData.reduce((acc, curr) => acc + (parseFloat(curr.time) || 0), 0);
  const avgKmPerSession = totalKm / gpsData.length;
  const maxSpeed = Math.max(...gpsData.map(d => parseFloat(d.topSpeed) || parseFloat(d.top_speed) || 0));
  const avgSpeed = gpsData.length > 0 ? (gpsData.reduce((acc, curr) => acc + (parseFloat(curr.avgSpeed) || 0), 0) / gpsData.length) : 0;

  return { 
    km_day: avgKmPerSession, 
    top_speed: maxSpeed,
    total_km: totalKm,
    avg_speed: avgSpeed,
    total_duration: totalDuration / 60 // minutes
  };
};
