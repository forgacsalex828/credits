import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { config } from '../../lib/config.js';
import { credits, formatDuration } from '../../lib/format.js';

const JOBS = ['meteoritot bányásztál', 'űrhajót mostál', 'csillagokat számoltál', 'bolygót festettél', 'rakétát tankoltál', 'holdport sepregettél', 'űrlényeknek tolmácsoltál'];

export default {
  data: new SlashCommandBuilder().setName('work').setDescription('Dolgozz egy kicsit kreditért'),
  async execute(interaction) {
    const r = interaction.client.db.work(interaction.user.id, config.workMin, config.workMax, config.workCooldownMin * 60_000);
    if (!r.ok) {
      await interaction.reply({ content: `😴 Pihenj még **${formatDuration(r.remaining)}**-et, mielőtt újra dolgozol.`, flags: MessageFlags.Ephemeral });
      return;
    }
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    await interaction.reply(`🛠️ Te ${job}, és kerestél **${credits(r.earned)}**-et. Egyenleg: **${credits(r.balance)}**`);
  },
};
