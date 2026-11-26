import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL, api } from '../utils/api';
import { signOutFromFirebase } from '../utils/firebaseAuth';

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
  login: (user: User) => Promise<Store[]>;
  logout: () => void;
  switchStore: (storeId: string) => void;
  refreshStores: () => Promise<Store[]>;
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
        const nextStores = Array.isArray(res.data) ? res.data : [];
        setStores(nextStores);
        const savedStoreId = localStorage.getItem('activeStoreId');
        const selectedStore = savedStoreId
          ? nextStores.find((s: Store) => s._id === savedStoreId)
          : null;

        if (selectedStore) {
          setActiveStore(selectedStore);
        } else if (nextStores.length > 0) {
          setActiveStore(nextStores[0]);
          localStorage.setItem('activeStoreId', nextStores[0]._id);
        } else {
          setActiveStore(null);
          localStorage.removeItem('activeStoreId');
        }

        return nextStores;
      }

      setStores([]);
      setActiveStore(null);
      localStorage.removeItem('activeStoreId');
      return [];
    } catch (err) {
      console.error('Failed to fetch stores');
      setStores([]);
      setActiveStore(null);
      localStorage.removeItem('activeStoreId');
      return [];
    }
  };

  const login = async (userData: User): Promise<Store[]> => {
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }

    setUser(userData);
    setLoading(true);
    try {
      return await fetchStores();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const currentUser = user;
    const googleIdToken = localStorage.getItem('googleIdToken');
    setLoading(true);
    clearSession();
    setLoading(false);

    try {
      if (currentUser?.authProvider === 'google') {
        const googleToken = googleIdToken;
        if (googleToken) {
          await fetch(`${API_BASE_URL}/auth/google/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${googleToken}`
            },
            body: JSON.stringify({ uid: currentUser.firebaseUid || undefined })
          });
        }
      } else {
        await api.get('/auth/logout');
      }
    } catch (error) {
      console.error(error);
    }

    try {
      await signOutFromFirebase();
    } catch (error) {
      console.error('Failed to clear the Firebase session', error);
    }
  };

  const clearSession = () => {
    setUser(null);
    setStores([]);
    setActiveStore(null);
    localStorage.removeItem('activeStoreId');
    localStorage.removeItem('businessId'); // legacy
    localStorage.removeItem('authToken');
    localStorage.removeItem('googleIdToken');
    sessionStorage.removeItem('activeStoreId');
    sessionStorage.removeItem('businessId');
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
