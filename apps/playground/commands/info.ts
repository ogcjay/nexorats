import { command } from '@nexora.ts/core';

export default command({
  name: 'info',
  description: 'Display bot information',
  async execute(ctx) {
    const client = ctx.client;
    await ctx.interaction.reply({
      embeds: [
        {
          title: 'Nexora Playground',
          description: 'Demo bot powered by the Nexora framework',
          fields: [
            { name: 'Servers', value: String(client.guilds.cache.size), inline: true },
            { name: 'Users', value: String(client.users.cache.size), inline: true },
            { name: 'Uptime', value: formatUptime(client.uptime ?? 0), inline: true },
          ],
          color: 0x8b5cf6,
        },
      ],
    });
  },
});

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
}
