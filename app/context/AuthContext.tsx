'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'pharmacist' | 'physician' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from sessionStorage or localStorage)
    const storedUser = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to restore user session:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      // In production, this would call your backend
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock authentication
      const mockUsers: { [key: string]: { password: string; user: User } } = {
        'pharmacist@datadose.ai': {
          password: 'password123',
          user: {
            id: '1',
            email: 'pharmacist@datadose.ai',
            name: 'John Smith',
            role: 'pharmacist',
            organization: 'Metro Hospital',
          },
        },
        'physician@datadose.ai': {
          password: 'password123',
          user: {
            id: '2',
            email: 'physician@datadose.ai',
            name: 'Dr. Sarah Johnson',
            role: 'physician',
            organization: 'Metro Hospital',
          },
        },
        'admin@datadose.ai': {
          password: 'password123',
          user: {
            id: '3',
            email: 'admin@datadose.ai',
            name: 'Alice Brown',
            role: 'admin',
            organization: 'Metro Hospital',
          },
        },
        'superadmin@datadose.ai': {
          password: 'password123',
          user: {
            id: '4',
            email: 'superadmin@datadose.ai',
            name: 'David Wilson',
            role: 'super_admin',
            organization: 'DataDose',
          },
        },
      };

      const userCredentials = mockUsers[email.toLowerCase()];

      if (!userCredentials || userCredentials.password !== password) {
        throw new Error('Invalid email or password');
      }

      setUser(userCredentials.user);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user', JSON.stringify(userCredentials.user));
      }
    } catch (error) {
      setUser(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('user');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
