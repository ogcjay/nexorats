import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/** Users table — Discord OAuth users */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  discordId: text('discord_id').notNull().unique(),
  username: text('username').notNull(),
  discriminator: text('discriminator'),
  avatar: text('avatar'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Sessions table */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Guild settings table */
export const guildSettings = pgTable(
  'guild_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id').notNull(),
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('guild_settings_guild_key_idx').on(table.guildId, table.key)],
);

/** Guild members with dashboard access */
export const guildMembers = pgTable(
  'guild_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    permissions: jsonb('permissions').$type<string[]>().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('guild_members_guild_user_idx').on(table.guildId, table.userId)],
);

/** Plugin state per guild */
export const pluginStates = pgTable(
  'plugin_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id').notNull(),
    pluginName: text('plugin_name').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    config: jsonb('config').$type<Record<string, unknown>>().default({}),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('plugin_states_guild_plugin_idx').on(table.guildId, table.pluginName)],
);

/** Audit log */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: text('guild_id'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Bot statistics snapshots */
export const statistics = pgTable('statistics', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: text('guild_id'),
  metric: text('metric').notNull(),
  value: integer('value').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type GuildSetting = typeof guildSettings.$inferSelect;
export type GuildMember = typeof guildMembers.$inferSelect;
export type PluginState = typeof pluginStates.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
