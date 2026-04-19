/* Components/Login/Login.jsx — ADMIN */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_USER_KEY, ADMIN_TOKEN_KEY } from "../../utils/Adminapi";
import styles from "./Login.module.css";

const Login = ({ onLogin }) => {
  const [creds,     setCreds]     = useState({ email: "", password: "" });
  const [error,     setError]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCreds(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res  = await fetch("http://localhost:3000/api/auth/login", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ email: creds.email, password: creds.password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      /* Flexible extraction */
      const user  = data?.user ?? data?.data?.user ?? (data?._id ? data : null);
      const token = data?.token ?? data?.accessToken ?? data?.data?.token ?? data?.data?.accessToken ?? null;

      if (!user)  throw new Error("Unexpected server response — no user returned");
      if (user.role !== "admin" && user.role !== "superadmin")
        throw new Error("Unauthorized: Admin access only");

      const payload = { _id: user._id, name: user.name, email: user.email, role: user.role };
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(payload));
      if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);

      onLogin(payload);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none">
              <path d="M12 3C9.5 3 7.5 5 7.5 7.5C7.5 10 9.5 12 12 12C14.5 12 16.5 10 16.5 7.5"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 12V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 15L12 12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.5 7.5H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className={styles.brandName}>Luxuria</h1>
          <p className={styles.brandTagline}>Admin Atelier</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formSection} noValidate>
          <h2 className={styles.welcomeText}>Welcome Back</h2>
          <p className={styles.subText}>Sign in to your atelier</p>

          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9L12 14L21 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input type="email" name="email" placeholder="Email Address"
                value={creds.email} onChange={handleChange}
                className={styles.input} required autoComplete="email"/>
            </div>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 11V8C8 5.79 9.79 4 12 4C14.21 4 16 5.79 16 8V11"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
              </svg>
              <input type="password" name="password" placeholder="Password"
                value={creds.password} onChange={handleChange}
                className={styles.input} required autoComplete="current-password"/>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className={styles.loginButton} disabled={isLoading}>
            {isLoading ? (<><span className={styles.loader}/><span>Signing in…</span></>) : <span>Enter Atelier</span>}
          </button>
          {/* <div className={styles.forgotPassword}><a href="/forgot-password">Forgot Password?</a></div> */}
        </form>
        <div className={styles.footer}><p>Authorised Access Only</p></div>
      </div>
    </div>
  );
};
export default Login;