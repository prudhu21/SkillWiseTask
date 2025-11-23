import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

type User = {
  id: string;
  username: string;
  role?: string;
  email?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  register: (payload: { username: string; password: string; email?: string }) => Promise<{ ok: boolean; message?: string }>;
  login: (payload: { username: string; password: string }) => Promise<{ ok: boolean; message?: string; user?: User }>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [token, user]);

  const register = async (payload: { username: string; password: string; email?: string }) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/register', payload);
      setToken(res.data.token);
      setUser(res.data.user);
      setLoading(false);
      navigate('/dashboard');
      return { ok: true };
    } catch (err: any) {
      setLoading(false);
      return { ok: false, message: err?.response?.data?.message || err?.message || 'Register failed' };
    }
  };

  const login = async (payload: { username: string; password: string }) => {
    setLoading(true);
    try {
      const body = { username: payload.username, password: payload.password };
      const res = await API.post('/auth/login', body);
      setToken(res.data.token);
      setUser(res.data.user ?? null);
      setLoading(false);
      navigate('/'); // or '/dashboard'
      return { ok: true, user: res.data.user };
    } catch (err: any) {
      console.error('[Auth] login error:', err?.response?.data ?? err?.message);
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = `Login failed${status ? ` (status ${status})` : ''}`;
      if (data) {
        if (typeof data === 'string') message = data;
        else if (data.message) message = data.message;
        else if (data.error) message = data.error;
        else message = JSON.stringify(data);
      } else if (err?.message) message = err.message;
      setLoading(false);
      return { ok: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const value = useMemo(() => ({ user, token, loading, register, login, logout }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
