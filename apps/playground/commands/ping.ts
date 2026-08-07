import { command } from '@nexora.ts/core';

export default command({
  name: 'ping',
  description: 'Check bot latency',
  async execute(ctx) {
    const sent = await ctx.interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - ctx.interaction.createdTimestamp;
    const apiLatency = Math.round(ctx.client.ws.ping);
    await ctx.interaction.editReply(`Pong! Latency: ${latency}ms | API: ${apiLatency}ms`);
  },
});
