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
      let user = null;
      
      // Nodal officers
      if (userId.startsWith('user_nodal_') && password === 'nodal') {
        user = {
          id: userId,
          role: 'nodal',
          name: `Nodal Officer ${userId.split('_').pop()}`,
          pinnedProjects: []
        };
      } else {
        // Ministry/Apex/Master
        const credentials = {
          'master_admin': { role: 'master', name: 'Master Admin', pass: 'password123' },
          'user_ministry_1': { role: 'ministry', name: 'Aditi Sharma (Ministry Analyst)', sector: 'Railways', pass: 'ministry' },
          'user_apex_1': { role: 'apex', name: 'Secretary, Railways', sector: 'Railways', pass: 'apex' }
        };

        const validUser = credentials[userId];
        if (validUser && validUser.pass === password) {
          user = {
            id: userId,
            role: validUser.role,
            name: validUser.name,
            sector: validUser.sector,
            pinnedProjects: []
          };
        }
      }

      if (!user) {
        throw new Error('Invalid credentials');
      }

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
