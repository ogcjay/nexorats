import type { AuthConfig } from '@nexora.ts/config';
import type { RepositoryFactory, User } from '@nexora.ts/database';
import { randomBytes } from 'node:crypto';

/** Discord OAuth token response */
interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/** Discord user profile */
export interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

/** Authenticated session */
export interface AuthSession {
  token: string;
  user: User;
  expiresAt: Date;
}

/** Permission levels for dashboard */
export const Permissions = {
  VIEW_DASHBOARD: 'view:dashboard',
  MANAGE_SETTINGS: 'manage:settings',
  MANAGE_PLUGINS: 'manage:plugins',
  MANAGE_USERS: 'manage:users',
  VIEW_LOGS: 'view:logs',
  VIEW_STATS: 'view:stats',
  ADMIN: 'admin',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

/** Default role permission mappings */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: Object.values(Permissions),
  admin: [
    Permissions.VIEW_DASHBOARD,
    Permissions.MANAGE_SETTINGS,
    Permissions.MANAGE_PLUGINS,
    Permissions.MANAGE_USERS,
    Permissions.VIEW_LOGS,
    Permissions.VIEW_STATS,
  ],
  moderator: [Permissions.VIEW_DASHBOARD, Permissions.VIEW_LOGS, Permissions.VIEW_STATS],
  member: [Permissions.VIEW_DASHBOARD, Permissions.VIEW_STATS],
};

const DISCORD_API = 'https://discord.com/api/v10';

/** Discord OAuth service */
export class DiscordOAuth {
  constructor(private readonly config: AuthConfig) {}

  /** Generate OAuth authorization URL */
  getAuthorizationUrl(state: string): string {
    const scopes = this.config.scopes ?? ['identify', 'guilds', 'email'];
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
    });
    return `https://discord.com/api/oauth2/authorize?${params}`;
  }

  /** Exchange authorization code for tokens */
  async exchangeCode(code: string): Promise<DiscordTokenResponse> {
    const response = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    return response.json() as Promise<DiscordTokenResponse>;
  }

  /** Fetch Discord user profile */
  async getUserProfile(accessToken: string): Promise<DiscordProfile> {
    const response = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Discord profile: ${response.statusText}`);
    }

    return response.json() as Promise<DiscordProfile>;
  }

  /** Fetch user's guilds */
  async getUserGuilds(accessToken: string) {
    const response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch guilds: ${response.statusText}`);
    }

    return response.json() as Promise<
      { id: string; name: string; icon: string | null; permissions: string }[]
    >;
  }
}

/** Session manager */
export class SessionManager {
  private readonly sessionDurationMs: number;

  constructor(
    private readonly repos: RepositoryFactory,
    sessionDurationHours = 24 * 7,
  ) {
    this.sessionDurationMs = sessionDurationHours * 60 * 60 * 1000;
  }

  /** Create a new session for a user */
  async createSession(user: User): Promise<AuthSession> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.sessionDurationMs);

    await this.repos.sessions.create(user.id, token, expiresAt);

    return { token, user, expiresAt };
  }

  /** Validate and retrieve session */
  async validateSession(token: string): Promise<AuthSession | null> {
    const session = await this.repos.sessions.findByToken(token);
    if (!session) return null;

    if (new Date() > session.expiresAt) {
      await this.repos.sessions.deleteByToken(token);
      return null;
    }

    const user = await this.repos.users.findById(session.userId);
    if (!user) return null;

    return { token, user, expiresAt: session.expiresAt };
  }

  /** Destroy a session */
  async destroySession(token: string): Promise<void> {
    await this.repos.sessions.deleteByToken(token);
  }
}

/** Permission checker */
export class PermissionChecker {
  constructor(private readonly repos: RepositoryFactory) {}

  /** Check if user has permission in a guild */
  async hasPermission(userId: string, guildId: string, permission: Permission): Promise<boolean> {
    const member = await this.repos.guildMembers.findByGuildAndUser(guildId, userId);
    if (!member) return false;

    const rolePerms = DEFAULT_ROLE_PERMISSIONS[member.role] ?? [];
    if (rolePerms.includes(Permissions.ADMIN) || rolePerms.includes(permission)) {
      return true;
    }

    const customPerms = (member.permissions as string[]) ?? [];
    return customPerms.includes(permission) || customPerms.includes(Permissions.ADMIN);
  }

  /** Check if user can manage guild (owner or admin) */
  async canManageGuild(userId: string, guildId: string): Promise<boolean> {
    return this.hasPermission(userId, guildId, Permissions.MANAGE_SETTINGS);
  }
}

/** Complete auth service factory */
export function createAuthService(config: AuthConfig, repos: RepositoryFactory) {
  return {
    oauth: new DiscordOAuth(config),
    sessions: new SessionManager(repos),
    permissions: new PermissionChecker(repos),
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
