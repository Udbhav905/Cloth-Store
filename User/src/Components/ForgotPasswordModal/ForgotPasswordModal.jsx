import { useState } from "react";
import styles from "../Authmodal/AuthModal.module.css";

export default function ForgotPasswordModal({ onClose, onBackToLogin }) {
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
      
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setMessage(data.message);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.forgotModalContainer}>
      <button className={styles.closeBtn} onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
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
                    name="email"
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
                  <span>Send Reset Instructions</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

            <button type="button" className={styles.backBtn} onClick={onBackToLogin}>
              ← Back to Sign In
            </button>
          </form>
        ) : (
          <div className={styles.successBox}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
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