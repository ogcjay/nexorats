import { event } from '@nexorajs/core';

export default event('ready', (client) => {
  console.log(`Playground bot ready: ${client.user.tag}`);
  client.user.setActivity('Nexora Playground', { type: 3 });
});
