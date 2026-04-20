/**
 * Authentication Context
 * Manages user state, token storage, login/logout
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { api, TOKEN_KEY } from "./api";
import type { User, LoginCredentials, LoginResponse, AuthMeResponse } from "./types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check for stored token on app launch
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!storedToken) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Validate token with server
      const { data } = await api.get<AuthMeResponse>("/api/auth/me");
      setState({
        user: data.user,
        token: storedToken,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      // Token expired or invalid
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/api/auth/login", credentials);

    // Store token securely
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);

    setState({
      user: data.user,
      token: data.token,
      isLoading: false,
      isAuthenticated: true,
    });

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
