import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api';

type Stage = 'identify' | 'method' | 'waiting' | 'otp' | 'reset' | 'done';

export default function ForgotPassword() {
  const [stage, setStage] = useState<Stage>('identify');
  const [email, setEmail] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [handoffToken, setHandoffToken] = useState('');
  const [whatsAppLink, setWhatsAppLink] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (stage !== 'waiting' || !recoveryToken || !handoffToken) return undefined;

    let active = true;
    const checkStatus = async () => {
      try {
        const result = await api.post('/auth/forget-password/whatsapp/status', {
          recoveryToken,
          handoffToken
        });
        if (!active) return;
        if (result.status === 'sent') {
          setNotice(result.message || 'Your OTP was sent to your WhatsApp number.');
          setError('');
          setStage('otp');
        } else if (result.status === 'failed' || result.status === 'expired') {
          setError(result.message || 'The WhatsApp handoff expired. Please start again.');
          setStage('method');
        }
      } catch (requestError) {
        if (!active) return;
        const message = requestError instanceof Error ? requestError.message : 'Could not check WhatsApp status.';
        if (/recovery session.*(invalid|expired)/i.test(message)) {
          setError(message);
          setStage('method');
        } else {
          setNotice('Could not check WhatsApp status yet. We will keep checking automatically.');
        }
      }
    };

    void checkStatus();
    const timer = window.setInterval(() => void checkStatus(), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [stage, recoveryToken, handoffToken]);

  const handleAccountCheck = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api.post('/auth/forget-password', { email, recoveryEmail });
      setRecoveryToken(result.recoveryToken);
      setEmail(result.email || email.trim());
      setStage('method');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not verify the account.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailDelivery = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api.post('/auth/forget-password/email', { recoveryToken });
      setNotice(result.message || 'The code was sent to your account email.');
      setStage('otp');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send the email code.');
    } finally {
      setBusy(false);
    }
  };

  const handleWhatsAppHandoff = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api.post('/auth/forget-password/whatsapp', { recoveryToken });
      setWhatsAppLink(result.waLink);
      setHandoffToken(result.handoffToken);
      setNotice(result.message);
      setStage('waiting');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not start WhatsApp recovery.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.post('/auth/forget-password/verify-otp', { recoveryToken, otp });
      setResetToken(result.resetToken);
      setStage('reset');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The code could not be verified.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.post('/auth/reset-password', {
        email,
        resetToken,
        newPassword,
        confirmPassword
      });
      setNotice(result.message || 'Your password has been updated.');
      setStage('done');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not reset the password.');
    } finally {
      setBusy(false);
    }
  };

  const buttonClass = 'w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-teal-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50';
  const inputClass = 'block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30';

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 font-sans">
      <div className="mx-auto max-w-md">
        <Link to="/login" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={17} /> Back to sign in
        </Link>
        <section className="rounded-2xl border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <KeyRound size={23} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {stage === 'identify' && 'Verify your account and recovery email to continue.'}
            {stage === 'method' && 'Choose where you want to receive your verification code.'}
            {stage === 'waiting' && 'Send the prefilled message from the WhatsApp number registered to your account.'}
            {stage === 'otp' && 'Enter the 8-digit code. It expires in 5 minutes.'}
            {stage === 'reset' && 'Choose a new password for your account.'}
            {stage === 'done' && 'Your password has been changed successfully.'}
          </p>

          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          {notice && <div role="status" className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{notice}</div>}

          {stage === 'identify' && (
            <form className="mt-7 space-y-5" onSubmit={handleAccountCheck}>
              <label className="block text-sm font-bold text-slate-700">
                Account email
                <input className={`${inputClass} mt-2`} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Recovery email
                <input className={`${inputClass} mt-2`} type="email" autoComplete="email" required value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} />
              </label>
              <button className={buttonClass} type="submit" disabled={busy}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : <>Verify account <ArrowRight size={17} /></>}
              </button>
            </form>
          )}

          {stage === 'method' && (
            <div className="mt-7 space-y-3">
              <button className={buttonClass} type="button" disabled={busy} onClick={() => void handleEmailDelivery()}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : <><Mail size={18} /> Send code by email</>}
              </button>
              <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-800 transition hover:border-teal-500 hover:text-teal-700 disabled:opacity-50" type="button" disabled={busy} onClick={() => void handleWhatsAppHandoff()}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : <><MessageCircle size={18} /> Continue with WhatsApp</>}
              </button>
            </div>
          )}

          {stage === 'waiting' && (
            <div className="mt-7 space-y-4">
              <a
                className={buttonClass}
                href={whatsAppLink}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} /> Open WhatsApp and send message
              </a>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Waiting for your message…
              </div>
              <p className="text-center text-xs leading-5 text-slate-400">
                After tapping Send in WhatsApp, return here. This page will detect your message and request the OTP automatically.
              </p>
              <button className="w-full text-sm font-semibold text-slate-500 hover:text-slate-900" type="button" onClick={() => setStage('method')}>
                Use another delivery method
              </button>
            </div>
          )}

          {stage === 'otp' && (
            <form className="mt-7 space-y-5" onSubmit={handleVerifyOtp}>
              <label className="block text-sm font-bold text-slate-700">
                8-digit verification code
                <input className={`${inputClass} mt-2 text-center text-xl tracking-[0.35em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={8} pattern="[0-9]{8}" required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))} />
              </label>
              <button className={buttonClass} type="submit" disabled={busy}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : <>Verify code <ShieldCheck size={17} /></>}
              </button>
              <button className="w-full text-sm font-semibold text-slate-500 hover:text-slate-900" type="button" onClick={() => setStage('method')}>
                Choose a different delivery method
              </button>
            </form>
          )}

          {stage === 'reset' && (
            <form className="mt-7 space-y-5" onSubmit={handleResetPassword}>
              <label className="block text-sm font-bold text-slate-700">
                New password
                <input className={`${inputClass} mt-2`} type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Confirm new password
                <input className={`${inputClass} mt-2`} type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
              <button className={buttonClass} type="submit" disabled={busy}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : 'Update password'}
              </button>
            </form>
          )}

          {stage === 'done' && (
            <Link to="/login" className={`${buttonClass} mt-7`}>
              Return to sign in <ArrowRight size={17} />
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}
