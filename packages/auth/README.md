# @nexora.ts/auth

Discord OAuth, session management, and permission checks for the Nexora dashboard.

```ts
import { createAuthService, Permissions } from '@nexora.ts/auth';

const auth = createAuthService(config.auth!, repos);
const url = auth.oauth.getAuthorizationUrl(state);
const session = await auth.sessions.validateSession(token);
const ok = await auth.permissions.hasPermission(userId, guildId, Permissions.MANAGE_SETTINGS);
```

## Includes

- OAuth authorize + token exchange
- Session create / validate / destroy
- Role-based dashboard permissions

## License

MIT
