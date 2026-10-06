import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BOT_COLOR } from '../../lib/branding.js';
import { progressBar } from '../../lib/format.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Szinted és XP-d ezen a szerveren')
    .setContexts(0)
    .addUserOption((o) => o.setName('user').setDescription('Másik felhasználó')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const r = interaction.client.db.rank(interaction.guildId, user.id);
    if (!r) {
      await interaction.reply(`${user.username} még nem szerzett XP-t ezen a szerveren.`);
      return;
    }
    const embed = new EmbedBuilder()
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setColor(BOT_COLOR)
      .setDescription(`**Szint ${r.level}** · #${r.rank} a szerveren\n\`${progressBar(r.progress, r.needed, 16)}\` ${r.progress}/${r.needed} XP\nÖsszes XP: **${r.xp}** · Üzenetek: ${r.messages}`);
    await interaction.reply({ embeds: [embed] });
  },
};
