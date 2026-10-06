import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BOT_COLOR } from '../../lib/branding.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Tárgyaid')
    .addUserOption((o) => o.setName('user').setDescription('Másik felhasználó tárgyai')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const inv = interaction.client.db.inventory(target.id);
    const embed = new EmbedBuilder()
      .setTitle(`🎒 ${target.username} tárgyai`)
      .setColor(BOT_COLOR)
      .setDescription(inv.length ? inv.map((i) => `${i.emoji} **${i.name}** × ${i.qty}`).join('\n') : 'Üres. Nézz be a `/shop`-ba!');
    await interaction.reply({ embeds: [embed] });
  },
};
