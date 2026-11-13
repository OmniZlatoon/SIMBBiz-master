# Subscription plans and billing

## Plans and trial

Every new account receives a 30-day trial measured from the account's
`createdAt` timestamp. The trial is not restarted by later sign-ins. It includes
up to 50 item uploads per account.

After the trial, the available paid plans are:

| Plan | Price | Upload allowance | Term |
| --- | ---: | ---: | --- |
| Basic | 3,000 XAF | 50 items | 1 month |
| Pro | 10,000 XAF | 500 items | 6 months |

Plan prices, terms, and upload allowances are defined in
`backend/services/subscriptionPlans.js`. The browser submits only the plan key;
the API calculates the amount and entitlement from this server-side catalogue.

## User subscription fields

The User schema stores two enforced fields:

- `subscribed`: `true` only while a paid Basic or Pro subscription is active.
- `subscribed_plan`: `trial`, `basic`, `pro`, or `null` when the account has no
  active plan.

Schema validation prevents a trial or expired account from being marked as
subscribed and prevents a paid plan from being active without `subscribed: true`.
The backend synchronizes the fields from the account's businesses at sign-in,
`/auth/me`, and subscription-status checks. A successful verified payment
updates the active plan.

The dashboard displays the remaining trial days, and Settings shows the
account's current plan. The Billing page contains the two plan cards, recommends
Pro, and uses the existing theme tokens and Material Icons. Its loading state
uses the `PageSkeleton` subscription-card variant. The centered Fapshi
attribution is placed below both cards, with the blue logo in light mode and
the white logo in dark mode.

## Fapshi payment flow

1. The authenticated business owner selects Basic or Pro.
2. The backend rejects client-supplied prices, upload limits, and other
   unsupported checkout values, recording suspicious attempts as subscription
   security events.
3. The backend creates a hosted Fapshi checkout with the plan's configured
   amount, account ID, and payment reference.
4. On webhook delivery, the backend validates the `x-wh-secret` header using a
   constant-time comparison. It then asks Fapshi for the transaction status
   and verifies the transaction ID, external payment reference, amount, and
   account ID before applying the subscription.
5. Repeated notifications do not grant the same subscription twice. Pending
   payments are also checked against Fapshi when the authenticated status
   endpoint is polled.

The webhook endpoint is `POST /api/webhooks/fapshi`. Configure the Fapshi
dashboard to use this HTTPS URL and the same webhook secret as the server.

## Server configuration

Set these variables in the backend environment; do not commit credentials:

- `FAPSHI_API_USER`
- `FAPSHI_API_SECRET`
- `FAPSHI_WEBHOOK_SECRET`
- `FAPSHI_BASE_URL` (`https://sandbox.fapshi.com` for sandbox or
  `https://live.fapshi.com` for production)
- `FRONTEND_URL` (HTTPS in production, used for the checkout return URL)

Set these variables in the backend deployment environment. The Fapshi webhook
secret is a static shared secret supplied in the `x-wh-secret` request header,
not an HMAC signature.

## Validation

The focused backend checks are:

```powershell
Set-Location backend
node --test tests\subscriptionPlans.test.js tests\subscriptionWebhook.test.js
```

The frontend production build/type-check is:

```powershell
npm --prefix frontend run build
```
