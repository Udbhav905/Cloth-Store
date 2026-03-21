import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        credentials: 'include',
      });

      const data = await response.json();

      // ── Debug helper (remove in production) ──────────────────────────
      console.log('Login response:', data);
      // ─────────────────────────────────────────────────────────────────

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // The controller returns { user: { _id, name, email, role }, token }
      // So we read from data.user, not data directly
      const user = data.user;

      if (!user) {
        throw new Error('Unexpected response from server');
      }

      if (user.role !== 'admin' && user.role !== 'superadmin') {
        throw new Error('Unauthorized: Admin access only');
      }

      // Persist user info and token
      localStorage.setItem('admin', JSON.stringify({
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      }));

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      onLogin(user);
      navigate('/dashboard');

    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>

        {/* ── Logo Section ── */}
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C9.5 3 7.5 5 7.5 7.5C7.5 10 9.5 12 12 12C14.5 12 16.5 10 16.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 12V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 15L12 12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.5 7.5H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className={styles.brandName}>Luxuria</h1>
          <p className={styles.brandTagline}>Admin Atelier</p>
        </div>

        {/* ── Form Section ── */}
        <form onSubmit={handleSubmit} className={styles.formSection}>
          <h2 className={styles.welcomeText}>Welcome Back</h2>
          <p className={styles.subText}>Sign in to your atelier</p>

          <div className={styles.inputGroup}>
            {/* Email */}
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9L12 14L21 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={credentials.email}
                onChange={handleChange}
                className={styles.input}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 11V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
              </svg>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
                className={styles.input}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorMessage}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className={styles.loginButton} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className={styles.loader} />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Enter Atelier</span>
            )}
          </button>

          <div className={styles.forgotPassword}>
            <a href="/forgot-password">Forgot Password?</a>
          </div>
        </form>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <p>Authorised Access Only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;