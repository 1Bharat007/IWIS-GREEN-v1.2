"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<{token: string | null; logout: () => void}>({
  token: null,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('iwis_token');
    if (storedToken) setToken(storedToken);
  }, []);

  const logout = () => {
    localStorage.removeItem('iwis_token');
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);