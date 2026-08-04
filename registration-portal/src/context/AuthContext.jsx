import { createContext, useContext, useState, useCallback } from "react";
import { apiPost } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("portal_token"));
  const [operator, setOperator] = useState(() => {
    const raw = localStorage.getItem("portal_operator");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (phone, password) => {
    const data = await apiPost("/api/asha/auth/login", { phone, password });
    setToken(data.token);
    setOperator(data.asha);
    localStorage.setItem("portal_token", data.token);
    localStorage.setItem("portal_operator", JSON.stringify(data.asha));
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setOperator(null);
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_operator");
  }, []);

  return (
    <AuthContext.Provider value={{ token, operator, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
