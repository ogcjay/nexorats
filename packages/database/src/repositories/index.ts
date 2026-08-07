import { eq, and } from 'drizzle-orm';
import type { Database } from '../client.js';
import {
  users,
  sessions,
  guildSettings,
  guildMembers,
  pluginStates,
  auditLogs,
} from '../schema/index.js';
import type { NewUser, User, GuildSetting } from '../schema/index.js';

/** Base repository with common CRUD operations */
abstract class BaseRepository {
  constructor(protected readonly db: Database) {}
}

/** User repository */
export class UserRepository extends BaseRepository {
  async findById(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async findByDiscordId(discordId: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1);
    return result[0];
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.db.insert(users).values(data).returning();
    return result[0]!;
  }

  async upsertByDiscordId(data: NewUser): Promise<User> {
    const existing = await this.findByDiscordId(data.discordId);
    if (existing) {
      const result = await this.db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, existing.id))
        .returning();
      return result[0]!;
    }
    return this.create(data);
  }
}

/** Session repository */
export class SessionRepository extends BaseRepository {
  async findByToken(token: string) {
    const result = await this.db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    return result[0];
  }

  async create(userId: string, token: string, expiresAt: Date) {
    const result = await this.db.insert(sessions).values({ userId, token, expiresAt }).returning();
    return result[0]!;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteExpired(): Promise<void> {
    const { lt } = await import('drizzle-orm');
    await this.db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }
}

/** Guild settings repository */
export class GuildSettingsRepository extends BaseRepository {
  async get(guildId: string, key: string): Promise<unknown | undefined> {
    const result = await this.db
      .select()
      .from(guildSettings)
      .where(and(eq(guildSettings.guildId, guildId), eq(guildSettings.key, key)))
      .limit(1);
    return result[0]?.value;
  }

  async set(guildId: string, key: string, value: unknown): Promise<GuildSetting> {
    const existing = await this.db
      .select()
      .from(guildSettings)
      .where(and(eq(guildSettings.guildId, guildId), eq(guildSettings.key, key)))
      .limit(1);

    if (existing[0]) {
      const result = await this.db
        .update(guildSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(guildSettings.id, existing[0].id))
        .returning();
      return result[0]!;
    }

    const result = await this.db.insert(guildSettings).values({ guildId, key, value }).returning();
    return result[0]!;
  }

  async getAll(guildId: string): Promise<Record<string, unknown>> {
    const results = await this.db
      .select()
      .from(guildSettings)
      .where(eq(guildSettings.guildId, guildId));

    const settings: Record<string, unknown> = {};
    for (const row of results) {
      settings[row.key] = row.value;
    }
    return settings;
  }
}

/** Guild member repository */
export class GuildMemberRepository extends BaseRepository {
  async findByGuildAndUser(guildId: string, userId: string) {
    const result = await this.db
      .select()
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, userId)))
      .limit(1);
    return result[0];
  }

  async findByGuild(guildId: string) {
    return this.db.select().from(guildMembers).where(eq(guildMembers.guildId, guildId));
  }
}

/** Plugin state repository */
export class PluginStateRepository extends BaseRepository {
  async getState(guildId: string, pluginName: string) {
    const result = await this.db
      .select()
      .from(pluginStates)
      .where(and(eq(pluginStates.guildId, guildId), eq(pluginStates.pluginName, pluginName)))
      .limit(1);
    return result[0];
  }

  async setEnabled(guildId: string, pluginName: string, enabled: boolean) {
    const existing = await this.getState(guildId, pluginName);
    if (existing) {
      const result = await this.db
        .update(pluginStates)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(pluginStates.id, existing.id))
        .returning();
      return result[0]!;
    }
    const result = await this.db
      .insert(pluginStates)
      .values({ guildId, pluginName, enabled })
      .returning();
    return result[0]!;
  }
}

/** Audit log repository */
export class AuditLogRepository extends BaseRepository {
  async create(data: {
    guildId?: string;
    userId?: string;
    action: string;
    details?: Record<string, unknown>;
  }) {
    const result = await this.db.insert(auditLogs).values(data).returning();
    return result[0]!;
  }

  async findByGuild(guildId: string, limit = 50) {
    const { desc } = await import('drizzle-orm');
    return this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.guildId, guildId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

/** Repository factory — creates all repositories from a single DB instance */
export class RepositoryFactory {
  readonly users: UserRepository;
  readonly sessions: SessionRepository;
  readonly guildSettings: GuildSettingsRepository;
  readonly guildMembers: GuildMemberRepository;
  readonly pluginStates: PluginStateRepository;
  readonly auditLogs: AuditLogRepository;

  constructor(db: Database) {
    this.users = new UserRepository(db);
    this.sessions = new SessionRepository(db);
    this.guildSettings = new GuildSettingsRepository(db);
    this.guildMembers = new GuildMemberRepository(db);
    this.pluginStates = new PluginStateRepository(db);
    this.auditLogs = new AuditLogRepository(db);
  }
}
