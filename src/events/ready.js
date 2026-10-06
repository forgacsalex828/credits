import { Events, ActivityType } from 'discord.js';
import { BOT_NAME } from '../lib/branding.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`☄️  ${BOT_NAME} elindult – bejelentkezve: ${client.user.tag} — ${client.guilds.cache.size} szerveren aktív`);
    client.user.setActivity({ name: '/help | Meteor bot', type: ActivityType.Watching });
  },
};
