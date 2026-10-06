import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { BOT_COLOR } from '../../lib/branding.js';

export default {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Információ a szerverről').setContexts(0),
  async execute(interaction) {
    const g = interaction.guild;
    const owner = await g.fetchOwner().catch(() => null);
    const channels = g.channels.cache;
    const embed = new EmbedBuilder()
      .setTitle(g.name)
      .setThumbnail(g.iconURL({ size: 256 }))
      .setColor(BOT_COLOR)
      .addFields(
        { name: 'Tulajdonos', value: owner ? `${owner.user.tag}` : '—', inline: true },
        { name: 'Tagok', value: String(g.memberCount), inline: true },
        { name: 'Létrehozva', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'Szöveges csatornák', value: String(channels.filter((c) => c.type === ChannelType.GuildText).size), inline: true },
        { name: 'Hangcsatornák', value: String(channels.filter((c) => c.type === ChannelType.GuildVoice).size), inline: true },
        { name: 'Rangok', value: String(g.roles.cache.size - 1), inline: true },
        { name: 'Boost szint', value: String(g.premiumTier), inline: true },
        { name: 'ID', value: `\`${g.id}\``, inline: true },
      );
    await interaction.reply({ embeds: [embed] });
  },
};
