## Description

Add account password recovery with email or WhatsApp OTP delivery, signed WhatsApp webhook handling, and password updates across MongoDB and Firebase Authentication. Add the forgot-password page, API documentation, and Postman collection.

## Type of Change

- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [x] Documentation update

## Files Modified

- Backend: password-reset services and delivery helpers, controllers, routes, webhook raw-body/signature handling, OTP utilities, and environment example.
- Backend tests: password-reset, route-registration, and WhatsApp webhook coverage.
- Backend documentation: recovery API guide and Postman collection.
- Frontend: forgot-password page and route, API error/auth-header handling, and API endpoint configuration.
- `PR_DESCRIPTION.md`

## Testing

- [x] Tested locally
- [x] Added unit tests
- [ ] Tested on Stellar Testnet (for wallet/contract changes)
- Frontend production build: passed.
- Password-reset and WhatsApp tests: passed; route-registration test timed out.

## Code Quality checks

- Frontend TypeScript and production build passed.
- Full backend suite: 21 passed, 1 failed because the route-registration test's spawned Node process exceeded its 15-second timeout.
- Stellar Testnet testing is not applicable.

# Behavioural Changes

- Local accounts can verify a recovery email and request a five-minute OTP by email or WhatsApp.
- WhatsApp recovery requires the user to initiate a prefilled message from their registered number; signed Meta webhooks validate the handoff before OTP delivery.
- OTPs have resend cooldowns and attempt limits; verified reset tokens are single-use and update both MongoDB and Firebase passwords.
- The Vite configuration now defaults API requests to the configured ngrok backend endpoint.

## Tests Errors

- `backend/tests/passwordResetRoutes.test.js`: timed out while loading and inspecting the router in a spawned Node process (15-second timeout). All other focused password-reset and webhook tests passed.
