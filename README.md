# RShop

RShop is a full-stack Node.js project with SQLite, JWT authentication, and Google OAuth support.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in the required environment variables.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run locally:
   ```bash
   npm start
   ```

## GitHub Push

To push changes to GitHub:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Auto-push helper (Windows)

Run `auto-push.bat` to stage, commit, and push your changes automatically.

## GitHub Actions

A GitHub Actions workflow is included at `.github/workflows/ci.yml`.
It runs on every `push` to `main`, installs dependencies, and checks the Node.js syntax of `server.js`.

## Render Auto Deploy

To enable Render auto deploy:

1. Connect your GitHub repository to Render.
2. Set the deploy branch to `main`.
3. Add the required environment variables in Render Dashboard.
4. Enable automatic deploys in Render.

When GitHub receives a new push to `main`, Render will deploy the latest version automatically.

## Required Environment Variables in Render

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL=https://rshop-marketplace.onrender.com/auth/google/callback`
- `JWT_SECRET`
- `SESSION_SECRET`
- `PORT` (optional)

## Important

- Do not commit `.env` or any secret values to GitHub.
- `.env` is ignored by `.gitignore`.
- Use `.env.example` for placeholder configuration.
