# TradersLink Auth

Last audited: 2026-07-21.

## Scope

Current website auth uses Discord login for Academy progress and Premium watchlist access. Academy content remains public; logging in is only required there when a Discord server member wants to save progress. The shared shell calls `/api/me` and shows either a Discord login link or the current Academy user display name.

## Routes

- Login: `GET /api/auth/discord/login`
- Callback: `GET /api/auth/discord/callback`
- Logout: `POST /api/auth/logout`
- Session status: `GET /api/me`

## Cookies

- Session cookie: `tl_academy_session`
- OAuth state cookie: `tl_academy_oauth_state`
- OAuth prompt cookie: `tl_academy_oauth_prompt`
- OAuth return-target cookie: `tl_academy_oauth_return_to`
- Session TTL: 30 days
- Production domain: `.traderslink.pro`, with host-only cleanup for legacy cookies
- SameSite: `Lax`
- HttpOnly: yes
- Secure: production only

## Discord OAuth

Scopes:

- `identify`
- `guilds`
- `guilds.members.read`

The login route first tries `prompt=none` unless the user explicitly requests consent. If Discord requires user interaction or consent, the callback retries once with `prompt=consent`. Repeated authorization prompts usually mean one of these is wrong:

- Session cookie is not being set or sent for the active domain.
- `DISCORD_REDIRECT_URI` does not exactly match the registered Discord callback and site origin.
- The user is not in the configured Discord guild.
- Production is missing `ACADEMY_DATABASE_URL` or `DATABASE_URL`, causing session creation to fail.
- Browser privacy settings or cross-domain redirects are blocking the cookie.

The login route accepts only same-origin relative `returnTo` paths and defaults to `/watchlist`. The callback preserves that path through silent-login fallback and returns the user to the exact page that started authentication.

## Authorization Boundaries

- Academy pages are public.
- Saving Academy progress requires a Discord login from a member of the configured TradersLink server. Premium is not required.
- Live watchlist pages, archive pages, and read/stream APIs additionally require the Discord role configured by `TRADERSLINK_PREMIUM_DISCORD_ROLE_ID` or `DISCORD_PREMIUM_ROLE_ID`.
- A server member without Premium can retain an Academy progress session, but watchlist pages and APIs remain blocked.
- The watchlist access screen offers a Discord role refresh so a member who was newly granted Premium can update the roles stored with the website session.

## Storage

Academy users, sessions, and completed lesson slugs are stored by `src/lib/academy/academy-progress-store.ts`.

Production must use `ACADEMY_DATABASE_URL` or `DATABASE_URL`. Local SQLite fallback is intentionally blocked in production.

## Academy Logged-In UX

`app/academy/page.tsx` hides the "Save your place as you learn" logged-out card when a valid Academy session exists, and also suppresses it immediately after `?auth=connected`.
