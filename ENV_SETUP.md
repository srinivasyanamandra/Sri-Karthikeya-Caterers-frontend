# Environment Configuration Guide

## Single Source of Truth for API URL

The backend API URL is configured through environment variables - **NO hardcoded URLs in the code**.

## Files

- **`.env`** - Local development (git-ignored, created for you)
- **`.env.production`** - Production build (committed to git)
- **`.env.example`** - Template/documentation (committed to git)
- **`.env.local`** - Optional local overrides (git-ignored)

## Usage

### Local Development (Default)
```bash
npm start
```
Uses `.env` → `http://localhost:8080`

### Production Build
```bash
npm run build
```
Uses `.env.production` → `https://skc-backend-5o4z.onrender.com`

### Custom Local Backend
Create `.env.local`:
```bash
REACT_APP_API_URL=http://localhost:3000
```

## Environment Variable Priority

React loads env files in this order (later overrides earlier):
1. `.env` - Default for all environments
2. `.env.local` - Local overrides (git-ignored)
3. `.env.production` - Production builds only
4. `.env.production.local` - Production local overrides (git-ignored)

## Changing the Production URL

Edit `.env.production`:
```bash
REACT_APP_API_URL=https://your-new-backend-url.com
```

## Troubleshooting

If you see "API URL configuration is missing":
1. Make sure `.env` file exists in the project root
2. Check that `REACT_APP_API_URL` is set
3. Restart the dev server (`npm start`)

## Important Notes

- Environment variables must start with `REACT_APP_` to be accessible
- Changes to `.env` files require restarting the dev server
- `.env.local` is never committed to git (for secrets/local config)
- `.env` is git-ignored but `.env.production` is committed
