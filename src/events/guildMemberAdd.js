import { Events, EmbedBuilder } from 'discord.js';
import { handleJoin } from '../protection/antiraid.js';
import { BOT_COLOR } from '../lib/branding.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const settings = member.client.db.settings(member.guild.id);
    if (await handleJoin(member, settings)) return;

    if (!settings.welcome_channel) return;
    const channel = member.guild.channels.cache.get(settings.welcome_channel);
    if (!channel?.isTextBased()) return;
    const text = (settings.welcome_message || 'Üdv a szerveren, {user}! Te vagy a {count}. tag. 🎉')
      .replaceAll('{user}', `${member}`)
      .replaceAll('{server}', member.guild.name)
      .replaceAll('{count}', String(member.guild.memberCount));
    const embed = new EmbedBuilder().setColor(BOT_COLOR).setDescription(text).setThumbnail(member.user.displayAvatarURL({ size: 128 }));
    await channel.send({ embeds: [embed], allowedMentions: { users: [member.id] } }).catch(() => {});
  },
};
