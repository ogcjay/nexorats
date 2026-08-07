import { defineConfig } from '@nexorajs/config';

export default defineConfig({
  bot: {
    token: process.env.DISCORD_TOKEN ?? '',
    clientId: process.env.DISCORD_CLIENT_ID ?? '',
    guildIds: process.env.DISCORD_GUILD_ID ? [process.env.DISCORD_GUILD_ID] : undefined,
  },
  database: {
    provider: 'sqlite',
    url: 'sqlite:./data/playground.db',
  },
  logger: {
    level: 'debug',
    file: { enabled: true, path: './logs/playground.log' },
    liveStream: true,
  },
  plugins: {
    example: { enabled: true },
  },
});
