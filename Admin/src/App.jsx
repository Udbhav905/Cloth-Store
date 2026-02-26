import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./Components/Login/Login";
import Dashboard from "./Components/Dashboard/Dashboard";
import Categories from "./Components/Categories/Categories";
import AppLayout from "./Components/AppLayout/AppLayout";
import "./App.css";
import Products from "./Components/Products/Products";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("admin");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {}
    localStorage.removeItem("admin");
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="loadingContainer">
        <div className="luxLoader" />
        <p className="loadingText">Maison Luxuria</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          {/* Protected — all routes share the same layout */}
          <Route
            path="/dashboard/*"
            element={
              isAuthenticated ? (
                <AppLayout user={user} onLogout={handleLogout}>
                  <Dashboard user={user} onLogout={handleLogout} />
                </AppLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/categories"
            element={
              isAuthenticated ? (
                <AppLayout user={user} onLogout={handleLogout}>
                  <Categories />
                </AppLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/products"
            element={
              isAuthenticated ? (
                <AppLayout user={user} onLogout={handleLogout}>
                  {<Products />}
                </AppLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/orders"
            element={
              isAuthenticated ? (
                <AppLayout user={user} onLogout={handleLogout}>
                  <div
                    style={{
                      padding: "40px 60px",
                      color: "#f5f0e8",
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "1.5rem",
                      fontStyle: "italic",
                    }}
                  >
                    Orders — coming soon
                  </div>
                </AppLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/delivery-partners"
            element={
              isAuthenticated ? (
                <AppLayout user={user} onLogout={handleLogout}>
                  <div
                    style={{
                      padding: "40px 60px",
                      color: "#f5f0e8",
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "1.5rem",
                      fontStyle: "italic",
                    }}
                  >
                    Delivery Partners — coming soon
                  </div>
                </AppLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/analytics"
            element={
              isAuthenticated ? (
                <AppLayout user={user} onLogout={handleLogout}>
                  <div
                    style={{
                      padding: "40px 60px",
                      color: "#f5f0e8",
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "1.5rem",
                      fontStyle: "italic",
                    }}
                  >
                    Analytics — coming soon
                  </div>
                </AppLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
