'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, getApiUrl } from '@/lib/api';
import { decodeJwtPayload } from '@/lib/jwt';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = apiClient.getToken();
    if (!token) return;
    try {
      const res = await fetch(getApiUrl('/api/v1/auth/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json?.data) {
        setUser(prev => ({
          id: json.data.id || prev?.id || '',
          email: json.data.email || prev?.email || '',
          full_name: json.data.full_name || prev?.full_name,
          role: json.data.role || prev?.role || 'Administrator',
          avatar_url: json.data.avatar_url || undefined,
        }));
      }
    } catch {}
  };

  const updateUser = (updated: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updated } : null);
  };

  useEffect(() => {
    // Attempt to hydrate user from token on initial load
    const initializeAuth = async () => {
      const token = apiClient.getToken();
      if (token) {
        const payload = decodeJwtPayload<Record<string, any>>(token);
        if (payload) {
          const initialUser: User = { 
            id: payload.sub || '', 
            email: payload.email || '', 
            full_name: payload.full_name || '',
            role: payload.role || 'Administrator' 
          };
          setUser(initialUser);

          // Fetch full profile from /api/v1/auth/me to get real name, verified role, and avatar_url
          fetch(getApiUrl('/api/v1/auth/me'), {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(json => {
              if (json?.data) {
                setUser({
                  id: json.data.id || initialUser.id,
                  email: json.data.email || initialUser.email,
                  full_name: json.data.full_name || initialUser.full_name,
                  role: json.data.role || initialUser.role,
                  avatar_url: json.data.avatar_url || undefined,
                });
              }
            })
            .catch(() => {});
        } else {
          apiClient.clearToken();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (token: string, user: User) => {
    apiClient.setToken(token);
    setUser(user);
    fetch(getApiUrl('/api/v1/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  full_name: json.data.full_name || prev.full_name,
                  role: json.data.role || prev.role,
                  avatar_url: json.data.avatar_url || prev.avatar_url,
                }
              : prev
          );
        }
      })
      .catch(() => {});
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
