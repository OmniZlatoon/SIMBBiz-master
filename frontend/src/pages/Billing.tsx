import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from '../components/PageSkeleton';
import {
  ArrowRight,
  Check,
  CheckCircle,
  CreditCard,
  Info,
  Loader2,
  Package,
  ShieldCheck,
  Sparkles
} from '../components/MaterialIcon';
import fapshiBlueLogo from '../assets/fapshi-logo-blue.svg';
import fapshiWhiteLogo from '../assets/fapshi-logo-white.svg';

interface SubscriptionPlan {
  key: 'basic' | 'pro';
  name: string;
  amount: number;
  uploads: number;
  periodLabel: string;
}

interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired';
  currentPlan: string | null;
  planName: string;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  plans: SubscriptionPlan[];
  pendingPayment: {
    planKey: string;
    gatewayStatus: string | null;
    checkoutUrl?: string;
    securityFlagged: boolean;
  } | null;
  latestPayment: {
    status: 'pending' | 'completed' | 'failed';
    planKey: string;
    createdAt: string;
  } | null;
}

const formatXaf = (amount: number) => `${amount.toLocaleString('fr-FR')} XAF`;

export default function Billing() {
  const { activeStore } = useAuth();
  const activeStoreId = activeStore?._id;
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(0);
  const hasPendingPayment = Boolean(
    subscription?.pendingPayment &&
    subscription.pendingPayment.gatewayStatus !== 'INITIATION_UNCONFIRMED'
  );

  useEffect(() => {
    let active = true;
    const refreshStatus = async () => {
      if (!activeStoreId) return;

      try {
        const response = await api.get(`/businesses/${activeStoreId}/subscription`);
        if (active) {
          setSubscription(response.data);
          setError('');
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Could not load subscription details.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void refreshStatus();
    const pollId = hasPendingPayment
      ? window.setInterval(() => void refreshStatus(), 15000)
      : undefined;
    const clockStartId = window.setTimeout(() => setNow(Date.now()), 0);
    const clockId = window.setInterval(() => setNow(Date.now()), 60000);

    return () => {
      active = false;
      if (pollId !== undefined) window.clearInterval(pollId);
      window.clearTimeout(clockStartId);
      window.clearInterval(clockId);
    };
  }, [activeStoreId, hasPendingPayment]);

  const daysRemaining = subscription?.trialEndsAt && now > 0
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - now) / 86400000))
    : subscription?.trialDaysRemaining || 0;

  const startCheckout = async (planKey: SubscriptionPlan['key']) => {
    if (!activeStore) return;

    setCheckoutPlan(planKey);
    setError('');
    setNotice('');

    try {
      const response = await api.post(
        `/businesses/${activeStore._id}/subscription/checkout`,
        { planKey }
      );
      if (!response.data?.link) {
        throw new Error('Fapshi did not return a payment link.');
      }
      window.location.assign(response.data.link);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not start checkout.');
      setCheckoutPlan(null);
    }
  };

  const plans = subscription?.plans || [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
          Account billing
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
              Choose your subscription
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
              Keep your catalogue growing with simple, secure Fapshi payments.
            </p>
          </div>
          {subscription && (
            <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 sm:self-auto">
              <CreditCard size={18} className="text-blue-700 dark:text-blue-300" />
              <span className="text-slate-600 dark:text-slate-300">Current plan</span>
              <strong className="text-slate-900 dark:text-slate-100">{subscription.planName}</strong>
            </div>
          )}
        </div>
      </header>

      {subscription?.status === 'trial' && (
        <div className="flex gap-4 rounded-2xl border border-blue-200 p-5 dark:border-blue-900/70"
          style={{
            backgroundColor: 'var(--banner-reminder)',
            borderLeftColor: 'var(--callout-tip)',
            borderLeftWidth: '4px'
          }}
          role="status"
        >
          <Info size={22} className="mt-0.5 shrink-0" style={{ color: 'var(--callout-tip)' }} />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Your 30-day trial has {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining.
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Your trial began when you signed up. After it ends, choose Basic or Pro to continue uploading items.
              Pro is recommended: 500+ uploads for 10,000 XAF over six months. Six months of Basic costs 18,000 XAF and includes 300 uploads.
            </p>
          </div>
        </div>
      )}

      {subscription?.status === 'expired' && (
        <div className="flex gap-4 rounded-2xl border border-blue-200 p-5 dark:border-blue-900/70"
          style={{
            backgroundColor: 'var(--banner-reminder)',
            borderLeftColor: 'var(--callout-tip)',
            borderLeftWidth: '4px'
          }}
          role="status"
        >
          <Info size={22} className="mt-0.5 shrink-0" style={{ color: 'var(--callout-tip)' }} />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Your trial or subscription has ended.</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Choose Basic or Pro below to restore item uploads. Pro includes more uploads for a lower six-month cost.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-3 rounded-xl border border-blue-200 p-4 text-slate-800 dark:border-blue-900/60 dark:text-slate-100"
          style={{ backgroundColor: 'var(--banner-reminder)' }}
          role="alert"
        >
          <Info size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--callout-tip)' }} />
          <p>{error}</p>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100" role="status">
          <CheckCircle size={20} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      {subscription?.pendingPayment?.securityFlagged && (
        <div
          className="flex items-start gap-3 rounded-xl border border-blue-200 p-4 text-slate-800 dark:border-blue-900/60 dark:text-slate-100"
          style={{ backgroundColor: 'var(--banner-reminder)' }}
          role="status"
        >
          <Info size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--callout-tip)' }} />
          <p>Your payment is being reviewed. Contact support if you need help; do not make another payment.</p>
        </div>
      )}

      {subscription?.pendingPayment && !subscription.pendingPayment.securityFlagged && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {subscription.pendingPayment.gatewayStatus === 'INITIATION_UNCONFIRMED'
              ? <Info size={20} className="mt-0.5 text-blue-700 dark:text-blue-300" />
              : <Loader2 size={20} className="mt-0.5 animate-spin text-blue-700 dark:text-blue-300" />}
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {subscription.pendingPayment.gatewayStatus === 'INITIATION_UNCONFIRMED'
                  ? 'Payment request needs review'
                  : 'Waiting for Fapshi to confirm your payment'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {subscription.pendingPayment.gatewayStatus === 'INITIATION_UNCONFIRMED'
                  ? 'Fapshi did not confirm the checkout link. Do not retry yet; contact support to verify the payment request.'
                  : 'Your plan will update automatically after confirmation.'}
              </p>
            </div>
          </div>
          {subscription.pendingPayment.checkoutUrl && (
            <a
              href={subscription.pendingPayment.checkoutUrl}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 sm:self-auto"
            >
              Return to checkout <ArrowRight size={17} />
            </a>
          )}
        </div>
      )}

      {!subscription?.pendingPayment && subscription?.latestPayment?.status === 'failed' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Your last payment did not complete. You can securely try again with either plan.
        </div>
      )}

      {loading ? (
        <PageSkeleton variant="billing" />
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-medium text-slate-900 dark:text-slate-100">Subscription plans are temporarily unavailable.</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Refresh the page or try again shortly.</p>
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2" aria-label="Available subscription plans">
          {plans.map((plan) => {
            const isPro = plan.key === 'pro';
            const isCurrent = subscription?.currentPlan === plan.key && subscription?.status === 'active';
            const isDisabled = Boolean(checkoutPlan || subscription?.pendingPayment);

            return (
              <article
                key={plan.key}
                className={`relative flex flex-col overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-950 md:p-8 ${
                  isPro
                    ? 'border-blue-600 ring-1 ring-blue-600 dark:border-blue-400 dark:ring-blue-400'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {isPro && (
                  <div className="absolute right-0 top-0 inline-flex items-center gap-2 rounded-bl-2xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white dark:bg-blue-600">
                    <Sparkles size={16} /> Recommended
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    isPro
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}>
                    {isPro ? <Sparkles size={23} /> : <Package size={23} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{plan.name}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isPro ? 'For growing catalogues' : 'A practical start for your business'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {formatXaf(plan.amount)}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ {plan.periodLabel}</span>
                </div>

                <div className="mt-6 space-y-3">
                  <p className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <Check size={18} className="shrink-0 text-blue-700 dark:text-blue-300" />
                    {plan.key === 'pro' ? '500+ item uploads' : '50 item uploads'}
                  </p>
                  <p className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <Check size={18} className="shrink-0 text-blue-700 dark:text-blue-300" />
                    {plan.key === 'pro' ? 'Valid for six months' : 'Valid for one month'}
                  </p>
                  <p className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <Check size={18} className="shrink-0 text-blue-700 dark:text-blue-300" />
                    Secure hosted checkout by Fapshi
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isDisabled || isCurrent}
                  onClick={() => void startCheckout(plan.key)}
                  className={`mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isPro
                      ? 'bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500'
                      : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {checkoutPlan === plan.key ? (
                    <><Loader2 size={19} className="animate-spin" /> Connecting to Fapshi</>
                  ) : isCurrent ? (
                    'Current plan'
                  ) : (
                    <>Choose {plan.name} <ArrowRight size={18} /></>
                  )}
                </button>

              </article>
            );
          })}
        </section>
      )}

      {!loading && plans.length > 0 && (
        <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
            Powered by Fapshi
          </p>
          <img src={fapshiBlueLogo} alt="Fapshi" className="h-6 w-[68px] object-contain dark:hidden" />
          <img src={fapshiWhiteLogo} alt="Fapshi" className="hidden h-6 w-[68px] object-contain dark:block" />
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Plan prices and upload limits are verified by SIMBBiz before checkout. Fapshi securely processes the payment.
          </p>
        </div>
        <Link to="/dashboard/settings" className="inline-flex items-center gap-1 self-start font-semibold text-blue-700 hover:underline dark:text-blue-300 sm:self-auto">
          View profile <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}
