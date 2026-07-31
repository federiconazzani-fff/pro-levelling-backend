import { useEffect } from "react";
import { haptic } from "@/utils/haptics";
import { auth } from "@/utils/firebase";
import { signInWithPopup, signInWithCredential, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

export default function Step1Identity({ formData, updateFormData, onNext }) {
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result && result.user) {
        const user = result.user;
        const nameParts = user.displayName ? user.displayName.split(" ") : ["", ""];
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        updateFormData({
          email: user.email || "",
          firstName: firstName,
          lastName: lastName,
          birthDate: formData.birthDate || "2000-01-01"
        });
        setTimeout(() => onNext(), 500);
      }
    }).catch((error) => {
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
    if (providerName === "Google") {
      try {
        try {
          if (Capacitor.isNativePlatform()) {
            GoogleAuth.initialize({
              clientId: "986409597877-qkkal2gkvo6dv9dr6k78sut6rm852juk.apps.googleusercontent.com",
              scopes: ["profile", "email"],
            });
            const googleUser = await GoogleAuth.signIn();
            const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
            const result = await signInWithCredential(auth, credential);
            if (result && result.user) {
              const user = result.user;
              const nameParts = user.displayName ? user.displayName.split(" ") : ["", ""];
              updateFormData({
                email: user.email || "",
                firstName: nameParts[0] || "",
                lastName: nameParts.slice(1).join(" ") || "",
                birthDate: formData.birthDate || "2000-01-01"
              });
              setTimeout(() => onNext(), 500);
            }
          } else {
            throw new Error("Web fallback");
          }
        } catch (nativeError) {
          console.warn("Native Google auth fallback to popup", nativeError);
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          if (result && result.user) {
            const user = result.user;
            const nameParts = user.displayName ? user.displayName.split(" ") : ["", ""];
            updateFormData({
              email: user.email || "",
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
              birthDate: formData.birthDate || "2000-01-01"
            });
            setTimeout(() => onNext(), 500);
          }
        }
      } catch (error) {
        console.error("Google login init error", error);
        if (error.code !== "auth/popup-closed-by-user") {
          alert("Errore di inizializzazione login con Google: " + (error.message || JSON.stringify(error)));
        }
      }
    }
  };

  return (
    <div className="page-wrapper">
      {/* Brand Eye-Catcher */}
      <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "6px", background: "var(--primary)", borderRadius: "3px" }}></div>
        <span style={{ fontSize: "0.75rem", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gray-dim)" }}>Season 2025/26</span>
      </div>

      <h2 style={{ fontSize: "3rem", lineHeight: "1", fontWeight: "900", marginBottom: "16px" }}>
        WELCOME TO <span className="brush-highlight">Pro.levelling</span>
      </h2>
      <p style={{ marginBottom: "40px", fontSize: "1.05rem", color: "var(--gray-dim)", lineHeight: "1.5" }}>
        Build your elite identity. Every champion starts here.
      </p>

      {/* Social Login */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
        <button
          className="btn-secondary pseudo-haptic"
          onClick={() => handleSocialLogin("Google")}
          style={{ flex: 1, border: "2px solid var(--surface-light)", background: "#fff", fontWeight: "700", gap: "8px" }}
        >
          𝗚 Google
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--surface-light)" }}></div>
        <span style={{ fontSize: "0.8rem", color: "var(--gray-dim)", fontWeight: "600" }}>OR MANUAL</span>
        <div style={{ flex: 1, height: "1px", background: "var(--surface-light)" }}></div>
      </div>

      <div className="form-group">
        <label>Email Access</label>
        <input type="email" className="input-dark" placeholder="pro@level.com"
          value={formData.email} onChange={(e) => { updateFormData({ email: e.target.value }); haptic.selection(); }} />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input type="password" className="input-dark" placeholder="••••••••"
          value={formData.password} onChange={(e) => updateFormData({ password: e.target.value })} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>First Name</label>
          <input type="text" className="input-dark" placeholder="E.g. Eden"
            value={formData.firstName} onChange={(e) => { updateFormData({ firstName: e.target.value }); haptic.light(); }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Last Name</label>
          <input type="text" className="input-dark" placeholder="E.g. Hazard"
            value={formData.lastName} onChange={(e) => { updateFormData({ lastName: e.target.value }); haptic.light(); }} />
        </div>
      </div>

      <div className="form-group">
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Birth Date</span>
          <span className="anim-spring-pop" key={calculateAge(formData.birthDate)} style={{ color: "var(--primary)", fontWeight: "800", fontSize: "1.1rem" }}>
            {calculateAge(formData.birthDate) !== "--" ? `${calculateAge(formData.birthDate)} yrs` : "-- yrs"}
          </span>
        </label>
        <input type="date" className="input-dark"
          value={formData.birthDate} onChange={(e) => { updateFormData({ birthDate: e.target.value }); haptic.light(); }} />
      </div>
    </div>
  );
}
