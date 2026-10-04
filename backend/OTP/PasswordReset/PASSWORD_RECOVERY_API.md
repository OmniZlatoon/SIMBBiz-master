# Password recovery API

These public endpoints are mounted under `/api`:

| Method | Endpoint | Request body | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/forget-password` | `{ "email", "recoveryEmail" }` | Validate the account and return a short-lived `recoveryToken`. |
| POST | `/auth/forget-password/email` | `{ "recoveryToken" }` | Send an OTP to the account email, then confirm delivery. |
| POST | `/auth/forget-password/whatsapp` | `{ "recoveryToken" }` | Create a short-lived `wa.me` handoff link for the user to initiate a message from their registered number. |
| POST | `/auth/forget-password/whatsapp/status` | `{ "recoveryToken", "handoffToken" }` | Poll the handoff; the status becomes `sent` after the inbound message is verified and OTP delivery is accepted. |
| POST | `/auth/forget-password/verify-otp` | `{ "recoveryToken", "otp" }` | Verify the 8-digit OTP and return a short-lived, one-use `resetToken`. |
| POST | `/auth/reset-password` | `{ "email", "resetToken", "newPassword", "confirmPassword" }` | Update the MongoDB and linked Firebase Authentication passwords. |
| GET | `/webhooks/whatsapp` | Meta verification query | Verify the Meta webhook callback. |
| POST | `/webhooks/whatsapp` | Meta webhook payload | Validate Meta signature, process password-reset handoff messages, and log delivery status. |

Only local accounts whose submitted recovery email matches the account can reset their password. Start with `/auth/forget-password` and pass its `recoveryToken` to an OTP delivery route and then to OTP verification. For WhatsApp, request a handoff link, open it, and send its prefilled `SIMBBIZ RESET <code>` message from the account's registered WhatsApp number. Meta's signed inbound-message webhook validates the sender and one-time code, then requests the OTP delivery. The client polls the handoff status route until it reports `sent`, then enters the OTP. The user must tap Send and return to the recovery page; WhatsApp does not automatically redirect back to the website. Handoff codes expire after 5 minutes and are single-use. Email and WhatsApp have independent one-minute resend cooldowns and independent OTPs. OTPs and reset tokens expire after 5 minutes; five invalid attempts invalidate that channel's OTP, and successfully verifying either OTP invalidates all active channel codes. Reset tokens are one-use. Passwords must be at least eight characters.

## Testing with Postman

Import [Password Recovery.postman_collection.json](./Password%20Recovery.postman_collection.json) into Postman. Set the collection variables `accountEmail` and `recoveryEmail`, then run the validation request. Its test script saves the returned `recoveryToken`. Email OTP delivery can be tested directly. For WhatsApp, the app's forgot-password page creates the handoff, opens the provided link, and polls status after the user sends the message. Set the `otp` variable to the delivered 8-digit code and run Verify OTP; its test script saves the returned `resetToken`. Finally, run Reset password.

The default `baseUrl` is `http://localhost:4000/api`. Start the backend from `backend` with `npm run dev` or `npm start`. The server must be able to connect to MongoDB and Redis; email delivery requires `EMAIL_USER` and `EMAIL_PASS` in `backend/.env`. For Gmail, enable 2-step verification on the sending account, create an App Password, and put the Gmail address in `EMAIL_USER` and the generated App Password in `EMAIL_PASS` (not the normal account password). `EMAIL_SERVICE` defaults to `gmail`; restart the backend after changing these values.

## WhatsApp delivery constraint

The account's `whatsappNumber` must include the international country calling code (E.164), for example `+15551234567`. Spaces, parentheses, hyphens, periods, slashes, and the international `00` prefix are normalized before sending. A local number without its country code cannot be safely converted because the correct destination is ambiguous.

The recovery page uses Meta's configured WhatsApp business number to build a `wa.me` link with a one-time handoff command. The user's inbound message opens the 24-hour customer-service window; only after the signed webhook validates that message does the backend send the OTP as a free-form text message. The registered account number must match the WhatsApp sender. If the user doesn't send the message, no OTP is sent.

A `sent` handoff status means Meta accepted the OTP send request; it does not confirm that the recipient received it. Configure `https://<your-public-host>/api/webhooks/whatsapp` in the Meta app, set `WEBHOOK_VERIFY_TOKEN` and `META_APP_SECRET` in `backend/.env`, and subscribe the WhatsApp webhook to `messages`. Delivery receipts (`sent`, `delivered`, `read`, or `failed`) are logged with the message ID. The default OTP message includes the exact generated OTP; formatting asterisks are WhatsApp bold markers.

To deliver OTPs outside an open customer-service window, create and get an authentication/OTP template approved in WhatsApp Manager, then implement/configure that template with the correct language and OTP button format before enabling that delivery path.

## Required environment configuration

- `REDIS_URI`
- `EMAIL_USER` and `EMAIL_PASS` for email OTP delivery
- OTP lifecycle logs (generated, validated, expired) are enabled by default when `NODE_ENV` is not `production`; set `OTP_DEBUG_LOGGING=false` to disable them. The generated, validated, and timed-out codes are printed only outside production. Never enable OTP logging in production.
- `META_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `META_GRAPH_API_VERSION` for WhatsApp; the access token must be allowed to read the configured phone number's display number.
- `WEBHOOK_VERIFY_TOKEN` and `META_APP_SECRET` for Meta webhook verification and signature validation.
- `WHATSAPP_OTP_MESSAGE_TEMPLATE` optionally customizes the WhatsApp text; it must include `{{otp}}`. `{{expiresMinutes}}` is also supported.

Use `.env.example` as a key reference. Do not commit `.env`.
