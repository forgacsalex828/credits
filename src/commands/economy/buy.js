import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { credits } from '../../lib/format.js';

export default {
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Vásárlás a boltból')
    .addStringOption((o) => o.setName('item').setDescription('Tárgy').setRequired(true).setAutocomplete(true))
    .addIntegerOption((o) => o.setName('qty').setDescription('Mennyiség').setMinValue(1).setMaxValue(100)),
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const items = interaction.client.db.items().filter((i) => i.name.toLowerCase().includes(focused) || i.id.includes(focused));
    await interaction.respond(items.slice(0, 25).map((i) => ({ name: `${i.emoji} ${i.name} — ${i.price}`, value: i.id })));
  },
  async execute(interaction) {
    const itemId = interaction.options.getString('item', true);
    const qty = interaction.options.getInteger('qty') ?? 1;
    try {
      const r = interaction.client.db.buy(interaction.user.id, itemId, qty);
      await interaction.reply(`🛍️ Megvetted: **${qty}x ${r.item.emoji} ${r.item.name}** (${credits(r.total)}). Egyenleg: **${credits(r.balance)}**`);
    } catch (err) {
      await interaction.reply({ content: `❌ ${err.message}`, flags: MessageFlags.Ephemeral });
    }
  },
};
