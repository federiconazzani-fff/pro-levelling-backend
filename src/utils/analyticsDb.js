/**
 * Analytics Data Utilities
 * Handles aggregation, filtering, and score extraction for the Analytics page
 */

const ANALYSIS_STORAGE_PREFIX = 'elite_pro_analysis_';

import { parseRawScore, extractGlobalScore, parseTime } from "./scoreParser";

/**
 * Extracts score from analysis data stored in localStorage
 * @param {string} videoId - The video ID
 * @returns {number|null} - The score (0-100) or null if not found
 */
export const getVideoScore = (videoId) => {
  try {
    const analysisData = localStorage.getItem(`${ANALYSIS_STORAGE_PREFIX}${videoId}`);
    if (analysisData) {
      const parsed = JSON.parse(analysisData);
      return extractGlobalScore(parsed);
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Stores analysis data
 */
export const storeAnalysisData = (videoId, analysisData) => {
  if (!videoId) return;
  localStorage.setItem(`${ANALYSIS_STORAGE_PREFIX}${videoId}`, JSON.stringify(analysisData));
};

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split('/');
  return new Date(`${year}-${month}-${day}`);
};

/**
 * Aggregates sessions by date
 */
export const groupSessionsByDate = (sessions) => {
  if (!sessions || sessions.length === 0) return [];
  const dateMap = new Map();

  sessions.forEach(session => {
    const dateKey = session.date || new Date().toLocaleDateString('en-GB');
    let score = getVideoScore(session.id);

    if (session.type === "session" && session.reps) {
       const repScores = session.reps.map(r => getVideoScore(r.id)).filter(s => s !== null);
       if (repScores.length > 0) {
         score = repScores.reduce((a, b) => a + b, 0) / repScores.length;
       }
    }

    if (score === null || score === undefined) {
       if (session.status === "NOT_ANALYZED") return;
       score = 0;
    }

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { date: dateKey, scores: [], sessions: [] });
    }

    const entry = dateMap.get(dateKey);
    entry.scores.push(Number(score));
    entry.sessions.push({ ...session, score: Number(score) });
  });

  return Array.from(dateMap.values())
    .map(entry => ({
      date: entry.date,
      avgScore: entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length,
      sessionCount: entry.sessions.length,
      sessions: entry.sessions
    }))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
};



/**
 * NEW: EXPAND REPS AS POPUPS
 * Each popup in the analysis becomes a point on the detail chart.
 */
export const expandSessionReps = (session, initialOffset = 0) => {
  const allReps = [];
  let currentOffset = initialOffset;

  const processMedia = (mediaId, titleBase) => {
    const analysis = getAnalysisData(mediaId);
    let maxTimeInMedia = 0;
    if (analysis && analysis.lista_popup) {
      analysis.lista_popup.forEach((p, idx) => {
        // According to user screenshot/json:
        // 'voto_complessivo' is at the gesture level (e.g., DRIBBLING 1)
        // 'feedback_points' is the array of specific biomechanic metrics
        let pScore = p.voto_1_10 || p.voto_complessivo || p.score || p.voto;
        
        // Fallback: If AI nested the score inside the feedback_points label (e.g., "TIRO 1 - VOTO: 7.5")
        if (!pScore && p.feedback_points && p.feedback_points.length > 0) {
           for (const fb of p.feedback_points) {
              if (fb.voto_1_10 || fb.score) {
                 pScore = fb.voto_1_10 || fb.score;
                 break;
              }
              if (fb.label && typeof fb.label === 'string' && fb.label.toUpperCase().includes('VOTO:')) {
                 const match = fb.label.match(/VOTO:\s*([0-9.,]+)/i);
                 if (match) {
                    pScore = match[1];
                    break;
                 }
              }
           }
        }
        
        const score = parseRawScore(pScore || 0);
        const localTime = parseTime(p.key_moment_time);
        const timestamp = localTime + currentOffset;
        if (localTime > maxTimeInMedia) maxTimeInMedia = localTime;

        allReps.push({
          id: `${mediaId}-p${idx}`,
          mediaId: mediaId,
          repIndex: allReps.length + 1,
          timestamp: timestamp, 
          originalTimestamp: localTime,
          title: p.titolo_grafico || p.label || `${titleBase} - Gesto ${idx + 1}`,
          score: score,
          analysisContext: analysis,
          currentPopup: p,
          // Specific metrics for this gesture
          metrics: p.feedback_points || []
        });
      });
    }
    // Add 10 seconds gap between videos
    currentOffset += maxTimeInMedia + 10;
  };

  if (session.type === "session" && session.reps) {
    session.reps.forEach((r, i) => processMedia(r.id, `Video ${i + 1}`));
  } else {
    processMedia(session.id, "Video");
  }

  // If no popups found, fallback to the item itself
  if (allReps.length === 0) {
    return {
      reps: [{ 
        ...session, 
        mediaId: session.id,
        repIndex: 1, 
        timestamp: currentOffset,
        originalTimestamp: 0,
        score: session.score || 0,
        analysisContext: getAnalysisData(session.id)
      }],
      newOffset: currentOffset + 60 // arbitrary 1 min gap
    };
  }

  return { reps: allReps, newOffset: currentOffset };
};

export const filterLibraryByCategory = (libraryData, macroArea, category) => {
  if (!libraryData) return [];
  return libraryData.filter(item => {
    if (item.macroArea?.toUpperCase() !== macroArea?.toUpperCase()) return false;
    if (category !== "All") {
      const itemCat = item.subCategories?.length > 0 ? [...item.subCategories].sort().join(" e ") : item.subCategory;
      if (itemCat !== category) return false;
    }
    const hasAnalysis = item.type === "session" 
      ? item.reps?.some(r => localStorage.getItem(`${ANALYSIS_STORAGE_PREFIX}${r.id}`))
      : localStorage.getItem(`${ANALYSIS_STORAGE_PREFIX}${item.id}`);
    if (item.status === "NOT_ANALYZED" && !hasAnalysis) return false;
    return true;
  });
};

export const getAnalysisData = (videoId) => {
  try {
    const data = localStorage.getItem(`${ANALYSIS_STORAGE_PREFIX}${videoId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
};

export const getCategoriesForMacroArea = (libraryData, macroArea) => {
  if (!libraryData) return [];
  const filtered = libraryData.filter(item => item.macroArea?.toUpperCase() === macroArea?.toUpperCase());
  const categories = new Set();
  filtered.forEach(item => {
    if (item.subCategories?.length > 0) categories.add([...item.subCategories].sort().join(" e "));
    else if (item.subCategory) categories.add(item.subCategory);
  });
  return Array.from(categories).sort();
};
