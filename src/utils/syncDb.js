/**
 * Global Firestore Cloud Sync & Local Storage Management
 * Ensures cross-device synchronization for Pro.levelling users.
 */
import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

const SYNC_KEYS = [
  "elite_pro_profile",
  "elite_pro_library",
  "elite_pro_gps_history",
  "elite_pro_gps_data",
  "elite_pro_daily_logs",
  "elite_pro_comprehensive_targets",
  "elite_pro_workouts",
  "elite_pro_workout_sessions",
  "elite_pro_meditations_history",
  "elite_pro_ssg_history",
  "elite_pro_last_seen_stage"
];

/**
 * Loads all synced user data from Firestore into localStorage (searches by UID and Email)
 * @param {string} uid User ID
 * @param {string} email Optional email to unify Google Login and Email Login profiles
 * @returns {Promise<boolean>} True if profile exists and was loaded
 */
export const loadUserDataFromFirestore = async (uid, email = "") => {
  if (!uid || typeof window === "undefined") return false;

  try {
    let data = null;
    let cleanEmail = "";
    if (email) {
      cleanEmail = email.trim().toLowerCase();
    } else {
      const localProf = localStorage.getItem("elite_pro_profile");
      if (localProf) {
        try {
          const parsed = JSON.parse(localProf);
          if (parsed?.email) cleanEmail = parsed.email.trim().toLowerCase();
        } catch {}
      }
    }

    // 1. PRIORITÀ ASSOLUTA: Cerca in Firestore qualsiasi documento associato a questa stessa EMAIL
    let foundDocs = [];
    if (cleanEmail) {
      try {
        const usersRef = collection(db, "users");
        let q = query(usersRef, where("email", "==", cleanEmail));
        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          q = query(usersRef, where("profile.email", "==", cleanEmail));
          querySnapshot = await getDocs(q);
        }

        if (!querySnapshot.empty) {
          foundDocs = querySnapshot.docs.map(d => d.data());
        }
      } catch (errQuery) {
        console.warn("Query per email fallita:", errQuery);
      }
    }

    // 2. Cerca anche il documento per UID
    const docRef = doc(db, "users", uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        foundDocs.push(docSnap.data());
      }
    } catch (errUid) {
      console.warn("GetDoc per UID fallito:", errUid);
    }

    if (foundDocs.length === 0) {
      return false;
    }

    // 3. MERGE COMPLETO DI TUTTI I DOCUMENTI PER QUESTA EMAIL
    // Se l'utente ha un doc con il profilo e un altro con libreria/GPS li uniamo in uno unico super-profilo!
    let mergedProfile = null;
    let mergedLibraryMap = new Map();
    let mergedGpsMap = new Map();
    let mergedDailyLogs = {};
    let mergedTargets = null;
    let mergedWorkouts = [];
    let mergedWorkoutSessions = [];
    let mergedMeditations = [];
    let mergedSsg = [];
    let lastSeenStage = "1";

    foundDocs.forEach(d => {
      // Profile
      if (d.profile || d.firstName || d.email) {
        const p = d.profile || d;
        if (!mergedProfile || (p.weight && !mergedProfile.weight) || (p.height && !mergedProfile.height)) {
          mergedProfile = { ...mergedProfile, ...p };
        }
      }

      // Library
      const libArr = Array.isArray(d.library) ? d.library : (Array.isArray(d.userLibrary) ? d.userLibrary : []);
      libArr.forEach(item => {
        if (item && (item.id || item.title)) {
          const key = item.id || `${item.title}_${item.date}`;
          mergedLibraryMap.set(key, item);
        }
      });

      // GPS
      const gpsArr = Array.isArray(d.gps_history) ? d.gps_history : (Array.isArray(d.gps_data) ? d.gps_data : []);
      gpsArr.forEach(item => {
        if (item && (item.id || item.date)) {
          const key = item.id || `${item.date}_${item.time || ''}`;
          mergedGpsMap.set(key, item);
        }
      });

      // Daily Logs
      if (d.daily_logs && typeof d.daily_logs === "object") {
        mergedDailyLogs = { ...mergedDailyLogs, ...d.daily_logs };
      }

      // Targets
      if (d.comprehensive_targets && !mergedTargets) {
        mergedTargets = d.comprehensive_targets;
      }

      // Workouts
      if (Array.isArray(d.workouts)) mergedWorkouts = [...mergedWorkouts, ...d.workouts];
      if (Array.isArray(d.workout_sessions)) mergedWorkoutSessions = [...mergedWorkoutSessions, ...d.workout_sessions];
      if (Array.isArray(d.meditations_history)) mergedMeditations = [...mergedMeditations, ...d.meditations_history];
      if (Array.isArray(d.ssg_history)) mergedSsg = [...mergedSsg, ...d.ssg_history];

      if (d.last_seen_stage) lastSeenStage = d.last_seen_stage.toString();
    });

    const finalLibrary = Array.from(mergedLibraryMap.values());
    const finalGps = Array.from(mergedGpsMap.values());
    const userEmail = cleanEmail || mergedProfile?.email || "";

    // 4. Salva in LocalStorage tutti i moduli
    if (mergedProfile) {
      const profileObj = {
        uid: uid,
        email: userEmail,
        firstName: mergedProfile.firstName || "",
        lastName: mergedProfile.lastName || "",
        birthDate: mergedProfile.birthDate || "",
        height: mergedProfile.height || "",
        weight: mergedProfile.weight || "",
        teamName: mergedProfile.teamName || "",
        category: mergedProfile.category || "",
        role: mergedProfile.role || "",
        level: mergedProfile.level || "Dilettante",
        idol: mergedProfile.idol || "",
        skills: mergedProfile.skills || []
      };
      localStorage.setItem("elite_pro_profile", JSON.stringify(profileObj));
    }

    localStorage.setItem("elite_pro_library", JSON.stringify(finalLibrary));
    localStorage.setItem("elite_pro_gps_history", JSON.stringify(finalGps));
    localStorage.setItem("elite_pro_gps_data", JSON.stringify(finalGps));
    localStorage.setItem("elite_pro_daily_logs", JSON.stringify(mergedDailyLogs));
    if (mergedTargets) localStorage.setItem("elite_pro_comprehensive_targets", JSON.stringify(mergedTargets));
    if (mergedWorkouts.length) localStorage.setItem("elite_pro_workouts", JSON.stringify(mergedWorkouts));
    if (mergedWorkoutSessions.length) localStorage.setItem("elite_pro_workout_sessions", JSON.stringify(mergedWorkoutSessions));
    if (mergedMeditations.length) localStorage.setItem("elite_pro_meditations_history", JSON.stringify(mergedMeditations));
    if (mergedSsg.length) localStorage.setItem("elite_pro_ssg_history", JSON.stringify(mergedSsg));
    localStorage.setItem("elite_pro_last_seen_stage", lastSeenStage);

    // 5. Salva ed Unifica immediatamente il payload completo su Firestore sotto questo UID
    const mergedPayload = {
      updatedAt: new Date().toISOString(),
      email: userEmail,
      ...(mergedProfile && { profile: { ...mergedProfile, email: userEmail } }),
      library: finalLibrary,
      gps_history: finalGps,
      gps_data: finalGps,
      daily_logs: mergedDailyLogs,
      comprehensive_targets: mergedTargets,
      workouts: mergedWorkouts,
      workout_sessions: mergedWorkoutSessions,
      meditations_history: mergedMeditations,
      ssg_history: mergedSsg,
      last_seen_stage: lastSeenStage
    };

    try {
      await setDoc(docRef, mergedPayload, { merge: true });
    } catch (errMerge) {
      console.warn("Merge Firestore UID fallito:", errMerge);
    }

    return true;
  } catch (error) {
    console.error("Error loading user data from Firestore:", error);
    return false;
  }
};

/**
 * Uploads all local user data to Firestore under users/{uid}
 * @param {string} uid User ID
 * @param {string} email User Email
 */
export const syncUserDataToFirestore = async (uid, email = "") => {
  if (!uid || typeof window === "undefined") return;

  try {
    const getLocalJSON = (key, defaultVal) => {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultVal;
      try {
        return JSON.parse(raw);
      } catch {
        return defaultVal;
      }
    };

    const profile = getLocalJSON("elite_pro_profile", null);
    const library = getLocalJSON("elite_pro_library", []);
    const gpsHistory = getLocalJSON("elite_pro_gps_history", getLocalJSON("elite_pro_gps_data", []));
    const dailyLogs = getLocalJSON("elite_pro_daily_logs", {});
    const targets = getLocalJSON("elite_pro_comprehensive_targets", null);
    const workouts = getLocalJSON("elite_pro_workouts", []);
    const workoutSessions = getLocalJSON("elite_pro_workout_sessions", []);
    const meditations = getLocalJSON("elite_pro_meditations_history", []);
    const ssg = getLocalJSON("elite_pro_ssg_history", []);
    const lastSeenStage = localStorage.getItem("elite_pro_last_seen_stage") || "1";

    const userEmail = (email || profile?.email || "").toLowerCase();

    const payload = {
      updatedAt: new Date().toISOString(),
      ...(userEmail && { email: userEmail }),
      ...(profile && { profile: { ...profile, email: userEmail }, ...profile }),
      library,
      gps_history: gpsHistory,
      gps_data: gpsHistory,
      daily_logs: dailyLogs,
      comprehensive_targets: targets,
      workouts,
      workout_sessions: workoutSessions,
      meditations_history: meditations,
      ssg_history: ssg,
      last_seen_stage: lastSeenStage
    };

    await setDoc(doc(db, "users", uid), payload, { merge: true });
    console.log("Cross-device Firestore sync completed for user:", uid);
  } catch (error) {
    console.error("Error syncing user data to Firestore:", error);
  }
};

/**
 * Completely clears all local user data upon logout
 */
export const clearAllUserData = () => {
  if (typeof window === "undefined") return;
  SYNC_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
  localStorage.removeItem("elite_pro_trial_start");
  console.log("All local user data cleared.");
};

/**
 * Automatically pushes current local data to Firestore if logged in
 */
export const autoSyncToFirestore = () => {
  if (typeof window === "undefined") return;
  try {
    import("./firebase").then(({ auth }) => {
      if (auth && auth.currentUser) {
        syncUserDataToFirestore(auth.currentUser.uid, auth.currentUser.email || "");
      }
    }).catch(() => {});
  } catch (err) {
    console.warn("Auto sync background error:", err);
  }
};


