import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    if (!decoded || !decoded.exp) return false;
    return Date.now() < decoded.exp * 1000;
  } catch (error) {
    console.error("Token không hợp lệ:", error);
    return false;
  }
};

function AuthProviderWrapper({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      return token && isTokenValid(token) ? jwtDecode(token) : null;
    } catch {
      return null;
    }
  });

  const logout = (silent = false) => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    if (!silent) navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleTokenExpired = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      navigate("/", { replace: true });
    };

    window.addEventListener("tokenExpired", handleTokenExpired);

    return () => {
      window.removeEventListener("tokenExpired", handleTokenExpired);
    };
  }, [navigate]);
  return (
    <AuthContext.Provider value={{ token, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function AuthProvider({ children }) {
  return <AuthProviderWrapper>{children}</AuthProviderWrapper>;
}

export const useAuth = () => useContext(AuthContext);