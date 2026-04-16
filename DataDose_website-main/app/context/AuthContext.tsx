'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { SessionProvider, useSession, signOut, signIn } from 'next-auth/react';

export type UserRole = 'PHARMACIST' | 'PHYSICIAN' | 'ADMIN' | 'SUPER_ADMIN';

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

function AuthContextInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  
  const isLoading = status === 'loading';
  const user = (session?.user as any) || null;

  const login = async (email: string, password: string) => {
    // NextAuth signIn handles credentials. 
    // Actual login form uses signIn directly for better error handling, but we keep this signature for the interface.
    await signIn('credentials', { email, password, callbackUrl: '/dashboard' });
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/login' });
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

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
