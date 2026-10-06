import { Events } from 'discord.js';

export default {
  name: Events.GuildCreate,
  execute(guild) {
    console.log(`➕ Új szerver: ${guild.name} (${guild.id}), tagok: ${guild.memberCount}`);
  },
};
