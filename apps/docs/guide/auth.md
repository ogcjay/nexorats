# Auth

`@nexora.ts/auth` provides Discord OAuth, session management, and permission checks for the dashboard.

## Flow

1. User hits Discord OAuth authorize URL
2. Exchange code → Discord profile
3. Upsert user in the database
4. Create signed session cookie / bearer token
5. API routes validate session + guild permissions

## Permissions

Built-in permission constants include:

- `view:dashboard`
- `manage:settings`
- `manage:plugins`
- `manage:users`
- `view:logs`
- `view:stats`
- `admin`

Role defaults map owner / admin / moderator / member to these permissions.

## Security notes

- Never trust the client for permission checks
- Keep `clientSecret` and `DASHBOARD_SECRET` in env only
- Prefer short-lived sessions and secure cookies in production
