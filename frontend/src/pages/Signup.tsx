import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, Sparkles, Phone } from '../components/MaterialIcon';
import { signInWithGoogle, signUpWithEmailAndPassword } from '../utils/firebaseAuth';
import { PageSkeleton } from '../components/PageSkeleton';

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" focusable="false">
    <path d="M21.6 12.23c0-.7-.06-1.37-.18-2.02H12v3.82h5.39a4.61 4.61 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.97-4.33 2.97-7.35Z" fill="#4285F4" />
    <path d="M12 22c2.7 0 4.96-.9 6.61-2.42l-3.24-2.52c-.9.6-2.05.96-3.37.96-2.6 0-4.8-1.75-5.59-4.12H.88v2.6A10 10 0 0 0 12 22Z" fill="#34A853" />
    <path d="M6.41 19.9A6 6 0 0 1 6 16.8v-2.6H2.75A10 10 0 0 0 2 12c0-1.62.39-3.16 1.08-4.5H6.4v2.6a5.99 5.99 0 0 1 0 3.8v2.6Z" fill="#FBBC05" />
    <path d="M12 3.98c1.47 0 2.8.51 3.84 1.51l2.86-2.86A9.9 9.9 0 0 0 12 1.8a10 10 0 0 0-9.12 5.7H6.4a6 6 0 0 1 5.6-3.52Z" fill="#EA4335" />
  </svg>
);

type GoogleProfileData = {
  name: string;
  email: string;
  recoveryEmail: string;
  whatsappNumber: string;
};

const initialGoogleProfile: GoogleProfileData = {
  name: '',
  email: '',
  recoveryEmail: '',
  whatsappNumber: ''
};

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    recoveryEmail: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [googleProfile, setGoogleProfile] = useState<GoogleProfileData>(initialGoogleProfile);
  const [firebaseIdToken, setFirebaseIdToken] = useState('');
  const [showGoogleCompletion, setShowGoogleCompletion] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { firebaseIdToken } = await signUpWithEmailAndPassword({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      const res = await api.post('/auth/register', {
        ...formData,
        firebaseIdToken,
        emailVerified: true,
        recoveryEmailVerified: true,
        confirmPassword: formData.confirmPassword
      });

      if (res.success) {
        const stores = await login({ ...res.data, token: res.token, authProvider: 'local' });
        navigate(stores.length > 0 ? '/dashboard' : '/create-store');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { firebaseIdToken: token, user } = await signInWithGoogle();
      if (!user.email) {
        throw new Error('Your Google account does not provide an email address.');
      }
      setFirebaseIdToken(token);
      setGoogleProfile({
        name: user.displayName || '',
        email: user.email,
        recoveryEmail: user.email,
        whatsappNumber: ''
      });
      setShowGoogleCompletion(true);
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        firebaseIdToken,
        name: googleProfile.name.trim(),
        whatsappNumber: googleProfile.whatsappNumber.trim(),
        recoveryEmail: googleProfile.recoveryEmail.trim()
      };

      const res = await api.post('/auth/google', payload);
      if (res.success) {
        localStorage.setItem('googleIdToken', firebaseIdToken);
        const stores = await login({ ...res.data, token: res.token, authProvider: 'google' });
        navigate(stores.length > 0 ? '/dashboard' : '/create-store');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoogleProfile({ ...googleProfile, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950"><PageSkeleton variant="form" /></div>;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="grid min-h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
        <div className="relative hidden min-h-screen overflow-hidden bg-slate-900 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.2),transparent_35%),linear-gradient(135deg,_rgba(18,18,18,0.98),_rgba(33,33,33,0.9))]" />
          <img src="https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=1600&auto=format&fit=crop&q=80" alt="Business growth" className="absolute inset-0 h-full w-full object-cover opacity-40" />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-12">
            <Link to="/" className="inline-flex w-max items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 shadow-lg shadow-white/20">
                <Zap size={22} className="fill-current" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">SIMBBiz</span>
            </Link>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-500/10 px-3 py-1.5 text-sm font-medium text-teal-400">
                <Sparkles size={14} /> Launch quickly, sell globally
              </div>
              <h1 className="text-4xl font-extrabold leading-tight text-white xl:text-5xl">
                Create your storefront and start selling smarter.
              </h1>
              <div className="mt-8 space-y-5 text-slate-100">
                <div className="flex items-start gap-3 rounded-[3px] border border-white/10 bg-white/5 p-4">
                  <ShieldCheck size={22} className="mt-0.5 text-teal-400" />
                  <div>
                    <p className="font-semibold text-white">Zero platform fees</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">Keep more of your revenue and connect directly with buyers through WhatsApp and storefront tools.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-[3px] border border-white/10 bg-white/5 p-4">
                  <ShieldCheck size={22} className="mt-0.5 text-teal-400" />
                  <div>
                    <p className="font-semibold text-white">Storefront + dashboard</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">Track growth, manage inventory, and take orders from a single system built for modern commerce.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-50 px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-6 flex justify-center lg:hidden">
                <Link to="/" className="flex h-12 w-12 items-center justify-center rounded-[3px] bg-slate-900 text-white shadow-sm">
                  <Zap size={22} className="fill-current" />
                </Link>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">Create account</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Set up your store</h2>
            </div>

            <div className="rounded-[3px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] sm:p-7">
              {error && (
                <div className="mb-5 rounded-[3px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              )}

              {showGoogleCompletion ? (
                <form className="space-y-5" onSubmit={handleGoogleComplete}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Complete your account</h3>
                      <p className="text-sm text-slate-500">Add the remaining details required by the platform.</p>
                    </div>
                    <button type="button" onClick={() => setShowGoogleCompletion(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700">Back</button>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                    <div className="relative">
                      <User size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input name="name" type="text" value={googleProfile.name} onChange={handleGoogleChange} required placeholder="John Doe" className="w-full rounded-[3px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                    <div className="relative">
                      <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input name="email" type="email" value={googleProfile.email} readOnly aria-readonly="true" className="w-full cursor-not-allowed rounded-[3px] border border-slate-200 bg-slate-100 py-3 pl-11 pr-3 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Recovery email</label>
                    <div className="relative">
                      <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input name="recoveryEmail" type="email" value={googleProfile.recoveryEmail} onChange={handleGoogleChange} required placeholder="recovery@example.com" className="w-full rounded-[3px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">WhatsApp number</label>
                    <div className="relative">
                      <Phone size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input name="whatsappNumber" type="tel" value={googleProfile.whatsappNumber} onChange={handleGoogleChange} required placeholder="+2348000000000" className="w-full rounded-[3px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? <Loader2 size={17} className="animate-spin" /> : <>
                      Finish sign up
                      <ArrowRight size={17} />
                    </>}
                  </button>
                </form>
              ) : (
                <>
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                      <div className="relative">
                        <User size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="name" type="text" value={formData.name} onChange={handleLocalChange} required placeholder="John Doe" className="w-full rounded-[3px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                      <div className="relative">
                        <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="email" type="email" value={formData.email} onChange={handleLocalChange} required placeholder="you@example.com" className="w-full rounded-[3px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Recovery email</label>
                      <div className="relative">
                        <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="recoveryEmail" type="email" value={formData.recoveryEmail} onChange={handleLocalChange} required placeholder="recovery@example.com" className="w-full rounded-[3px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">WhatsApp number</label>
                      <div className="relative">
                        <Phone size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="whatsappNumber" type="tel" value={formData.whatsappNumber} onChange={handleLocalChange} required placeholder="+2348000000000" className="w-full rounded-[3px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                      <div className="relative">
                        <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="password" type="password" value={formData.password} onChange={handleLocalChange} required placeholder="••••••••" className="w-full rounded-[3px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</label>
                      <div className="relative">
                        <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleLocalChange} required placeholder="••••••••" className="w-full rounded-[3px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                      {loading ? <Loader2 size={17} className="animate-spin" /> : <>
                        Create account
                        <ArrowRight size={17} />
                      </>}
                    </button>
                  </form>

                  <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span>or</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>

                  <button type="button" onClick={() => void handleGoogleSignUp()} disabled={googleLoading} className="flex w-full items-center justify-center gap-3 rounded-[3px] border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                    {googleLoading ? <Loader2 size={17} className="animate-spin" /> : <GoogleIcon />}
                    <span>{googleLoading ? 'Please wait...' : 'Sign up with Google'}</span>
                  </button>

                  <div className="mt-6 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-teal-600 transition hover:text-teal-500">Sign in here</Link>
                  </div>

                
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
