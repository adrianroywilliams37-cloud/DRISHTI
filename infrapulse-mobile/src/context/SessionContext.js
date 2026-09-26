import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWebServerUrl } from '../utils/network';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [activeUser, setActiveUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved session on boot
    const loadSession = async () => {
      try {
        const savedSession = await AsyncStorage.getItem('@infrapulse_session');
        if (savedSession) {
          setActiveUser(JSON.parse(savedSession));
        }
      } catch (e) {
        console.error("Failed to load session", e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (userId, password) => {
    try {
      const serverUrl = await getWebServerUrl();
      const response = await fetch(`${serverUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      
      const user = await response.json();
      await AsyncStorage.setItem('@infrapulse_session', JSON.stringify(user));
      setActiveUser(user);
      return user;
    } catch (e) {
      console.error("Login failed", e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@infrapulse_session');
      setActiveUser(null);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <SessionContext.Provider value={{ activeUser, login, logout, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
