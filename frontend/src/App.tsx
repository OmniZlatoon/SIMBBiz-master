import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import { PageSkeleton } from './components/PageSkeleton';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateStore from './pages/CreateStore';
import Dashboard from './pages/Dashboard';
import Catalogue from './pages/Catalogue';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Storefront from './pages/Storefront';
import AdminDashboard from './pages/AdminDashboard';
import Market from './pages/Market';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import ForgotPassword from './pages/ForgotPassword';

// Protected Route Wrapper
function LoadingScreen() {
  return <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950"><PageSkeleton /></div>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, activeStore } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!activeStore) return <Navigate to="/create-store" />;
  
  return <>{children}</>;
}

// Just requires User, not Store
function UserRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

// Requires Admin Role
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Marketing/Auth Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/market" element={<Market />} />
          
          {/* User Account Route (No store needed yet) */}
          <Route path="/create-store" element={<UserRoute><CreateStore /></UserRoute>} />

          {/* System Admin Route */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Protected Business Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="catalogue" element={<Catalogue />} />
            <Route path="sales" element={<Sales />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Public Storefront Route */}
          <Route path="/shop/:slug" element={<Storefront />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
