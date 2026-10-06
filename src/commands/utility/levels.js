import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export default {
  data: new SlashCommandBuilder().setName('levels').setDescription('Szerver XP toplista').setContexts(0),
  async execute(interaction) {
    const top = interaction.client.db.xpTop(interaction.guildId, 10);
    const embed = new EmbedBuilder()
      .setTitle(`⭐ ${interaction.guild.name} – szint toplista`)
      .setColor(0x3498db)
      .setDescription(top.length ? top.map((u, i) => `${MEDALS[i] ?? `**${i + 1}.**`} <@${u.user_id}> — szint ${u.level}, ${u.xp} XP`).join('\n') : 'Még senki nem szerzett XP-t.');
    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  },
};
