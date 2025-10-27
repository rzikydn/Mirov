import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'SUPERUSER' | 'ADMIN' | 'UMUM';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: Array<'SUPERUSER' | 'ADMIN' | 'UMUM'>) => boolean;
  canManageSchedules: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/auth';
  };

  const hasRole = (roles: Array<'SUPERUSER' | 'ADMIN' | 'UMUM'>): boolean => {
    if (!user) return false;
    // SUPERUSER can access everything
    if (user.role === 'SUPERUSER') return true;
    return roles.includes(user.role);
  };

  const canManageSchedules = (): boolean => {
    return hasRole(['SUPERUSER', 'ADMIN']);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        logout,
        isAuthenticated: !!user && !!token,
        hasRole,
        canManageSchedules
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};