import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { credits } from '../../lib/format.js';
import { BOT_COLOR } from '../../lib/branding.js';

export default {
  data: new SlashCommandBuilder().setName('shop').setDescription('A Meteor bolt kínálata'),
  async execute(interaction) {
    const items = interaction.client.db.items();
    const embed = new EmbedBuilder()
      .setTitle('🛒 Meteor bolt')
      .setColor(BOT_COLOR)
      .setDescription(items.map((i) => `${i.emoji} **${i.name}** — ${credits(i.price)}\n└ ${i.description} \`/buy ${i.id}\``).join('\n\n'))
      .setFooter({ text: `Egyenleged: ${credits(interaction.client.db.balance(interaction.user.id))}` });
    await interaction.reply({ embeds: [embed] });
  },
};
