import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, Users, DollarSign, PieChart, Settings, Menu, X, Store as StoreIcon, LogOut, Moon, Sun, CreditCard, ChevronLeft, ChevronRight } from './MaterialIcon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { activeStore, stores, switchStore, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Catalogue', path: '/dashboard/catalogue', icon: Package },
    { name: 'Sales', path: '/dashboard/sales', icon: DollarSign },
    { name: 'Customers', path: '/dashboard/customers', icon: Users },
    { name: 'Reports', path: '/dashboard/reports', icon: PieChart },
    { name: 'Billing', path: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    const logoutRequest = logout();
    navigate('/', { replace: true });
    await logoutRequest;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 transition-colors dark:bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white text-slate-800 transition-[width,transform] duration-300 dark:bg-slate-900 dark:text-slate-200 md:relative md:translate-x-0 ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className={sidebarCollapsed ? 'md:hidden' : ''}>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">SIMBBiz</h1>
            <p className="mt-1 max-w-[150px] truncate text-sm text-slate-500">{activeStore?.name || 'Loading Store...'}</p>
          </div>
          <button className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${sidebarCollapsed ? 'md:justify-center md:px-2' : ''} ${
                  isActive ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon size={20} filled={isActive} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                <span className={`font-medium ${sidebarCollapsed ? 'md:hidden' : ''}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">
          {user?.role === 'admin' && (
            <Link 
              to="/admin"
              className={`flex w-full items-center space-x-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 ${sidebarCollapsed ? 'md:justify-center md:px-2' : ''}`}
              title={sidebarCollapsed ? 'System Admin' : undefined}
            >
              <Users size={20} filled />
              <span className={`font-medium ${sidebarCollapsed ? 'md:hidden' : ''}`}>System Admin</span>
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 ${sidebarCollapsed ? 'md:justify-center md:px-2' : ''}`}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={20} />
            <span className={`font-medium ${sidebarCollapsed ? 'md:hidden' : ''}`}>Logout</span>
          </button>
          <button
            type="button"
            className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-slate-600 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${sidebarCollapsed ? 'md:justify-center md:px-2' : ''}`}
            onClick={() => {
              if (window.matchMedia('(min-width: 768px)').matches) {
                setSidebarCollapsed((collapsed) => !collapsed);
              } else {
                setSidebarOpen(false);
              }
            }}
            aria-label={sidebarOpen ? 'Close sidebar' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={sidebarOpen || !sidebarCollapsed}
            title={sidebarOpen ? 'Close sidebar' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarOpen ? <X size={20} /> : sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            <span className={`font-medium ${sidebarCollapsed ? 'md:hidden' : ''}`}>{sidebarOpen ? 'Close sidebar' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 transition-colors dark:bg-slate-950">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 transition-colors dark:border-slate-800 dark:bg-slate-900 md:px-8">
          <div className="flex items-center gap-4">
            <button className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="hidden truncate text-xl font-semibold text-slate-800 dark:text-slate-100 sm:block">
              {navItems.find(item => item.path === location.pathname)?.name || 'SIMBBiz'}
            </h2>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4">
            <button 
              onClick={toggleTheme} 
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800 md:px-3">
              <StoreIcon size={16} className="text-slate-500 dark:text-slate-400 hidden sm:block" />
              <select 
                className="max-w-[100px] cursor-pointer bg-transparent text-sm font-medium text-slate-700 focus:outline-none dark:text-slate-300 sm:max-w-[150px] md:max-w-[200px]"
                value={activeStore?._id || ''}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    navigate('/create-store');
                  } else {
                    switchStore(e.target.value);
                  }
                }}
              >
                {stores.map(store => (
                  <option key={store._id} value={store._id} className="dark:bg-slate-900">{store.name}</option>
                ))}
                <option value="new" className="font-bold text-blue-600 dark:bg-slate-900 dark:text-blue-400">+ Create New Store</option>
              </select>
            </div>
            
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 font-bold uppercase text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-300" title={user?.name}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 dark:text-slate-200 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
