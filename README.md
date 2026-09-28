# LifeCare Point Laboratory

Production-oriented React/Vite website with secure Vercel serverless APIs, Supabase persistence, WhatsApp Business notifications, layered rate limiting, and Vercel deployment support.

## Security architecture

```text
Browser
  |
  | same-origin HTTPS POST only
  v
Vercel API Functions (/api/*)
  |
  +--> server-side validation
  +--> Vercel-derived client IP
  +--> atomic Supabase rate-limit RPC
  +--> mobile-number abuse limit
  +--> duplicate-submission limit
  +--> Supabase service-role database write
  +--> Meta WhatsApp Cloud API (server-side token only)
```

The WhatsApp access token and Supabase service-role key must never be placed in React/Vite variables or shipped to the browser.

## Environment variables

Copy `frontend/.env.example` to the environment used by Vercel. Do not commit the real `.env` file.

Server-only values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IP_HASH_SALT`
- `APP_ORIGIN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_NOTIFICATION_RECIPIENT`
- `META_GRAPH_API_VERSION`

Public/browser value:

- `VITE_API_URL=/api`

## Supabase

Run `frontend/supabase/migrations/20260928_production_security.sql` in the Supabase SQL editor before production use.

The migration enables RLS and deliberately creates no public policies for the sensitive booking, enquiry, analytics, or rate-limit tables. The Vercel API uses the service-role key server-side.

## Rate limiting

The API uses multiple independent controls:

1. Global per-IP limit across form APIs.
2. Endpoint-specific per-IP limit.
3. Per-mobile-number limit using a salted hash.
4. Duplicate-submission fingerprint limit.
5. Request body-size limit.
6. Origin validation in production.
7. Atomic PostgreSQL advisory locking so concurrent requests cannot bypass the same bucket.

IP addresses are derived from Vercel-provided request headers, not from a browser-supplied form field. Vercel documents that it overwrites `X-Forwarded-For` with the public client IP to prevent IP spoofing.

IP rotation cannot be made impossible on the public Internet. For stronger bot/abuse protection, enable Vercel Firewall rate limiting and Bot Protection for `/api/bookings`, `/api/enquiries`, and `/api/events` after deployment.

Recommended production starting points:

- `/api/bookings`: 5/IP/15 minutes + 3/mobile/hour + duplicate block/10 minutes.
- `/api/enquiries`: 5/IP/15 minutes + 3/mobile/hour + duplicate block/10 minutes.
- `/api/events`: 30/IP/minute plus a separate global event cap.

Tune these after observing legitimate traffic.

## GitHub + Vercel deployment

1. Commit the project to the existing GitHub repository.
2. In Vercel, import that same GitHub repository.
3. Set the Vercel project Root Directory to `frontend`.
4. Use the Vite build command from `frontend/package.json` (`npm run build`).
5. Set the Vercel environment variables for Production, Preview, and Development as appropriate.
6. Apply the Supabase migration.
7. Set `APP_ORIGIN` to the exact production origin, for example `https://devuat.lifecarepointlaboratory.com`.
8. Configure Vercel Firewall/Bot Protection for the API routes.
9. Deploy and test direct route refreshes, forms, Supabase inserts, WhatsApp delivery, rate limiting, and mobile/desktop UI.

## Important credential action

If a WhatsApp token was ever committed or exposed in the old project, revoke/rotate it in Meta before production deployment. Removing it from the current source is not enough if the credential was previously exposed.
