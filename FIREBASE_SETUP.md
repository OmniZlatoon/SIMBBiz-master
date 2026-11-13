# Firebase Admin Setup

This backend initializes Firebase Admin at startup through `backend/firebase/initializeFirebase.js` and loads it from `backend/server.js`.

## What is configured

- Firebase Admin SDK is initialized when the backend starts.
- The app expects a local service-account JSON file at:
  - `backend/firebase/firebaseConfig.json`
- The file is intentionally kept local and ignored by git so credentials are not pushed to the repository.

## Prerequisites

- A Firebase project with Admin SDK enabled.
- A Google Cloud service account with Firebase Admin permissions.
- A service-account JSON key generated from Firebase or Google Cloud.

## Developer setup guide

1. Create or open your Firebase project.
2. Go to Project Settings > Service accounts.
3. Click "Generate new private key".
4. Download the JSON file.
5. Save it as:
   - `backend/firebase/firebaseConfig.json`
6. Keep the file local to your machine and do not commit it.
7. Start the backend:
   - `cd backend`
   - `npm start`
8. Confirm the server logs show:
   - `✅ Firebase Admin SDK initialized successfully.`
   - `✅ Firebase Auth ready`

## Important notes

- The file `backend/firebase/firebaseConfig.json` is excluded from git via `backend/.gitignore`.
- Do not paste private keys into source-controlled files or shared docs.
- If a developer uses a different Firebase project, they only need to replace that local JSON file and restart the backend.

## Troubleshooting

If Firebase initialization fails:

- Verify the JSON file exists at `backend/firebase/firebaseConfig.json`.
- Confirm the service account has the required IAM permissions.
- Ensure the file is valid JSON and not truncated.
- Restart the backend after updating the credentials.
