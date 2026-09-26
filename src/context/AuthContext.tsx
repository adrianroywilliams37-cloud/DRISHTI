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
    // Vercel deployment client-side authentication mock
    // In a real app this would hit the API gateway or Supabase Auth directly
    
    // Nodal officers
    if (userId.startsWith('user_nodal_') && password === 'nodal') {
      setUser({
        id: userId,
        role: 'nodal',
        name: `Nodal Officer ${userId.split('_').pop()}`,
        pinnedProjects: []
      });
      return;
    }

    // Ministry/Apex/Master
    const credentials: Record<string, any> = {
      'master_admin': { role: 'master', name: 'Master Admin', pass: 'password123' },
      'user_ministry_1': { role: 'ministry', name: 'Aditi Sharma (Ministry Analyst)', sector: 'Railways', pass: 'ministry' },
      'user_apex_1': { role: 'apex', name: 'Secretary, Railways', sector: 'Railways', pass: 'apex' }
    };

    const validUser = credentials[userId];
    if (validUser && validUser.pass === password) {
      setUser({
        id: userId,
        role: validUser.role,
        name: validUser.name,
        sector: validUser.sector,
        pinnedProjects: []
      });
      return;
    }

    throw new Error('Invalid credentials');
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
