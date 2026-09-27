## JWT and Firebase Authentication Integration

This project uses two different authentication mechanisms, each with a different responsibility:

- Firebase Authentication is used to verify the identity of a user from Firebase and to validate email ownership.
- JWT (JSON Web Token) is used as the app's own session/access token for protected backend routes.

The two tokens are complementary, not interchangeable.

## Core principle

Firebase tokens answer questions like:

- Is this Google user actually authenticated by Firebase?
- Does the supplied Firebase account own this email?
- Is the email verified in Firebase?

JWT tokens answer questions like:

- Which application user is making this request?
- Is this user allowed to access this protected route?

In short:

- Firebase token: identity verification
- JWT: application authorization

## Where this is implemented

Relevant backend files:

- [backend/controllers/authController.js](backend/controllers/authController.js)
- [backend/middleware/auth.js](backend/middleware/auth.js)
- [backend/models/User.js](backend/models/User.js)

## Why both are needed

Firebase and JWT solve different problems.

Firebase is useful because:

- Google sign-in is handled via Firebase Auth
- Firebase verifies email ownership and `email_verified`
- Firebase provides a trusted `uid` and access to user identity metadata

JWT is useful because:

- the app needs a lightweight internal session token
- backend routes need to authorize access without querying Firebase on every request
- the app can keep user identity tied to a MongoDB user document

## JWT flow in the app

The backend creates a JWT when a user successfully logs in or registers:

```js
const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
  expiresIn: config.JWT_EXPIRE
});
```

This JWT is then sent back to the client in the `token` cookie or Authorization header, and the application uses it on later requests.

The app server verifies the JWT in the middleware:

```js
const decoded = jwt.verify(token, config.JWT_SECRET);
req.user = await User.findById(decoded.id).select('-password');
```

This means all protected API routes rely on the JWT to establish the authenticated user.

## Firebase flow in the app

Firebase is used in the auth controller before the app creates or confirms a user record.

Examples:

- Google sign-in verifies the Firebase ID token
- Local registration verifies that the Firebase token belongs to the same email
- Firebase email verification confirms the user owns the email address

```js
const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
```

The backend checks:

- the token is valid
- the email inside the Firebase token exists
- the email matches the submitted registration email
- the email is verified in Firebase when required

## How the two correlate with each other

The system works in this order:

1. User authenticates with Firebase (Google login or Firebase email verification)
2. Backend verifies the Firebase token and confirms the identity/email ownership
3. Backend creates or updates the MongoDB user record with Firebase values such as:
   - `firebaseUid`
   - `email`
   - `emailVerified`
   - `authProvider`
4. Backend generates an application JWT for the user
5. Protected routes use the JWT to authorize the user

This creates a bridge between Firebase identity and app access control.

## Local registration flow

For a normal local sign-up, the backend validates the form and then verifies the user identity with Firebase before saving the record.

### Registration checks

The controller validates:

- required fields are present
- password and confirmPassword match
- password length is valid
- email format is valid
- recovery email format is valid

Then it calls Firebase verification logic:

```js
const firebaseEmailError = await verifyFirebaseEmailOwnership({
  email,
  firebaseIdToken,
  emailVerified
});
```

The Firebase validation confirms that:

- a Firebase ID token was supplied
- the token can be decoded successfully
- the decoded email matches the local email
- the email is either Firebase-verified or explicitly marked as verified by the app

If all checks pass, the user is saved to MongoDB and a JWT is issued.

## Google sign-in flow

Google sign-in is handled by Firebase ID token verification.

```js
const { idToken } = req.body;
const decodedToken = await admin.auth().verifyIdToken(idToken);
```

Once decoded, the backend:

- gets the Firebase `uid`
- gets the Google account email
- finds or creates the user in MongoDB
- stores `firebaseUid` and `authProvider: 'google'`
- sets `emailVerified` from Firebase
- issues a JWT for the app session

This means the user can log in with Google while the backend still uses the app JWT for authorization in subsequent requests.

## Firebase email verification flow

Firebase email verification is used to ensure that the email belongs to the authenticated user.

This matters when:

- a user signs up locally using an email
- a user registers a recovery email
- a user logs in through Google and needs the email ownership confirmed

The backend checks the Firebase token and compares the Firebase-verified email to the user-provided email:

```js
if (firebaseEmail !== normalizedEmail) {
  return 'The Firebase verified email must match the local sign-in email';
}
```

If verification fails, the user cannot proceed with registration or account linking.

## Protected route authorization

After the user logs in, the app no longer needs to check Firebase for every route. Instead, the protected middleware relies on the JWT:

```js
if (req.cookies.token) {
  token = req.cookies.token;
} else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
  token = req.headers.authorization.split(' ')[1];
}

const decoded = jwt.verify(token, config.JWT_SECRET);
req.user = await User.findById(decoded.id).select('-password');
```

This ensures that API requests are authorized using the app's JWT, not the Firebase token.

## Recommended architecture

The recommended pattern for this project is:

- Firebase token = identity and email verification gate
- JWT = application session/access token
- MongoDB user record = source of truth for app-level user data

This gives the system a clean separation of responsibilities:

1. Firebase proves who the user is
2. MongoDB stores the user profile
3. JWT tells the backend who is allowed to access protected resources

## Practical rules

Use Firebase token when:

- signing in with Google
- verifying a user email
- checking whether the email belongs to the current Firebase user

Use JWT when:

- authorizing requests to protected routes
- identifying the user inside the backend
- managing app-level session access

## Important security note

The Firebase token should not be treated as the app's long-lived session token.

It is intended for short-lived identity validation and should not replace the JWT for backend route authorization. The app should continue using the JWT for all authenticated API requests after login is complete.

## Summary

The current setup is designed correctly for a hybrid auth pattern:

- Firebase handles identity and email validation
- JWT handles application authorization
- both are linked through the user's MongoDB record and Firebase UID

This architecture keeps the system secure, predictable, and aligned with both Firebase and application-level session management.
