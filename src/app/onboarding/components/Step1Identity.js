import { useEffect, useState } from "react";
import { haptic } from "@/utils/haptics";
import { auth, db } from "@/utils/firebase";
import {
  signInWithPopup,
  signInWithCredential,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { loadUserDataFromFirestore } from "@/utils/syncDb";

export default function Step1Identity({ formData, updateFormData, onNext }) {
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const handleAuthenticatedUser = async (user) => {
    try {
      const hasData = await loadUserDataFromFirestore(user.uid, user.email || formData.email);
      if (hasData) {
        setAuthSuccess(`Accesso effettuato! Bentornato, ${user.email}`);
        haptic.success();
        setTimeout(() => {
          window.location.href = "/";
        }, 600);
        return;
      }
    } catch (e) {
      console.warn("Error fetching profile from Firestore:", e);
    }

    const nameParts = user.displayName ? user.displayName.split(" ") : ["", ""];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    updateFormData({
      uid: user.uid,
      email: user.email || formData.email || "",
      firstName: formData.firstName || firstName,
      lastName: formData.lastName || lastName,
      birthDate: formData.birthDate || "2000-01-01"
    });
    setAuthSuccess("Account collegato con successo!");
    haptic.success();
    setTimeout(() => onNext(), 600);
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          handleAuthenticatedUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect login error", error);
      });
  }, []);

  const calculateAge = (dateString) => {
    if (!dateString) return "--";
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleSocialLogin = async (providerName) => {
    haptic.success();
    setAuthError("");
    setAuthSuccess("");
    setIsLoadingAuth(true);

    if (providerName === "Google") {
      try {
        try {
          if (Capacitor.isNativePlatform()) {
            GoogleAuth.initialize({
              clientId: "986409597877-qkkal2gkvo6dv9dr6k78sut6rm852juk.apps.googleusercontent.com",
              scopes: ["profile", "email"],
            });
            await GoogleAuth.signOut().catch(() => {});
            const googleUser = await GoogleAuth.signIn();
            const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
            const result = await signInWithCredential(auth, credential);
            if (result && result.user) {
              await handleAuthenticatedUser(result.user);
            }
          } else {
            throw new Error("Web fallback");
          }
        } catch (nativeError) {
          console.warn("Native Google auth fallback to redirect/popup", nativeError);
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          try {
            if (Capacitor.isNativePlatform()) {
              await signInWithRedirect(auth, provider);
            } else {
              const result = await signInWithPopup(auth, provider);
              if (result && result.user) {
                await handleAuthenticatedUser(result.user);
              }
            }
          } catch (fallbackErr) {
            console.warn("Popup fallback failed, trying redirect:", fallbackErr);
            await signInWithRedirect(auth, provider);
          }
        }
      } catch (error) {
        console.error("Google login error", error);
        if (error.code !== "auth/popup-closed-by-user") {
          setAuthError("Errore login Google: " + (error.message || JSON.stringify(error)));
        }
      } finally {
        setIsLoadingAuth(false);
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!formData.email || !formData.password) {
      setAuthError("Inserisci email e password validi.");
      return;
    }
    setAuthError("");
    setAuthSuccess("");
    setIsLoadingAuth(true);
    haptic.medium();

    try {
      if (authMode === "login") {
        const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        if (result && result.user) {
          await handleAuthenticatedUser(result.user);
        }
      } else {
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        if (result && result.user) {
          await handleAuthenticatedUser(result.user);
        }
      }
    } catch (error) {
      console.error("Email auth error:", error);
      let msg = error.message;
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
        msg = "Credenziali non valide o utente non trovato.";
      } else if (error.code === "auth/email-already-in-use") {
        msg = "Questa email è già associata a un account. Usa la scheda 'Accedi'.";
      } else if (error.code === "auth/weak-password") {
        msg = "La password deve essere di almeno 6 caratteri.";
      }
      setAuthError(msg);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Brand Eye-Catcher */}
      <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "6px", background: "var(--primary)", borderRadius: "3px" }}></div>
        <span style={{ fontSize: "0.75rem", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gray-dim)" }}>Season 2025/26</span>
      </div>

      <h2 style={{ fontSize: "2.5rem", lineHeight: "1", fontWeight: "900", marginBottom: "16px", textTransform: "uppercase" }}>
        WELCOME TO <span className="brush-highlight">Pro.levelling</span>
      </h2>
      <p style={{ marginBottom: "28px", fontSize: "1rem", color: "var(--gray-dim)", lineHeight: "1.5" }}>
        Build your elite identity. Accedi per sincronizzare i tuoi dati o crea un nuovo profilo.
      </p>

      {/* TABS: LOGIN vs REGISTER */}
      <div style={{ display: "flex", gap: "8px", background: "var(--surface-light)", padding: "4px", borderRadius: "14px", marginBottom: "24px" }}>
        <button
          type="button"
          onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); haptic.selection(); }}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            fontWeight: "900",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            border: authMode === "login" ? "2px solid #111" : "none",
            background: authMode === "login" ? "#fff" : "transparent",
            color: "#111",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Accedi
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode("register"); setAuthError(""); setAuthSuccess(""); haptic.selection(); }}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            fontWeight: "900",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            border: authMode === "register" ? "2px solid #111" : "none",
            background: authMode === "register" ? "#fff" : "transparent",
            color: "#111",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Crea Profilo
        </button>
      </div>

      {/* Social Login */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button
          type="button"
          className="btn-secondary pseudo-haptic"
          onClick={() => handleSocialLogin("Google")}
          disabled={isLoadingAuth}
          style={{ flex: 1, border: "2px solid #111", background: "#fff", fontWeight: "800", gap: "8px", padding: "14px", borderRadius: "14px", fontSize: "1rem" }}
        >
          𝗚 {isLoadingAuth ? "Attendere..." : "Accedi con Google"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--surface-light)" }}></div>
        <span style={{ fontSize: "0.8rem", color: "var(--gray-dim)", fontWeight: "600" }}>OPPURE CON EMAIL</span>
        <div style={{ flex: 1, height: "1px", background: "var(--surface-light)" }}></div>
      </div>

      {/* Error & Success feedback badges */}
      {authError && (
        <div style={{ background: "#fee2e2", border: "2px solid #ef4444", color: "#b91c1c", padding: "12px 14px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "700", marginBottom: "16px" }}>
          {authError}
        </div>
      )}
      {authSuccess && (
        <div style={{ background: "#dcfce7", border: "2px solid #22c55e", color: "#15803d", padding: "12px 14px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "800", marginBottom: "16px" }}>
          {authSuccess}
        </div>
      )}

      <div className="form-group">
        <label>Email Access</label>
        <input
          type="email"
          className="input-dark"
          placeholder="pro@level.com"
          value={formData.email}
          onChange={(e) => { updateFormData({ email: e.target.value }); haptic.selection(); }}
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          className="input-dark"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => updateFormData({ password: e.target.value })}
        />
      </div>

      {/* Pulsante dedicato al Login / Registrazione Email */}
      <button
        type="button"
        onClick={handleEmailAuth}
        disabled={isLoadingAuth}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "14px",
          background: authMode === "login" ? "#111" : "var(--primary)",
          color: "#fff",
          border: "2px solid #111",
          fontWeight: "900",
          fontSize: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          cursor: "pointer",
          marginBottom: "28px"
        }}
      >
        {isLoadingAuth ? "Elaborazione..." : authMode === "login" ? "Accedi con Email" : "Registrati e Prosegui"}
      </button>

      {authMode === "register" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>First Name</label>
              <input
                type="text"
                className="input-dark"
                placeholder="E.g. Eden"
                value={formData.firstName}
                onChange={(e) => { updateFormData({ firstName: e.target.value }); haptic.light(); }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Last Name</label>
              <input
                type="text"
                className="input-dark"
                placeholder="E.g. Hazard"
                value={formData.lastName}
                onChange={(e) => { updateFormData({ lastName: e.target.value }); haptic.light(); }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "16px" }}>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Birth Date</span>
              <span className="anim-spring-pop" key={calculateAge(formData.birthDate)} style={{ color: "var(--primary)", fontWeight: "800", fontSize: "1.1rem" }}>
                {calculateAge(formData.birthDate) !== "--" ? `${calculateAge(formData.birthDate)} yrs` : "-- yrs"}
              </span>
            </label>
            <input
              type="date"
              className="input-dark"
              value={formData.birthDate}
              onChange={(e) => { updateFormData({ birthDate: e.target.value }); haptic.light(); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

