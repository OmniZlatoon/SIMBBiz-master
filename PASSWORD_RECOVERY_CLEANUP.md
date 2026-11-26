# Password Recovery: Current State and Cleanup Plan

## Current implementation

The password-recovery feature is implemented across the frontend and backend:

```text
account email + recovery email
  -> recovery token
  -> email or WhatsApp OTP
  -> reset token
  -> new password
```

The implementation uses Redis for five-minute recovery, OTP, and reset-token lifetimes. It has separate email and WhatsApp OTPs, one-minute resend cooldowns, five failed-attempt invalidation, Firebase password updates, and a signed Meta WhatsApp webhook.

Key files:

- `frontend/src/pages/ForgotPassword.tsx` - client recovery flow
- `backend/controllers/passwordReset.controller.js` - HTTP handlers
- `backend/services/passwordReset.service.js` - recovery, OTP, and reset logic
- `backend/controllers/whatsappWebhook.controller.js` - Meta webhook verification and processing
- `backend/OTP/PasswordReset/PASSWORD_RECOVERY_API.md` - endpoint and operational documentation

## Current mid-iteration state

- The active working-tree changes are unstaged.
- The password-reset utility has been moved from `backend/OTP/PasswordReset/` to `backend/utils/passwordReset.utils.js`; imports and tests have been updated. It should be committed as an explicit rename rather than an unrelated delete/add pair.
- `backend/.env` is tracked by Git even though `.env` is listed in `.gitignore`. It has uncommitted configuration changes and may expose credentials through repository history.
- Fapshi configuration was added to `.env.example`, but no Fapshi webhook endpoint has been implemented. `backend/routes/index.js` currently contains only placeholder comments.
- Google logout middleware was changed from the local JWT middleware to Firebase-token middleware. The logout controller appears compatible, but this is unrelated to password recovery and should be reviewed and committed independently.
- An untracked `backend/get_fresh_token.js` uses a fixed Firebase UID and prints an ID token. It must not be committed.

## Recommended actions

### 1. Resolve secret-management risk first

1. Remove `backend/.env` from Git tracking while preserving the developer-local file.
2. Keep only sanitized variable names and placeholders in `backend/.env.example`.
3. Rotate every credential that may have existed in Git history: database, Redis, Firebase, email, Meta/WhatsApp, Cloudinary, and payment-provider credentials.
4. Do not commit `backend/get_fresh_token.js`. If a development helper is needed, read its UID from an environment variable and never print reusable authentication tokens.

### 2. Split unrelated work into focused commits

Use separate commits for:

1. Password-reset utility relocation.
2. Password-recovery functional changes.
3. Google logout authentication change.
4. Fapshi work, only when its webhook and payment flow are actually implemented.

This improves review quality and makes rollback safer.

### 3. Fix the recovery-email product mismatch

The user supplies a `recoveryEmail`, but the email OTP is currently sent to `user.email`, not to `user.recoveryEmail`.

Choose one policy and align the UI, API, and documentation:

- Send the OTP to the verified recovery email; or
- Treat the second email only as an account-verification factor, label it accordingly, and clearly explain that the OTP will be sent to the account email.

### 4. Harden password-recovery security

- Add IP- and account-level rate limits to the initial recovery-validation endpoint.
- Revoke active Firebase refresh tokens and invalidate application sessions after a successful password reset.
- Replace the minimum eight-character-only rule with a stronger password policy.
- Disable plaintext OTP logging by default, including in development and shared environments.
- Keep error responses generic enough to avoid leaking whether an account or recovery factor exists.

### 5. Complete WhatsApp delivery handling

The WhatsApp handoff correctly requires a signed inbound user message before sending a free-form OTP. However, a `sent` state only means Meta accepted the outbound request; it does not prove recipient delivery.

- Persist the Meta message ID with the handoff state.
- Process delivery-status callbacks (`sent`, `delivered`, `read`, and `failed`) and update the handoff state where appropriate.
- Keep the approved-template delivery path as the fallback for cases outside Meta's 24-hour customer-service window.

### 6. Expand automated coverage

The current tests pass, but they primarily cover helpers, mocked provider calls, webhook signatures, and route registration. Add isolated integration tests for:

- expired and already-used recovery/reset tokens;
- concurrent OTP verification and reset attempts;
- Firebase-update failure with MongoDB rollback;
- webhook retries and idempotency;
- an end-to-end HTTP recovery flow with MongoDB, Redis, Firebase, email, and Meta clients mocked at their boundaries.

Also separate external Cloudinary smoke scripts from the normal unit-test command so `npm test` does not make real provider calls.

### 7. Polish and release readiness

- Replace garbled UTF-8 text such as `Waiting for your messageâ€¦`.
- Remove placeholder comments for unfinished Fapshi webhook work.
- Fix trailing whitespace in configuration files.
- Code-split the frontend: the current production JavaScript bundle is approximately 769 KB.

## Verification status

At the time this document was created:

- Frontend production build: passed.
- Backend test suite: 22 passing tests.
- The default backend test command also invokes Cloudinary smoke scripts that make real external API calls; this should be changed before treating the suite as fully isolated CI coverage.

## Deployment gate

Do not publicly deploy the password-recovery flow until secret management, the recovery-email policy, rate limiting, session invalidation, and the untracked token helper are resolved.
