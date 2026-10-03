# Standalone GitHub deployment guide

READY is now a normal React/Vite frontend plus an Express server, Google OAuth callback and database-backed progress API. GitHub can host the source and automate deployment, but **GitHub Pages alone cannot run the OAuth callback, Express API or database**. Use GitHub as the source of truth and deploy the server to a Node-capable host such as Render, Railway, Fly.io, Google Cloud Run or Azure App Service. Keep a managed MySQL/Postgres database with that host.

## 1. Move the repository to GitHub

Create an empty GitHub repository, then from the project root run:

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_NAME/ready.git
git push -u origin main
```

Do not commit `.env` files or OAuth secrets. Add `.env.example` with names only:

```text
APP_ID=ready-production
SESSION_SECRET=replace-with-a-long-random-value
DATABASE_URL=mysql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
PORT=3000
```

## 2. Configure Google OAuth

In Google Cloud Console, create an OAuth client of type **Web application**. Add the exact callback URL for every environment:

```text
https://YOUR_PRODUCTION_DOMAIN/api/google/callback
```

For the current Preview, the callback is:

```text
https://8328-itmlhgofn6vb5e52ttqtq-cb51c435.sg2.manus.computer/api/google/callback
```

Add the production website origin to Authorized JavaScript origins if using a browser-only Google Identity flow. The current READY server flow uses the authorization-code callback and keeps the client secret server-side.

## 3. Deploy the server

Choose a Node service, connect the GitHub repository, and configure:

```bash
pnpm install --frozen-lockfile
pnpm build
node dist/index.js
```

Set the service start command to `node dist/index.js`, expose port `3000` (or honor the host-provided `PORT`), and set the health check to `/api/health`. Add the environment values from `.env.example` in the host dashboard. The production domain must use HTTPS so the Google state and session cookies work correctly.

Run the Drizzle migration against the production database before inviting users:

```bash
pnpm db:migrate
```

## 4. Connect GitHub Actions

Configure the host's GitHub integration or add a workflow that runs on pushes to `main`. GitHub Actions supports push and manual deployment triggers, protected environments and deployment secrets. Use the host's official deploy action or webhook; never put `GOOGLE_CLIENT_SECRET`, `DATABASE_URL` or `SESSION_SECRET` in the repository.

A generic build workflow is:

```yaml
name: Build READY
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.18.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm build
```

Add the provider-specific deploy step only after choosing the host. GitHub Pages is appropriate only for a frontend-only version with localStorage and no server login/progress sync; it is **not** sufficient for this current full product.

## 5. Remove the last Manus dependency

The current code already accepts standalone `APP_ID` and `SESSION_SECRET` values. For a fully Manus-free build, remove the unused Manus Preview compatibility pieces after confirming the production deployment works:

- remove the Manus callback route from `server/_core/oauth.ts`;
- remove `publicPlatformScript` and `/api/platform/config.js` if no other starter component uses them;
- remove Manus-only fallback values from `server/_core/env.ts`;
- remove any remaining unused Manus-only starter imports; the client login helper already uses Google;
- keep Google OAuth, the shared session cookie, the database schema and the progress tRPC procedures.

## References

- [Google Identity](https://developers.google.com/identity)
- [Vite static deployment](https://vite.dev/guide/static-deploy)
- [GitHub Actions deployments](https://docs.github.com/actions/deployment/about-deployments/deploying-with-github-actions)
