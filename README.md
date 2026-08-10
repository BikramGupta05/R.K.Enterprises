# MERN Authentication App

This repository contains a secure MERN-stack authentication application with:
- Email/password registration and login
- Google OAuth login
- Forgot password and reset password flow
- JWT access tokens and refresh tokens
- HTTP-only secure refresh cookies
- Input validation and rate limiting
- Tailwind CSS powered React frontend

## Folder structure

- `backend/` - Express + MongoDB API
- `frontend/` - Vite + React + Tailwind frontend

## Prerequisites

Make sure the following are installed on your machine:
- Node.js (v18+ recommended) and npm
- MongoDB (local or Atlas connection string)
- Git (optional, for pushing to a remote)

## Quick setup

1. Clone and install deps

```bash
git clone <repo-url>
cd Auth
cd backend && npm install
cd ../frontend && npm install
```

2. Environment files

Copy the backend example env and edit it with your values:

```bash
cd backend
cp .env.example .env
# edit .env with your favorite editor
```

Important: never commit `.env` to source control. Ensure `.gitignore` contains `.env`.

3. Required backend environment variables

Open `backend/.env` and set the following values. Secrets are marked — do not share them.

- NODE_ENV=development
- PORT=5000
- MONGO_URI=mongodb://127.0.0.1:27017/mern-auth (or MongoDB Atlas URI)
- BACKEND_URL=http://localhost:5000
- FRONTEND_URL=http://localhost:5173
- ACCESS_TOKEN_SECRET=<strong-random-string>
- REFRESH_TOKEN_SECRET=<strong-random-string>
- GOOGLE_CLIENT_ID=<google-oauth-client-id>
- GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
- EMAIL_SERVICE=gmail (or leave empty and set EMAIL_HOST/EMAIL_PORT)
- EMAIL_HOST=smtp.gmail.com (optional when using EMAIL_SERVICE)
- EMAIL_PORT=587
- EMAIL_SECURE=false
- EMAIL_USER=your_email@gmail.com
- EMAIL_PASS=<your_app_password_or_smtp_password>
- EMAIL_FROM=your_email@gmail.com

Generate strong secrets locally, for example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Frontend config (Vite)

By default the frontend proxies `/api` to `http://localhost:5000`. If backend chooses another port (the server falls back automatically if 5000 is busy), start the frontend like:

```bash
# if backend started on 5002 for example
VITE_API_URL=http://localhost:5002 npm run dev
```

To set it permanently for dev you can create `frontend/.env.development` with:

```
VITE_API_URL=http://localhost:5000/api
```

(The code reads VITE_API_URL or falls back to `http://localhost:5000` in vite.config.)

## Google OAuth setup

1. Go to Google Cloud Console and create a new OAuth 2.0 Client ID (Credentials → Create Credentials → OAuth client ID).
2. Application type: Web application.
3. Add Authorized redirect URI:

```
http://localhost:5000/api/auth/google/callback
```

4. Copy the Client ID and Client Secret into `backend/.env`.

## Gmail / SMTP (free option)

For development you can use Gmail SMTP (free) by creating an App Password (requires 2-Step Verification):

1. Go to your Google Account → Security → 2-Step Verification → turn it on.
2. Then create an App Password (Mail) and use the 16-character password in `EMAIL_PASS`.
3. Set `EMAIL_USER` and `EMAIL_FROM` to your email address and `EMAIL_SERVICE=gmail`.

Alternative dev options:
- Ethereal (ethereal.email) — fake SMTP service useful for local dev (no real delivery).
- Mailtrap / Brevo / SendGrid (free tiers) — better deliverability for future.

## Run the app locally

1. Start backend

```bash
cd backend
npm run dev
```

The backend will connect to MongoDB and attempt to listen on port 5000. If 5000 is busy it will try the next available port (5001, 5002, ...). The chosen port is printed to the console.

2. Start frontend

```bash
cd ../frontend
npm run dev
```

Open http://localhost:5173 in your browser.

If the backend started on a different port, start the frontend with the correct API URL:

```bash
VITE_API_URL=http://localhost:<backend-port> npm run dev
```

## Test the main flows (manual)

1. Registration
- Go to /register and sign up with a test email.

2. Login
- Use /login. After login the app redirects to the Home page.

3. Google OAuth
- Click Continue with Google and follow the OAuth flow. Ensure your Google Cloud OAuth redirect URI matches the backend.

4. Forgot password / Reset
- Use /forgot-password and enter the account email. The app sends a reset link to the email address.
- Click the reset link (it includes a token). On the reset page, set a new password.
- After reset, log in with the new password.

Notes:
- The app intentionally responds with a generic message when requesting a reset so attackers cannot enumerate emails.
- Reset tokens are single-use and expire (1 hour by default).

## Production & security checklist before push

- Do NOT commit `.env` or sensitive files to git.
- Use stronger production secrets for ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET.
- Use HTTPS in production and set cookie `secure: true` in `utils/token.js`.
- Set proper CORS origins (currently limited to FRONTEND_URL and localhost variants).
- Configure a transactional email provider with SPF/DKIM for production sending.
- Consider adding email verification, MFA, and stricter rate limits in production.

## Troubleshooting

- EADDRINUSE: port already in use → server will try next port. Stop any other server using the same port or restart.
- `Authorization token missing` on protected routes → ensure the frontend has the access token set and attaches it to requests; refresh token flow must have cookies allowed (use the dev proxy or ensure correct origins and credentials).
- 429 Too Many Requests → caused by rapid refresh-token calls or many forgot-password requests. Reload the app and avoid multiple simultaneous refresh attempts. The backend has rate limiting; adjust carefully.
- Email delivery issues → check EMAIL_USER/PASS/EMAIL_SERVICE and provider restrictions. For Gmail use App Passwords.

## Testing and seeding helpers (optional)

You can create a test user directly in MongoDB or by calling the register endpoint. If you want, add a small seed script in `backend/tools/seed.js` that inserts a test user (do not run it in production).

## Deploying / pushing to GitHub

- Add a clear README (this file) and include instructions to set up env variables in CI or the hosting provider.
- Ensure `.env` is in `.gitignore`.

## Contact / support

If you run into issues while setting up, provide:
- Backend console logs (redacted to remove secrets)
- Contents of `frontend/.env.development` if any
- The exact backend port printed at startup

Good luck — when you're ready I can prepare a clean commit message and show a git diff you can push. If you'd like, I can also add a small `backend/tools/seed.js` script and a README section with one-command local test instructions.
