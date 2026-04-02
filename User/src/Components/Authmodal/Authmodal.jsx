import { useState, useEffect, useRef } from "react";
import useAuthStore from "../../store/Useauthstore";
import styles from "./AuthModal.module.css";

/* ─────────────────────────────────────────────
   INPUT FIELD
───────────────────────────────────────────── */
function Field({ label, type = "text", name, value, onChange, required, icon }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={`${styles.field} ${focused || value ? styles.fieldActive : ""}`}>
      <div className={styles.fieldWrap}>
        {icon && <span className={styles.fieldIcon}>{icon}</span>}
        
        <div className={styles.inputBox}>
          <input
            className={styles.fieldInput}
            type={isPassword && show ? "text" : type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete={isPassword ? "current-password" : "on"}
            placeholder=" "
          />
          <label className={styles.floatingLabel}>{label}</label>
        </div>

        {isPassword && (
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShow((p) => !p)}
            tabIndex={-1}
            aria-label="Toggle Password Visibility"
          >
            {show ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOGIN FORM
───────────────────────────────────────────── */
function LoginForm({ onSwitch }) {
  const { login, loading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });

  const onChange = (e) => {
    clearError();
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await login(form);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <Field
        label="Email Address"
        type="email"
        name="email"
        value={form.email}
        onChange={onChange}
        required
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        }
      />
      <Field
        label="Password"
        type="password"
        name="password"
        value={form.password}
        onChange={onChange}
        required
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        }
      />

      {error && (
        <div className={styles.errorBox}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? (
          <span className={styles.spinner} />
        ) : (
          <>
            <span>Sign In</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </>
        )}
      </button>

      <p className={styles.switchText}>
        New to LUXURIA?{" "}
        <button type="button" className={styles.switchBtn} onClick={onSwitch}>
          Create Account
        </button>
      </p>
    </form>
  );
}

/* ─────────────────────────────────────────────
   REGISTER FORM
───────────────────────────────────────────── */
function RegisterForm({ onSwitch }) {
  const { register, loading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", mobileNo: "", password: "" });

  const onChange = (e) => {
    clearError();
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await register(form);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <Field
        label="Full Name"
        type="text"
        name="name"
        value={form.name}
        onChange={onChange}
        required
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        }
      />
      <Field
        label="Email Address"
        type="email"
        name="email"
        value={form.email}
        onChange={onChange}
        required
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        }
      />
      <Field
        label="Mobile Number"
        type="tel"
        name="mobileNo"
        value={form.mobileNo}
        onChange={onChange}
        required
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        }
      />
      <Field
        label="Password"
        type="password"
        name="password"
        value={form.password}
        onChange={onChange}
        required
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        }
      />

      {error && (
        <div className={styles.errorBox}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? (
          <span className={styles.spinner} />
        ) : (
          <>
            <span>Create Account</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </>
        )}
      </button>

      <p className={styles.switchText}>
        Already a member?{" "}
        <button type="button" className={styles.switchBtn} onClick={onSwitch}>
          Sign In
        </button>
      </p>
    </form>
  );
}

/* ─────────────────────────────────────────────
   MAIN MODAL
───────────────────────────────────────────── */
export default function AuthModal() {
  const { authModal, authTab, closeAuthModal, setAuthTab } = useAuthStore();
  const overlayRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  /* Animate in */
  useEffect(() => {
    if (authModal) {
      setTimeout(() => setMounted(true), 10);
      document.body.style.overflow = "hidden";
    } else {
      setMounted(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [authModal]);

  /* ESC key closes */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") closeAuthModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeAuthModal]);

  if (!authModal) return null;

  const isLogin = authTab === "login";

  return (
    <div
      className={`${styles.overlay} ${mounted ? styles.overlayVisible : ""}`}
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && closeAuthModal()}
      role="dialog"
      aria-modal="true"
      aria-label="Sign In"
    >
      <div className={`${styles.modal} ${mounted ? styles.modalVisible : ""}`}>

        {/* ── Left panel — editorial image side ── */}
        <div className={styles.leftPanel}>
          <div className={styles.leftBg} />
          <div className={styles.leftOverlay} />
          <div className={styles.leftContent}>
            <span className={styles.leftEyebrow}>LUXURIA</span>
            <h2 className={styles.leftTitle}>
              {isLogin ? (
                <>Welcome<br /><em>Back</em></>
              ) : (
                <>Join the<br /><em>Inner Circle</em></>
              )}
            </h2>
            <p className={styles.leftDesc}>
              {isLogin
                ? "Sign in to access your exclusive member benefits, saved pieces, and order history."
                : "Become a LUXURIA member for first access to new collections, private sales, and invitations."}
            </p>
            {/* Perks */}
            <div className={styles.perks}>
              {["Free Global Shipping", "Early Collection Access", "Dedicated Concierge"].map((p) => (
                <div key={p} className={styles.perk}>
                  <span className={styles.perkDot}>◆</span>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div className={styles.rightPanel}>
          {/* Close button */}
          <button className={styles.closeBtn} onClick={closeAuthModal} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${isLogin ? styles.tabActive : ""}`}
              onClick={() => setAuthTab("login")}
            >
              Sign In
            </button>
            <button
              className={`${styles.tab} ${!isLogin ? styles.tabActive : ""}`}
              onClick={() => setAuthTab("register")}
            >
              Register
            </button>
            <span
              className={styles.tabIndicator}
              style={{ transform: `translateX(${isLogin ? "0%" : "100%"})` }}
            />
          </div>

          {/* Heading */}
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>
              {isLogin ? "Sign In" : "Create Account"}
            </h3>
            <p className={styles.formSub}>
              {isLogin
                ? "Enter your credentials to continue"
                : "Fill in your details to get started"}
            </p>
          </div>

          {/* Forms with cross-fade */}
          <div className={styles.formArea}>
            <div className={`${styles.formSlide} ${isLogin ? styles.formSlideActive : styles.formSlideHidden}`}>
              <LoginForm onSwitch={() => setAuthTab("register")} />
            </div>
            <div className={`${styles.formSlide} ${!isLogin ? styles.formSlideActive : styles.formSlideHidden}`}>
              <RegisterForm onSwitch={() => setAuthTab("login")} />
            </div>
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or continue with</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Social buttons */}
          <div className={styles.socials}>
            {[
              {
                name: "Google",
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                ),
              },
            ].map((s) => (
              <button key={s.name} className={styles.socialBtn} type="button">
                <span className={styles.socialIcon}>{s.icon}</span>
                <span>Continue</span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}