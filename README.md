# SIMBBiz

## Local development through ngrok

Start the backend and frontend with `npm run dev` from the repository root. The
frontend runs on port 3000 and proxies `/api` requests to the backend on
`localhost:4000`. Start the ngrok tunnel with `ngrok http 3000` so it serves the
frontend rather than the backend.

Firebase Authentication still checks the frontend's ngrok hostname. Add the
current hostname (without `https://`) to **Firebase Console → Authentication →
Settings → Authorized domains** for the `simbizz` project.