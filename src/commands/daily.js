import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { config } from '../lib/config.js';
import { credits, formatDuration } from '../lib/format.js';

export default {
  data: new SlashCommandBuilder().setName('daily').setDescription('Napi kreditjutalom felvétele'),
  async execute(interaction) {
    const result = interaction.client.store.claimDaily(interaction.user.id, config.dailyReward);
    if (!result.ok) {
      await interaction.reply({
        content: `⏳ Már felvetted a napi jutalmat. Újra: **${formatDuration(result.remaining)}** múlva.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply(`🎁 Felvettél **${credits(config.dailyReward)}**-et! Új egyenleg: **${credits(result.balance)}**`);
  },
};
