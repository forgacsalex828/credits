import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { config } from '../../lib/config.js';
import { credits } from '../../lib/format.js';

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Fej vagy írás: dupla vagy semmi')
    .addIntegerOption((o) => o.setName('amount').setDescription('Tét').setMinValue(1).setRequired(true))
    .addStringOption((o) => o.setName('side').setDescription('Fej vagy írás').addChoices({ name: 'Fej', value: 'fej' }, { name: 'Írás', value: 'iras' }).setRequired(true)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);
    const side = interaction.options.getString('side', true);
    if (amount > config.maxBet) {
      await interaction.reply({ content: `❌ A maximális tét **${credits(config.maxBet)}**.`, flags: MessageFlags.Ephemeral });
      return;
    }
    const result = Math.random() < 0.5 ? 'fej' : 'iras';
    const won = result === side;
    try {
      const balance = interaction.client.db.bet(interaction.user.id, amount, won ? amount : -amount, 'coinflip');
      const label = result === 'fej' ? 'Fej' : 'Írás';
      await interaction.reply(won
        ? `🪙 **${label}!** Nyertél **${credits(amount)}**-et! Egyenleg: **${credits(balance)}**`
        : `🪙 **${label}.** Vesztettél **${credits(amount)}**-et. Egyenleg: **${credits(balance)}**`);
    } catch (err) {
      await interaction.reply({ content: `❌ ${err.message}`, flags: MessageFlags.Ephemeral });
    }
  },
};
