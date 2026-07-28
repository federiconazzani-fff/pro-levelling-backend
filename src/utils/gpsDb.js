/**
 * GPS Database Utilities
 * Handles storing live tracks, history, and linking to video sessions.
 */

const GPS_STORAGE_KEY = 'elite_pro_gps_history';

/**
 * Get all saved GPS sessions
 */
export const getGpsHistory = () => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(GPS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading GPS history", e);
    return [];
  }
};

/**
 * Save a newly completed GPS session
 */
export const saveGpsSession = (sessionData) => {
  if (typeof window === "undefined") return;
  const history = getGpsHistory();
  const newSession = {
    ...sessionData,
    id: `gps-${Date.now()}`,
    createdAt: new Date().toISOString(),
    linkedVideoId: null // For future association
  };
  
  history.unshift(newSession); // Add to beginning
  localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(history));
  return newSession;
};

/**
 * Link a GPS session to a Video Session
 */
export const linkGpsToVideo = (gpsId, videoId) => {
  if (typeof window === "undefined") return;
  const history = getGpsHistory();
  const updated = history.map(session => {
    if (session.id === gpsId) {
      return { ...session, linkedVideoId: videoId, type: null }; // Reset type if linked to video
    }
    return session;
  });
  localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(updated));
};

/**
 * Unlink a GPS session from a Video Session
 */
export const unlinkGpsSession = (gpsId) => {
  if (typeof window === "undefined") return;
  const history = getGpsHistory();
  const updated = history.map(session => {
    if (session.id === gpsId) {
      return { ...session, linkedVideoId: null };
    }
    return session;
  });
  localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(updated));
};

/**
 * Update the training category type for a GPS session
 */
export const updateGpsSessionType = (gpsId, type) => {
  if (typeof window === "undefined") return;
  const history = getGpsHistory();
  const updated = history.map(session => {
    if (session.id === gpsId) {
      return { ...session, type: type, linkedVideoId: null }; // Reset linked video if categorized
    }
    return session;
  });
  localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(updated));
};

/**
 * Remove a GPS session
 */
export const deleteGpsSession = (gpsId) => {
  if (typeof window === "undefined") return;
  const history = getGpsHistory();
  const filtered = history.filter(s => s.id !== gpsId);
  localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(filtered));
};

/**
 * Calculate Haversine distance between two points in km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};
