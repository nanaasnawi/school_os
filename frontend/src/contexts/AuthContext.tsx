'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt to hydrate user from token on initial load
    const initializeAuth = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          // Decode the JWT to get basic user info
          const payloadBase64 = token.split('.')[1];
          const payloadJson = atob(payloadBase64);
          const payload = JSON.parse(payloadJson);
          
          const initialUser: User = { 
            id: payload.sub, 
            email: payload.email || '', 
            full_name: payload.full_name || '',
            role: payload.role || 'Administrator' 
          };
          setUser(initialUser);

          // Fetch full profile from /api/v1/auth/me to get real name if token didn't contain it
          fetch('http://localhost:8000/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(json => {
              if (json?.data?.full_name) {
                setUser({
                  id: json.data.id || initialUser.id,
                  email: json.data.email || initialUser.email,
                  full_name: json.data.full_name,
                  role: json.data.role || initialUser.role,
                });
              }
            })
            .catch(() => {});
        } catch {
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
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
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
