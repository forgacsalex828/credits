import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BOT_COLOR } from '../../lib/branding.js';
import { credits } from '../../lib/format.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Információ egy felhasználóról')
    .addUserOption((o) => o.setName('user').setDescription('Felhasználó')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const member = interaction.guild ? await interaction.guild.members.fetch(user.id).catch(() => null) : null;
    const db = interaction.client.db;
    const embed = new EmbedBuilder()
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setColor(member?.displayColor || BOT_COLOR)
      .addFields(
        { name: 'ID', value: `\`${user.id}\``, inline: true },
        { name: 'Fiók létrehozva', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'Kredit', value: credits(db.balance(user.id)), inline: true },
      );
    if (member) {
      embed.addFields(
        { name: 'Csatlakozott', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : '—', inline: true },
        { name: 'Rangok', value: member.roles.cache.filter((r) => r.id !== interaction.guildId).map((r) => `${r}`).slice(0, 10).join(' ') || '—', inline: false },
        { name: 'Figyelmeztetések', value: String(db.warnings(interaction.guildId, user.id).length), inline: true },
      );
      const rank = db.rank(interaction.guildId, user.id);
      if (rank) embed.addFields({ name: 'Szint', value: `${rank.level} (#${rank.rank})`, inline: true });
    }
    await interaction.reply({ embeds: [embed] });
  },
};
