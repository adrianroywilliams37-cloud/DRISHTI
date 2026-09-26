import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'nodal' | 'ministry' | 'apex' | 'master';

interface User {
  id: string;
  role: UserRole;
  name: string;
  sector?: string;
  pinnedProjects?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (userId: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Try to get from local storage first for persistence
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('infrapulse_user_session');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // Save to local storage on change
  React.useEffect(() => {
    if (user) {
      localStorage.setItem('infrapulse_user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('infrapulse_user_session');
    }
  }, [user]);

  const login = async (userId: string, password: string) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      setUser(data);
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
