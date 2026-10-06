import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BOT_NAME, BOT_EMOJI, BOT_COLOR } from '../lib/branding.js';

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('Kilistázza az elérhető parancsokat'),
  async execute(interaction) {
    const lines = [...interaction.client.commands.values()]
      .map((c) => `**/${c.data.name}** — ${c.data.description}`)
      .sort();
    const embed = new EmbedBuilder()
      .setTitle(`${BOT_EMOJI} ${BOT_NAME} – parancsok`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `${BOT_NAME} • aktív ${interaction.client.guilds.cache.size} szerveren` })
      .setColor(BOT_COLOR);
    await interaction.reply({ embeds: [embed] });
  },
};
