import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',  
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
        credentials: 'include' // Important for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("--------->",response);
        throw new Error(data.message || 'Login failed');
      }

      // Check if user has admin role (optional - based on your requirements)
      if (data.role !== 'admin' && data.role !== 'superadmin') {
        throw new Error('Unauthorized: Admin access only');
      }

      // Store user data in localStorage or context if needed
      localStorage.setItem('admin', JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      }));
      
      // Store token if needed (though it's in HTTP-only cookie)
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Call the onLogin callback from parent
      onLogin(data);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (err) {
      console.log("--------err",err);
      setError(err.message || 'Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="6" r="2" fill="currentColor"/>
              <circle cx="18" cy="12" r="2" fill="currentColor"/>
              <circle cx="18" cy="18" r="2" fill="currentColor"/>
            </svg>
          </div>
          <h1 className={styles.brandName}>ClothStore</h1>
          <p className={styles.brandTagline}>Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formSection}>
          <h2 className={styles.welcomeText}>Welcome Back</h2>
          <p className={styles.subText}>Please login to your account</p>
      
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M5 20V19C5 15.6863 7.68629 13 11 13H13C16.3137 13 19 15.6863 19 19V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 11V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V11" stroke="currentColor" strokeWidth="2"/>
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

          {error && (
            <div className={styles.errorMessage}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.loader}></span>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className={styles.forgotPassword}>
            <a href="/forgot-password">Forgot Password?</a>
          </div>
        </form>

        <div className={styles.footer}>
          <p>Admin access only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;