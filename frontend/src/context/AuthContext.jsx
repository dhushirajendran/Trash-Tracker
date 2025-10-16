import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveAuth = (token, userObj) => {
    localStorage.setItem("tt_token", token);
    setUser(userObj);
  };

  const clearAuth = () => {
    localStorage.removeItem("tt_token");
    setUser(null);
  };

  const login = async (email, password) => {
    const r = await api.post("/api/auth/login", { email, password });
    saveAuth(r.token, r.user);
  };

  const register = async (name, email, password, role, adminCode) => {
    const r = await api.post("/api/auth/register", { name, email, password, role, adminCode });
    saveAuth(r.token, r.user);
  };

  useEffect(() => {
    const token = localStorage.getItem("tt_token");
    if (!token) { setLoading(false); return; }
    api.get("/api/auth/me")
      .then(r => setUser(r.user))
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout: clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
