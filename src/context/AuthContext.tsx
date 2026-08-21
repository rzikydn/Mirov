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

const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000; // 8 jam (waktu maksimal tidak beraktifitas sebelum auto-logout)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const performLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
    window.location.href = '/auth';
  };

  const updateActivity = () => {
    if (localStorage.getItem('token')) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  };

  useEffect(() => {
    // Bersihkan sisa sesi lama yang pake sessionStorage jika masih ada
    if (sessionStorage.getItem('token') || sessionStorage.getItem('user')) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }

    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const lastActivityStr = localStorage.getItem('lastActivity');

    if (savedUser && savedToken) {
      const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;
      const isExpired = Date.now() - lastActivity > INACTIVITY_LIMIT;

      // Jika sudah melewati batas batas tidak aktif, paksa login ulang
      if (isExpired && lastActivity !== 0) {
        console.log('⏰ Sesi kedaluwarsa karena sudah lama tidak diakses');
        performLogout();
        return;
      }

      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        updateActivity(); // refresh waktu aktif
      } catch (e) {
        console.error('Failed to parse user:', e);
        performLogout();
      }
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('🔑 401 Unauthorized detected. Performing logout.');
      performLogout();
    };

    window.addEventListener('app:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('app:unauthorized', handleUnauthorized);
  }, []);

  // Update lastActivity saat ada interaksi user supaya sesi tidak mati kalau web terbuka & dipakai
  useEffect(() => {
    if (!token) return;

    let timeout: NodeJS.Timeout;
    const handleActivity = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        updateActivity();
      }, 5000); // Throttled to prevent too many writes
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeout(timeout);
    };
  }, [token]);

  const logout = () => {
    performLogout();
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