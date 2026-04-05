/* App.jsx — ADMIN */
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login      from "./Components/Login/Login";
import Dashboard  from "./Components/Dashboard/Dashboard";
import Categories from "./Components/Categories/Categories";
import Analytics from "./Components/Analytics/Analytics";

import Products   from "./Components/Products/Products";
import Orders     from "./Components/Order/Order";
import { ADMIN_USER_KEY, ADMIN_TOKEN_KEY, clearAdminSession, getAdminToken } from "./utils/Adminapi";
import "./App.css";
import AppLayout from "./Components/Applayout/Applayout";
import DeliveryPartner from "../src/Components/DeliveryPartner/DeliveryPartner";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user,            setUser]            = useState(null);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    try {
      const raw   = localStorage.getItem(ADMIN_USER_KEY);
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (raw && token) {
        const parsed = JSON.parse(raw);
        if (parsed?.role === "admin" || parsed?.role === "superadmin") {
          setUser(parsed);
          setIsAuthenticated(true);
        } else {
          clearAdminSession();
        }
      }
    } catch { clearAdminSession(); }
    finally  { setLoading(false); }
  }, []);

  const handleLogin  = (u)  => { setUser(u); setIsAuthenticated(true); };
  const handleLogout = async () => {
    try {
      const token = getAdminToken();
      await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
    } catch (_) {}
    clearAdminSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) return (
    <div className="loadingContainer">
      <div className="luxLoader"/>
      <p className="loadingText">Maison Luxuria</p>
    </div>
  );

  const Protected = ({ children }) =>
    isAuthenticated
      ? <AppLayout user={user} onLogout={handleLogout}>{children}</AppLayout>
      : <Navigate to="/login" replace/>;

  const Soon = ({ label }) => (
    <div style={{ padding:"40px 60px", color:"#f5f0e8", fontFamily:"Cormorant Garamond,serif", fontSize:"1.5rem", fontStyle:"italic" }}>
      {label} — coming soon
    </div>
  );

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace/> : <Login onLogin={handleLogin}/>}/>
          <Route path="/dashboard/*" element={<Protected><Dashboard user={user} onLogout={handleLogout}/></Protected>}/>
          <Route path="/categories"  element={<Protected><Categories/></Protected>}/>
          <Route path="/products"    element={<Protected><Products/></Protected>}/>
          <Route path="/orders"      element={<Protected><Orders/></Protected>}/>
          <Route path="/delivery-partners" element={<Protected><DeliveryPartner /></Protected>}/>
          <Route path="/analytics"   element={<Protected><Analytics/></Protected>}/>
          <Route path="/"            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace/>}/>
          <Route path="*"            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace/>}/>
        </Routes>
      </div>
    </Router>
  );
}
export default App;