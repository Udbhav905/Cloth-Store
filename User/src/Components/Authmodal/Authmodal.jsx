import { useState, useEffect, useRef } from "react";
import useAuthStore from "../../store/Useauthstore";
import styles from "./AuthModal.module.css";

/* ─────────────────────────────────────────────
   ICON COMPONENT (Responsive)
───────────────────────────────────────────── */
function Icon({ children, size = 18, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      style={{ width: size, height: size }}
    >
      {children}
    </svg>
  );
}

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
          <button type="button" className={styles.eyeBtn} onClick={() => setShow((p) => !p)} tabIndex={-1}>
            {show ? (
              <Icon size={18}>
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              </Icon>
            ) : (
              <Icon size={18}>
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              </Icon>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FORGOT PASSWORD MODAL
───────────────────────────────────────────── */
function ForgotPasswordModalContent({ onClose, onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");
      setMessage(data.message);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.forgotContainer}>
      <button className={styles.closeBtn} onClick={onClose}>
        <Icon size={18}>
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        </Icon>
      </button>

      <div className={styles.forgotContent}>
        <div className={styles.forgotHeader}>
          <h3>Reset Password</h3>
          <p>Enter your email address and we'll send you instructions to reset your password.</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className={styles.forgotForm}>
            <div className={styles.field}>
              <div className={styles.fieldWrap}>
                <div className={styles.inputBox}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder=" "
                    className={styles.fieldInput}
                  />
                  <label className={styles.floatingLabel}>Email Address</label>
                </div>
              </div>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : "Send Reset Instructions"}
            </button>

            <button type="button" className={styles.backBtn} onClick={onBackToLogin}>
              ← Back to Sign In
            </button>
          </form>
        ) : (
          <div className={styles.successBox}>
            <Icon size={48}>
              <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </>
            </Icon>
            <p>{message}</p>
            <button className={styles.submitBtn} onClick={onBackToLogin}>
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOGIN FORM
───────────────────────────────────────────── */
function LoginForm({ onSwitch, onForgotPassword }) {
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
          <Icon size={18}>
            <>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </>
          </Icon>
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
          <Icon size={18}>
            <>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </>
          </Icon>
        }
      />

      <button type="button" className={styles.forgotPasswordBtn} onClick={onForgotPassword}>
        Forgot Password?
      </button>

      {error && <div className={styles.errorBox}>{error}</div>}

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? <span className={styles.spinner} /> : "Sign In"}
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
          <Icon size={18}>
            <>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="3" />
            </>
          </Icon>
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
          <Icon size={18}>
            <>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </>
          </Icon>
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
          <Icon size={18}>
            <>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </>
          </Icon>
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
          <Icon size={18}>
            <>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </>
          </Icon>
        }
      />

      {error && <div className={styles.errorBox}>{error}</div>}

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? <span className={styles.spinner} /> : "Create Account"}
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
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (authModal) {
      setTimeout(() => setMounted(true), 10);
      document.body.style.overflow = "hidden";
    } else {
      setMounted(false);
      document.body.style.overflow = "";
      setShowForgot(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [authModal]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (showForgot) setShowForgot(false);
        else closeAuthModal();
      }
    };
    if (authModal) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [authModal, closeAuthModal, showForgot]);

  if (!authModal) return null;

  const isLogin = authTab === "login";

  if (showForgot) {
    return (
      <div className={`${styles.overlay} ${mounted ? styles.overlayVisible : ""}`} ref={overlayRef}>
        <ForgotPasswordModalContent
          onClose={() => { setShowForgot(false); closeAuthModal(); }}
          onBackToLogin={() => { setShowForgot(false); setAuthTab("login"); }}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.overlay} ${mounted ? styles.overlayVisible : ""}`} ref={overlayRef}>
      <div className={`${styles.modal} ${mounted ? styles.modalVisible : ""}`}>
        <div className={styles.leftPanel}>
          <div className={styles.leftBg} />
          <div className={styles.leftOverlay} />
          <div className={styles.leftContent}>
            <span className={styles.leftEyebrow}>LUXURIA</span>
            <h2 className={styles.leftTitle}>
              {isLogin ? <>Welcome<br /><em>Back</em></> : <>Join the<br /><em>Inner Circle</em></>}
            </h2>
            <p className={styles.leftDesc}>
              {isLogin
                ? "Sign in to access your exclusive member benefits, saved pieces, and order history."
                : "Become a LUXURIA member for first access to new collections, private sales, and invitations."}
            </p>
            <div className={styles.perks}>
              {["Free Global Shipping", "Early Collection Access", "Dedicated Concierge"].map((p) => (
                <div key={p} className={styles.perk}><span className={styles.perkDot}>◆</span>{p}</div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <button className={styles.closeBtn} onClick={closeAuthModal}>
            <Icon size={18}>
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            </Icon>
          </button>

          <div className={styles.tabs}>
            <button className={`${styles.tab} ${isLogin ? styles.tabActive : ""}`} onClick={() => setAuthTab("login")}>
              Sign In
            </button>
            <button className={`${styles.tab} ${!isLogin ? styles.tabActive : ""}`} onClick={() => setAuthTab("register")}>
              Register
            </button>
            <span className={styles.tabIndicator} style={{ transform: `translateX(${isLogin ? "0%" : "100%"})` }} />
          </div>

          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>{isLogin ? "Sign In" : "Create Account"}</h3>
            <p className={styles.formSub}>
              {isLogin ? "Enter your credentials to continue" : "Fill in your details to get started"}
            </p>
          </div>

          <div className={styles.formArea}>
            <div className={`${styles.formSlide} ${isLogin ? styles.formSlideActive : styles.formSlideHidden}`}>
              <LoginForm onSwitch={() => setAuthTab("register")} onForgotPassword={() => setShowForgot(true)} />
            </div>
            <div className={`${styles.formSlide} ${!isLogin ? styles.formSlideActive : styles.formSlideHidden}`}>
              <RegisterForm onSwitch={() => setAuthTab("login")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}