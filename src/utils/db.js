/**
 * Global Database Utilities
 * Shared access to library and videos
 */

const LIBRARY_STORAGE_KEY = 'elite_pro_library';

// Shared Mock Data for consistency across pages
const MOCK_LIBRARY = [
  { id: "v1", type: "single", title: "Tiro a volo D", date: "30/10/2026", timeSlot: "Mattina", macroArea: "TECNICA", subCategory: "Tiro", status: "NOT_ANALYZED" },
  { id: "s1", type: "session", title: "Sessione Tiri a Giro", date: "31/10/2026", timeSlot: "Pomeriggio", macroArea: "TECNICA", subCategory: "Tiro", status: "PARTIAL", reps: [
    { id: "s1-r1", status: "ANALYZED" },
    { id: "s1-r2", status: "NOT_ANALYZED" },
    { id: "s1-r3", status: "NOT_ANALYZED" }
  ]},
  { id: "v2", type: "single", title: "Sprint 30m", date: "01/11/2026", timeSlot: "Sera", macroArea: "ATLETICA", subCategory: "Velocità", status: "ANALYZED" },
  { id: "s2", type: "session", title: "Navetta 10m x 5", date: "02/11/2026", timeSlot: "Mattina", macroArea: "ATLETICA", subCategory: "Cambi Dinamici", status: "NOT_ANALYZED", reps: [
    { id: "s2-r1", status: "NOT_ANALYZED" },
    { id: "s2-r2", status: "NOT_ANALYZED" }
  ]},
  { id: "v3", type: "single", title: "Controllo stop", date: "03/11/2026", timeSlot: "Mattina", macroArea: "TECNICA", subCategory: "Controllo Palla", status: "ANALYZED" },
];

/**
 * Get all videos and sessions from the library (User + Mocks)
 */
export const getAllVideos = () => {
  if (typeof window === "undefined") return MOCK_LIBRARY;
  
  try {
    const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
    const userLibrary = saved ? JSON.parse(saved).map(item => {
      const sanitizeStr = (val) => {
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return Object.keys(val)[0] || "Unknown";
        }
        return val;
      };

      let safeSubCategory = sanitizeStr(item.subCategory);
      let safeTitle = sanitizeStr(item.title);
      let safeDate = sanitizeStr(item.date);
      let safeTimeSlot = sanitizeStr(item.timeSlot);
      let safeMacroArea = sanitizeStr(item.macroArea);
      let safeStatus = sanitizeStr(item.status);
      
      let safeSubCategories = item.subCategories;
      if (Array.isArray(safeSubCategories)) {
        safeSubCategories = safeSubCategories.map(c => sanitizeStr(c));
      } else if (typeof safeSubCategories === 'object' && safeSubCategories !== null) {
        safeSubCategories = [sanitizeStr(safeSubCategories)];
      }
      
      return {
        ...item,
        title: typeof safeTitle === 'string' ? safeTitle : "Imported Session",
        subCategory: typeof safeSubCategory === 'string' ? safeSubCategory : "General",
        subCategories: safeSubCategories,
        date: typeof safeDate === 'string' ? safeDate : "Recent",
        timeSlot: typeof safeTimeSlot === 'string' ? safeTimeSlot : "",
        macroArea: typeof safeMacroArea === 'string' ? safeMacroArea : "TECHNICAL",
        status: typeof safeStatus === 'string' ? safeStatus : "NOT_ANALYZED"
      };
    }) : [];
    return [...userLibrary, ...MOCK_LIBRARY];
  } catch (e) {
    console.error("Error reading library", e);
    return MOCK_LIBRARY;
  }
};
