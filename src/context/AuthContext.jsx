import React, { createContext, useEffect, useState } from "react";
import {
  getAccessToken,
  setAccessToken,
  clearTokens,
} from "@/utils/tokenStorage";
import authService from "@/services/authService";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verifica si hay token al iniciar
  useEffect(() => {
    let timedOut = false;
    const guard = setTimeout(() => {
      timedOut = true;
      setIsLoading(false);
    }, 3000);

    (async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
      }
      try {
        const profile = await authService.getProfile();
        setUser(profile);
        setIsAuthenticated(true);
      } catch (e) {
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        console.error("Auth init failed:", e?.message || e);
      } finally {
        if (!timedOut) setIsLoading(false);
        clearTimeout(guard);
      }
    })();

    return () => clearTimeout(guard);
  }, []);

  // LOGIN
  const login = async (dni, password) => {
    try {
      const data = await authService.login(dni, password);
      const token = data?.token;
      const profile =
        data?.user ??
        (token
          ? (setAccessToken(token), await authService.getProfile())
          : null);

      if (!token || !profile) throw new Error("Credenciales inválidas");

      setAccessToken(token);
      setUser(profile);
      setIsAuthenticated(true);

      return { success: true, user: profile };
    } catch (error) {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      console.error("Login failed:", error?.message || error);
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Error de inicio de sesión",
        errorData: error?.response?.data ?? null,
      };
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error?.message || error);
    } finally {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Actualizar perfil del usuario en memoria
  const updateUser = (userData) =>
    setUser((prev) => ({ ...(prev || {}), ...(userData || {}) }));

  const value = { user, isLoading, isAuthenticated, login, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="min-h-dvh flex items-center justify-center bg-[var(--ui-bg)] text-[var(--ui-ink)]">
          <div className="size-12 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
