import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { credits } from '../lib/format.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export default {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Globális toplista: a 10 leggazdagabb felhasználó'),
  async execute(interaction) {
    const top = interaction.client.store.top(10);
    if (top.length === 0) {
      await interaction.reply('Még senkinek nincs kreditje. Próbáld a `/daily` parancsot!');
      return;
    }
    const lines = top.map((u, i) => `${MEDALS[i] ?? `**${i + 1}.**`} <@${u.id}> — ${credits(u.balance)}`);
    const embed = new EmbedBuilder()
      .setTitle('🏆 Globális toplista')
      .setDescription(lines.join('\n'))
      .setColor(0xf1c40f);
    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  },
};
