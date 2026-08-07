# Cache & scheduler

## Cache

In-memory cache with TTL and pattern invalidation (Redis adapter planned).

```ts
await bot.cache.set('guild:123:prefix', '!', 60_000);
const prefix = await bot.cache.get<string>('guild:123:prefix');
```

## Scheduler

Cron, intervals, and delayed tasks:

```ts
bot.scheduler.scheduleInterval('stats', 'Publish stats', 60_000, async () => {
  // …
});

bot.scheduler.scheduleCron('daily', 'Daily job', '0 0 * * *', async () => {
  // …
});
```
