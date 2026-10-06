import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('Kilistázza az elérhető parancsokat'),
  async execute(interaction) {
    const lines = [...interaction.client.commands.values()]
      .map((c) => `**/${c.data.name}** — ${c.data.description}`)
      .sort();
    const embed = new EmbedBuilder()
      .setTitle('📖 Parancsok')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Aktív ${interaction.client.guilds.cache.size} szerveren` })
      .setColor(0x5865f2);
    await interaction.reply({ embeds: [embed] });
  },
};
