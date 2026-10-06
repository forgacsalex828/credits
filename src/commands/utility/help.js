import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BOT_NAME, BOT_EMOJI, BOT_COLOR } from '../../lib/branding.js';
import { config } from '../../lib/config.js';

const CATEGORY = { economy: '💰 Gazdaság', moderation: '🛡️ Moderáció', config: '⚙️ Beállítások', utility: '🔧 Egyéb' };

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('Kilistázza az elérhető parancsokat'),
  async execute(interaction) {
    const groups = new Map();
    for (const c of interaction.client.commands.values()) {
      if (!groups.has(c.category)) groups.set(c.category, []);
      groups.get(c.category).push(`**/${c.data.name}** — ${c.data.description}`);
    }
    const embed = new EmbedBuilder()
      .setTitle(`${BOT_EMOJI} ${BOT_NAME} – parancsok`)
      .setColor(BOT_COLOR)
      .setFooter({ text: `${BOT_NAME} • aktív ${interaction.client.guilds.cache.size} szerveren` });
    for (const key of ['economy', 'moderation', 'config', 'utility']) {
      const lines = groups.get(key);
      if (lines) embed.addFields({ name: CATEGORY[key] ?? key, value: lines.sort().join('\n') });
    }
    if (config.web.enabled) embed.setDescription(`🌐 Weboldal és vezérlőpult: ${config.web.baseUrl}`);
    await interaction.reply({ embeds: [embed] });
  },
};
