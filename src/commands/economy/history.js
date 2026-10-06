import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { credits } from '../../lib/format.js';
import { BOT_COLOR } from '../../lib/branding.js';

const LABEL = { pay: '💸 utalás', daily: '🎁 napi', work: '🛠️ munka', buy: '🛍️ vásárlás', coinflip: '🪙 coinflip', slots: '🎰 slots', admin_add: '➕ admin', admin_remove: '➖ admin' };

export default {
  data: new SlashCommandBuilder().setName('history').setDescription('Utolsó 10 tranzakciód'),
  async execute(interaction) {
    const me = interaction.user.id;
    const rows = interaction.client.db.history(me, 10);
    const lines = rows.map((t) => {
      const incoming = t.to_id === me;
      const sign = incoming ? '+' : '−';
      const other = t.type === 'pay' ? (incoming ? ` ← <@${t.from_id}>` : ` → <@${t.to_id}>`) : '';
      return `<t:${Math.floor(t.created_at / 1000)}:R> ${LABEL[t.type] ?? t.type}${other}: **${sign}${credits(t.amount)}**`;
    });
    const embed = new EmbedBuilder().setTitle('📜 Tranzakciók').setColor(BOT_COLOR).setDescription(lines.join('\n') || 'Még nincs tranzakciód.');
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
