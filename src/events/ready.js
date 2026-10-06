import { Events, ActivityType } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Bejelentkezve: ${client.user.tag} — ${client.guilds.cache.size} szerveren aktív`);
    client.user.setActivity({ name: '/help | kreditek', type: ActivityType.Watching });
  },
};
