/**
 * Global Score Parser for Elite.PRO
 * Handles various formats: "7.4/10", "85", "7,5", "9", etc.
 */
export const parseRawScore = (raw) => {
  if (raw === undefined || raw === null || raw === "") return 0;
  
  let score = 0;
  let rawStr = String(raw).trim();

  if (rawStr.includes('/')) {
    const parts = rawStr.split('/');
    const numerator = parseFloat(parts[0].replace(',', '.'));
    const denominator = parseFloat(parts[1].replace(',', '.')) || 10;
    score = (numerator / denominator) * 100;
  } else {
    score = parseFloat(rawStr.replace(',', '.')) || 0;
    // If it's in 1-10 range, scale to 0-100
    if (score > 0 && score <= 10.1) { // 10.1 to account for floating point jitter
      score = score * 10;
    }
  }

  return Math.min(100, Math.max(0, score));
};

/**
 * Universal Time Parser
 * Converts "00:32.800" or "32.8" or "01:15" to pure seconds
 */
export const parseTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return parseFloat(timeStr) || 0;
  if (!timeStr.includes(':')) return parseFloat(timeStr) || 0;

  const parts = timeStr.split(':');
  if (parts.length === 2) {
    // MM:SS.mmm
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return parseFloat(timeStr) || 0;
};

export const extractGlobalScore = (analysisData) => {
  if (!analysisData) return 0;
  
  const adv = analysisData.dati_box_advanced || {};
  
  // Priority list of fields based on user request
  const possibleFields = [
    adv.voto_complessivo_1_10,
    adv.voto_finale_sessione,
    adv.voto_complessivo,
    analysisData.voto_complessivo,
    adv.score,
    analysisData.score,
    adv.voto,
    analysisData.voto,
    adv.voto_finale,
    analysisData.punteggio
  ];

  for (const field of possibleFields) {
    if (field !== undefined && field !== null && field !== "") {
       const parsed = parseRawScore(field);
       if (parsed !== 0) return parsed;
    }
  }

  // Fallback to average of popups
  if (analysisData.lista_popup && analysisData.lista_popup.length > 0) {
    const scores = analysisData.lista_popup.map(p => {
        const pScore = p.voto_1_10 || p.voto_complessivo || p.voto || p.score || p.punteggio;
        return parseRawScore(pScore);
    }).filter(s => s > 0);
    
    if (scores.length > 0) {
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }

  return 0;
};
