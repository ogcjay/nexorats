# Dependency injection

Nexora uses a per-instance `Container` — **no global singletons**.

```ts
import { TOKENS } from '@nexorajs/core';

const logger = bot.container.resolve(TOKENS.Logger);
const cache = bot.container.resolve(TOKENS.Cache);
```

## Register services

```ts
bot.container.registerSingleton('MyService', () => new MyService());
bot.container.registerInstance('ConfigFlag', true);
```

Plugins can register their own services during load. Prefer tokens / symbols over stringly-typed globals.
