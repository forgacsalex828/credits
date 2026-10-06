import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { config } from '../../lib/config.js';

export default {
  data: new SlashCommandBuilder().setName('dashboard').setDescription('Link a webes vezérlőpulthoz'),
  async execute(interaction) {
    if (!config.web.enabled) {
      await interaction.reply({ content: 'A weboldal nincs bekapcsolva ezen a boton.', flags: MessageFlags.Ephemeral });
      return;
    }
    const link = interaction.guildId ? `${config.web.baseUrl}/dashboard/${interaction.guildId}` : `${config.web.baseUrl}/dashboard`;
    await interaction.reply({ content: `🌐 Vezérlőpult: ${link}\n🏆 Toplista: ${config.web.baseUrl}/leaderboard`, flags: MessageFlags.Ephemeral });
  },
};
