# Deploy With a Real Domain

This project serves both API and UI from the same Node server, so one custom domain is enough.

## 1) Deploy the app service

Use any host that supports Node.js (`npm start`) such as Railway, Render, Fly, Heroku, or AWS.

- Build command: `npm install`
- Start command: `npm start`
- Node version: 18+

## 2) Set production environment variables

Set these in your hosting provider:

- `NODE_ENV=production`
- `PUBLIC_BASE_URL=https://boomerang.yourdomain.com`
- `ALLOWED_ORIGINS=https://boomerang.yourdomain.com`
- `AUTH0_DOMAIN=...`
- `AUTH0_CLIENT_ID=...`
- `AUTH0_CLIENT_SECRET=...`
- `AUTH0_API_AUDIENCE=...`
- `TOKEN_VAULT_URL=...`
- `TOKEN_VAULT_API_KEY=...`

Optional:

- `TABLEAU_SERVER=...`
- `TABLEAU_SITE=...`
- `TABLEAU_USERNAME=...`

## 3) Attach your custom domain in the host

In your hosting dashboard, add `boomerang.yourdomain.com` as a custom domain.
Your host will show required DNS records.

Typical DNS patterns:

- `CNAME` for subdomain: `boomerang -> <host-target>`
- If apex/root domain is required, use your provider's `ALIAS`/`ANAME` instructions.

## 4) Configure DNS at your registrar

Create the exact DNS records your host gave you and wait for propagation.
This can take a few minutes to a few hours.

## 5) Verify domain + app behavior

Run after DNS and SSL are ready:

```bash
curl -sS https://boomerang.yourdomain.com/health
```

Expect JSON with:

- `"status":"ok"`
- `"publicBaseUrl":"https://boomerang.yourdomain.com"`

Then open:

- `https://boomerang.yourdomain.com/`

## 6) Verify generated share links use your domain

Create a boomerang:

```bash
curl -sS -X POST https://boomerang.yourdomain.com/api/boomerangs \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{
    "name": "Production Data Collection",
    "requiredFields": [
      { "name": "Team Name", "type": "string" },
      { "name": "Q1 Primary Metric", "type": "number" }
    ]
  }'
```

Confirm `shareUrl` starts with:

- `https://boomerang.yourdomain.com/?boomerang=...`
