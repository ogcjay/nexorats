export { createDatabase, schema } from './client.js';
export type { Database } from './client.js';

export {
  RepositoryFactory,
  UserRepository,
  SessionRepository,
  GuildSettingsRepository,
  GuildMemberRepository,
  PluginStateRepository,
  AuditLogRepository,
} from './repositories/index.js';

export type {
  User,
  NewUser,
  Session,
  GuildSetting,
  GuildMember,
  PluginState,
  AuditLog,
} from './schema/index.js';
