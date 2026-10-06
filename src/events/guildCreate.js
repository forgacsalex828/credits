import { Events } from 'discord.js';

export default {
  name: Events.GuildCreate,
  execute(guild) {
    guild.client.db.settings(guild.id); // alapbeállítások létrehozása
    console.log(`➕ Új szerver: ${guild.name} (${guild.id}), tagok: ${guild.memberCount}`);
  },
};
