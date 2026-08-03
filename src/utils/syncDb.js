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
  "elite_pro_daily_logs",
  "elite_pro_comprehensive_targets",
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
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      data = docSnap.data();
    } else if (email) {
      // Se non esiste l'UID, cerca se c'è un profilo già creato con la stessa email (es. Google vs Email/Password)
      try {
        const cleanEmail = email.trim().toLowerCase();
        const usersRef = collection(db, "users");
        let q = query(usersRef, where("email", "==", cleanEmail));
        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          q = query(usersRef, where("profile.email", "==", cleanEmail));
          querySnapshot = await getDocs(q);
        }

        if (!querySnapshot.empty) {
          data = querySnapshot.docs[0].data();
          // Associa all'istante il nuovo UID allo stesso profilo
          await setDoc(docRef, { ...data, uid, email: cleanEmail }, { merge: true });
        }
      } catch (errQuery) {
        console.warn("Query per email fallita:", errQuery);
      }
    }

    if (!data) {
      return false;
    }

    // 1. Profile
    if (data.profile || data.firstName || data.email) {
      const profileObj = data.profile || {
        uid: uid,
        email: data.email || email || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        birthDate: data.birthDate || "",
        height: data.height || "",
        weight: data.weight || "",
        teamName: data.teamName || "",
        category: data.category || "",
        role: data.role || "",
        level: data.level || "Dilettante",
        idol: data.idol || "",
        skills: data.skills || []
      };
      localStorage.setItem("elite_pro_profile", JSON.stringify(profileObj));
    }

    // 2. Library (Video & sessioni analizzate)
    if (Array.isArray(data.library)) {
      localStorage.setItem("elite_pro_library", JSON.stringify(data.library));
    }

    // 3. GPS History
    if (Array.isArray(data.gps_history)) {
      localStorage.setItem("elite_pro_gps_history", JSON.stringify(data.gps_history));
    }

    // 4. Daily Logs
    if (data.daily_logs && typeof data.daily_logs === "object") {
      localStorage.setItem("elite_pro_daily_logs", JSON.stringify(data.daily_logs));
    }

    // 5. Targets
    if (data.comprehensive_targets) {
      localStorage.setItem("elite_pro_comprehensive_targets", JSON.stringify(data.comprehensive_targets));
    }

    // 6. Last Seen Stage
    if (data.last_seen_stage) {
      localStorage.setItem("elite_pro_last_seen_stage", data.last_seen_stage.toString());
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
    const gpsHistory = getLocalJSON("elite_pro_gps_history", []);
    const dailyLogs = getLocalJSON("elite_pro_daily_logs", {});
    const targets = getLocalJSON("elite_pro_comprehensive_targets", null);
    const lastSeenStage = localStorage.getItem("elite_pro_last_seen_stage") || "1";

    const userEmail = email || profile?.email || "";

    const payload = {
      updatedAt: new Date().toISOString(),
      ...(userEmail && { email: userEmail.toLowerCase() }),
      ...(profile && { profile: { ...profile, email: userEmail.toLowerCase() }, ...profile }),
      library,
      gps_history: gpsHistory,
      daily_logs: dailyLogs,
      comprehensive_targets: targets,
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

