import config from '../nexora.config.js';
import { Nexora } from '@nexora.ts/core';
import { PluginLoader } from '@nexora.ts/plugin-system';
import { createDevServer } from '@nexora.ts/dev-server';

const bot = new Nexora({
  config,
  commandsPath: ['./commands/**/*.ts'],
  eventsPath: ['./events/**/*.ts'],
});

const pluginLoader = new PluginLoader(bot, bot.logger);
const studioApi = createDevServer(bot, {
  port: 3920,
  studioPort: 3002,
  databaseStatus: async () => ({
    connected: false,
    provider: config.database.provider,
    message: 'Playground uses SQLite config — connect probe optional',
  }),
});

await studioApi.start();
await bot.start();

await pluginLoader.loadAll({
  pluginsPath: './plugins',
  enabledPlugins: config.plugins,
});

studioApi.setPlugins(
  pluginLoader.getAll().map((plugin) => ({
    name: plugin.manifest.name,
    version: plugin.manifest.version,
    enabled: plugin.enabled,
    description: plugin.manifest.description,
    commands: plugin.commands.length,
    events: plugin.events.length,
  })),
);

bot.logger.info('Nexora Studio → http://localhost:3002 (API :3920)');

process.on('SIGINT', async () => {
  await studioApi.stop();
  await bot.stop();
  process.exit(0);
});
