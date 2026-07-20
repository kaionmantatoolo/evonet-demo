# Evonet Drop-in Demo

Local demo app for testing Evonet Drop-in + interaction session creation.

## Setup

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Fill in `.env.local` values (see UAT / PROD switch below).

3. Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000/evonet/dropin-test`.

## UAT / PROD switch

Store **both** credential sets once, then switch with one variable:

| Variable | Values | Role |
|----------|--------|------|
| `NEXT_PUBLIC_EVONET_TARGET` | `UAT` or `PROD` | Picks Interaction URL + credentials **and** UI / Drop-in defaults |

Change it on Vercel, then **Redeploy**.

On **Drop-in Dev Console**, tap the environment chip next to the title **5 times** within 2 seconds to runtime-toggle UAT ↔ PROD (UI + session credentials). Preference is kept in `sessionStorage` for that tab; both credential sets must be configured on the server.

| Target | Interaction URL (default) | Credentials | Drop-in env |
|--------|---------------------------|-------------|-------------|
| `UAT` | `https://sandbox.evonetonline.com/interaction` | `EVONET_UAT_SIGN_KEY`, `EVONET_UAT_KEY_ID`, `EVONET_UAT_STORE_ID` | `UAT` |
| `PROD` | `https://api.evonetonline.com/interaction` | `EVONET_PROD_SIGN_KEY`, `EVONET_PROD_KEY_ID`, `EVONET_PROD_STORE_ID` | `HKG_prod` |

Optional URL overrides: `EVONET_UAT_INTERACTION_URL`, `EVONET_PROD_INTERACTION_URL`.

Legacy `EVONET_SIGN_KEY` / `EVONET_KEY_ID` / `EVONET_STORE_ID` / `EVONET_INTERACTION_URL` still work as fallback when the target-prefixed vars are unset.

Optional: `NEXT_PUBLIC_EVONET_ENVIRONMENT` overrides the Drop-in environment string derived from the target.
