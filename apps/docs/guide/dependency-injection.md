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

Prefer extending `Service` from `@nexorajs/core` for a child logger and a consistent base — see [Classes](classes.md).

Plugins can register their own services during `onLoad`. Prefer tokens / symbols over stringly-typed globals.
