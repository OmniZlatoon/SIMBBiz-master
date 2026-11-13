import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight, CreditCard, Save, User, Store, Shield, CheckCircle2, Moon, Sun, Loader2 } from '../components/MaterialIcon';
import { api } from '../utils/api';

interface SubscriptionSummary {
  status: 'trial' | 'active' | 'expired';
  planName: string;
  expiresAt: string | null;
  trialDaysRemaining: number;
}

export default function Settings() {
  const { user, activeStore } = useAuth();
  const activeStoreId = activeStore?._id;
  const { theme, toggleTheme } = useTheme();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [subscriptionError, setSubscriptionError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Dummy form states for MVP
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [storeData, setStoreData] = useState({ 
    name: activeStore?.name || '', 
    currency: activeStore?.currency || 'USD',
    description: activeStore?.description || ''
  });

  useEffect(() => {
    let active = true;
    const fetchSubscription = async () => {
      if (!activeStoreId) return;
      try {
        const response = await api.get(`/businesses/${activeStoreId}/subscription`);
        if (active) {
          setSubscription(response.data);
          setSubscriptionError('');
        }
      } catch (error) {
        console.error('Could not load subscription details', error);
        if (active) {
          setSubscriptionError(error instanceof Error ? error.message : 'Could not load subscription details.');
        }
      }
    };

    void fetchSubscription();
    return () => {
      active = false;
    };
  }, [activeStoreId]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('Store settings updated!');
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account and store preferences.</p>
      </div>

      {success && (
        <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Global Preferences */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Shield className="text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Global Preferences</h2>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-800 dark:text-slate-200">Dark Mode</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark theme globally.</p>
          </div>
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
          >
            {theme === 'dark' ? <><Sun size={18} /> Light Mode</> : <><Moon size={18} /> Dark Mode</>}
          </button>
        </div>
      </div>

      {/* Store Settings */}
      <form onSubmit={handleSaveStore} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Store className="text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Store Configuration</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Store Name</label>
              <input 
                type="text" value={storeData.name} onChange={e => setStoreData({...storeData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Store Currency</label>
              <select 
                value={storeData.currency} onChange={e => setStoreData({...storeData, currency: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white cursor-pointer"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="FCFA">FCFA (XAF) - Central African CFA</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="NGN">NGN (₦) - Nigerian Naira</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Store Description</label>
            <textarea 
              rows={3} value={storeData.description} onChange={e => setStoreData({...storeData, description: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Store Settings
          </button>
        </div>
      </form>

      {/* User Profile */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <User className="text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Personal Profile</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-teal-100 dark:bg-teal-900/50 border-2 border-teal-200 dark:border-teal-700 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl font-bold">
              {profileData.name.charAt(0) || 'U'}
            </div>
            <div>
              <button type="button" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">Change Profile Picture</button>
              <p className="text-xs text-slate-500 mt-1">JPG, GIF or PNG. Max size of 800K</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
              <input 
                type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <input 
                  type="email" value={profileData.email} disabled
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <CheckCircle2 size={18} className="text-teal-500" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Email is verified.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CreditCard size={20} className="mt-0.5 text-blue-700 dark:text-blue-300" />
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Current plan</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {subscription?.planName || (subscriptionError ? 'Unavailable' : 'Loading plan...')}
                  {subscription?.status === 'trial' && ` - ${subscription.trialDaysRemaining} days left`}
                </p>
                {subscriptionError && (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{subscriptionError}</p>
                )}
                {subscription?.status === 'active' && subscription.expiresAt && (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Expires {new Date(subscription.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Link
              to="/dashboard/billing"
              className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 sm:self-auto"
            >
              Manage plan <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <button type="button" className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Change Password</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
