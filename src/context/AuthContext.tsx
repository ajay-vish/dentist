'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { IDoctor } from '@/models/Doctor'; // Assuming your Doctor model interface is here

interface AuthContextType {
  token: string | null;
  doctor: IDoctor | null;
  isLoading: boolean;
  login: (token: string, doctorData: IDoctor) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<IDoctor | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until checked
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage on initial load
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedDoctor = localStorage.getItem('doctorData');
      if (storedToken && storedDoctor) {
        setToken(storedToken);
        setDoctor(JSON.parse(storedDoctor));
      } else {
        // If no token/doctor, and trying to access a protected route, redirect to login
        // This assumes /login and /signup are the only public routes
        if (pathname !== '/login' && pathname !== '/signup') {
           // router.push('/login'); // Let protected layout handle this
        }
      }
    } catch (error) {
        console.error("Error reading auth data from local storage:", error);
        // Clear potentially corrupted data
        localStorage.removeItem('authToken');
        localStorage.removeItem('doctorData');
        // if (pathname !== '/login' && pathname !== '/signup') {
        //   router.push('/login');
        // }
    } finally {
        setIsLoading(false);
    }

  }, [pathname]); // Re-check on route change? Maybe not necessary, only on load

  const login = (newToken: string, doctorData: IDoctor) => {
    setToken(newToken);
    setDoctor(doctorData);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('doctorData', JSON.stringify(doctorData));
    // Redirect to dashboard after login
    router.push('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setDoctor(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('doctorData');
    // Redirect to login page after logout
    router.push('/login');
  };

  // Don't render children until loading is complete to prevent flash of wrong content
  // if (isLoading) {
  //   return <div>Loading authentication...</div>; // Or a proper spinner/loader component
  // }

  return (
    <AuthContext.Provider value={{ token, doctor, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 