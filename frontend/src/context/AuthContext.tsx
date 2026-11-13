import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  token?: string;
  authProvider?: string;
  firebaseUid?: string;
  subscribed: boolean;
  subscribed_plan: 'trial' | 'basic' | 'pro' | null;
}

interface Store {
  _id: string;
  name: string;
  slug: string;
  location?: string;
  phone?: string;
  currency?: string;
  description?: string;
  item_slots_available?: number;
  subscription_plan?: string;
}

interface AuthContextType {
  user: User | null;
  stores: Store[];
  activeStore: Store | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  switchStore: (storeId: string) => void;
  refreshStores: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        setUser(res.data);
        await fetchStores();
      }
    } catch (error) {
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/user/businesses');
      if (res.success) {
        setStores(res.data);
        const savedStoreId = localStorage.getItem('activeStoreId');
        if (savedStoreId && res.data.find((s: Store) => s._id === savedStoreId)) {
          setActiveStore(res.data.find((s: Store) => s._id === savedStoreId) || null);
        } else if (res.data.length > 0) {
          setActiveStore(res.data[0]);
          localStorage.setItem('activeStoreId', res.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stores');
    }
  };

  const login = async (userData: User) => {
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }

    setUser(userData);
    await fetchStores();
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      clearSession();
    }
  };

  const clearSession = () => {
    setUser(null);
    setStores([]);
    setActiveStore(null);
    localStorage.removeItem('activeStoreId');
    localStorage.removeItem('businessId'); // legacy
    localStorage.removeItem('authToken');
  };

  const switchStore = (storeId: string) => {
    const store = stores.find(s => s._id === storeId);
    if (store) {
      setActiveStore(store);
      localStorage.setItem('activeStoreId', store._id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, stores, activeStore, loading, login, logout, switchStore, refreshStores: fetchStores }}>
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
