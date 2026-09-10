import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedProfile = localStorage.getItem('profile');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
        setToken(storedToken);
      }
    } catch (e) {
      console.error('Failed to parse cached auth session:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { token: receivedToken, user: receivedUser, profile: receivedProfile } = res.data.data;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    if (receivedProfile) {
      localStorage.setItem('profile', JSON.stringify(receivedProfile));
    }

    setToken(receivedToken);
    setUser(receivedUser);
    setProfile(receivedProfile || null);

    return { user: receivedUser, profile: receivedProfile };
  };

  const adminLogin = async (credentials) => {
    const res = await api.post('/auth/admin/login', credentials);
    const { token: receivedToken, user: receivedUser } = res.data.data;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token: receivedToken, user: receivedUser, profile: receivedProfile } = res.data.data;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    if (receivedProfile) {
      localStorage.setItem('profile', JSON.stringify(receivedProfile));
    }

    setToken(receivedToken);
    setUser(receivedUser);
    setProfile(receivedProfile || null);

    return { user: receivedUser, profile: receivedProfile };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    adminLogin,
    register,
    logout,
    setUser,
    setProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
