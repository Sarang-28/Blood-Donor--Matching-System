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

  const [activeRole, setActiveRole] = useState(
    localStorage.getItem('activeRole') || null
  );

  const selectRole = (newRole) => {
    setActiveRole(newRole);
    localStorage.setItem('activeRole', newRole);
  };

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { token: receivedToken, user: receivedUser, profile: receivedProfile } = res.data.data;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    if (receivedProfile) {
      localStorage.setItem('profile', JSON.stringify(receivedProfile));
    }
    const initialRole = receivedUser.role || 'donor';
    localStorage.setItem('activeRole', initialRole);
    setActiveRole(initialRole);

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
    localStorage.setItem('activeRole', 'admin');
    setActiveRole('admin');

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const register = async (userData) => {
    // Post registration details
    const res = await api.post('/auth/register', userData);
    if (user && res.data?.data?.user) {
      const updatedUser = { ...user, ...res.data.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      if (res.data.data.token) {
        localStorage.setItem('token', res.data.data.token);
        setToken(res.data.data.token);
      }
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    localStorage.removeItem('activeRole');
    setToken(null);
    setUser(null);
    setProfile(null);
    setActiveRole(null);
  };

  const updateProfile = (newProfile) => {
    setProfile(newProfile);
    if (newProfile) {
      localStorage.setItem('profile', JSON.stringify(newProfile));
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.data) {
        const { user: fetchedUser, profile: fetchedProfile } = res.data.data;
        if (fetchedUser) {
          setUser(fetchedUser);
          localStorage.setItem('user', JSON.stringify(fetchedUser));
        }
        if (fetchedProfile) {
          setProfile(fetchedProfile);
          localStorage.setItem('profile', JSON.stringify(fetchedProfile));
        }
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    }
  };

  const value = {
    user,
    profile,
    token,
    loading,
    activeRole,
    selectRole,
    isAuthenticated: Boolean(token && user),
    login,
    adminLogin,
    register,
    logout,
    setUser,
    setProfile,
    updateProfile,
    refreshUser,
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
