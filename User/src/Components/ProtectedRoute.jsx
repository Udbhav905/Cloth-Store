import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../store/Useauthstore";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, openAuthModal } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) {
      openAuthModal("login");
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) return <Navigate to="/" replace />;
  return children;
}