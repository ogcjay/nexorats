# @nexora.ts/auth

Discord OAuth, sessions, and dashboard permissions.

```ts
import { createAuthService } from '@nexora.ts/auth';

const auth = createAuthService(config.auth!, repos);
const url = auth.oauth.getAuthorizationUrl(state);
```

See [Auth](../guide/auth.md).
