/** Cache entry with optional TTL */
interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

/** Cache adapter interface */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
}

/**
 * In-memory cache adapter.
 *
 * @example
 * const adapter = new MemoryCacheAdapter(60_000);
 * await adapter.set('key', { ok: true }, 5_000);
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Creates an in-memory adapter with periodic expiry cleanup.
   *
   * @param cleanupIntervalMs - How often to sweep expired keys (default 60_000)
   * @example
   * const adapter = new MemoryCacheAdapter(30_000);
   */
  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = [...this.store.keys()];
    if (!pattern) return allKeys;

    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return allKeys.filter((key) => regex.test(key));
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Cache manager with adapter pattern.
 *
 * @example
 * const cache = new Cache(new MemoryCacheAdapter(), 60_000);
 * await cache.set('user:1', { name: 'Ada' });
 * const user = await cache.get<{ name: string }>('user:1');
 */
export class Cache {
  /**
   * Creates a cache facade over an adapter.
   *
   * @param adapter - Storage backend (e.g. {@link MemoryCacheAdapter})
   * @param defaultTtl - Default TTL in ms applied when `set` omits ttl
   * @example
   * const cache = new Cache(new MemoryCacheAdapter(), 60_000);
   */
  constructor(
    private readonly adapter: CacheAdapter,
    private readonly defaultTtl?: number,
  ) {}

  /**
   * Get a cached value.
   *
   * @param key - Cache key
   */
  async get<T>(key: string): Promise<T | undefined> {
    return this.adapter.get<T>(key);
  }

  /**
   * Set a cached value.
   *
   * @param key - Cache key
   * @param value - Value to store
   * @param ttlMs - Optional TTL in ms (falls back to constructor default)
   */
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    await this.adapter.set(key, value, ttlMs ?? this.defaultTtl);
  }

  /**
   * Get an existing value or compute, store, and return it.
   *
   * @param key - Cache key
   * @param factory - Async factory when the key is missing
   * @param ttlMs - Optional TTL for the stored value
   * @example
   * const data = await cache.getOrSet('expensive', () => fetchData(), 10_000);
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs?: number): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== undefined) return existing;

    const value = await factory();
    await this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Delete a single key.
   *
   * @param key - Cache key
   */
  async delete(key: string): Promise<boolean> {
    return this.adapter.delete(key);
  }

  /**
   * Delete all keys matching a glob-like pattern (`*` wildcard).
   *
   * @param pattern - Pattern such as `user:*`
   * @returns Number of keys removed
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.adapter.keys(pattern);
    for (const key of keys) {
      await this.adapter.delete(key);
    }
    return keys.length;
  }

  /** Clear the entire cache */
  async clear(): Promise<void> {
    await this.adapter.clear();
  }
}
