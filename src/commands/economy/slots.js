import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { config } from '../../lib/config.js';
import { credits } from '../../lib/format.js';

const SYMBOLS = ['🍒', '🍋', '🍇', '⭐', '☄️', '💎'];
const MULT = { three: 10, meteor3: 25, two: 2 };

export default {
  cooldown: 4,
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Nyerőgép')
    .addIntegerOption((o) => o.setName('amount').setDescription('Tét').setMinValue(1).setRequired(true)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);
    if (amount > config.maxBet) {
      await interaction.reply({ content: `❌ A maximális tét **${credits(config.maxBet)}**.`, flags: MessageFlags.Ephemeral });
      return;
    }
    const reel = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const [a, b, c] = [reel(), reel(), reel()];
    let mult = 0;
    if (a === b && b === c) mult = a === '☄️' ? MULT.meteor3 : MULT.three;
    else if (a === b || b === c || a === c) mult = MULT.two;
    const delta = mult ? amount * (mult - 1) : -amount;
    try {
      const balance = interaction.client.db.bet(interaction.user.id, amount, delta, 'slots');
      const board = `┃ ${a} ┃ ${b} ┃ ${c} ┃`;
      const msg = mult
        ? `🎰 ${board}\n**${mult}x!** Nyertél **${credits(amount * mult)}**-et. Egyenleg: **${credits(balance)}**`
        : `🎰 ${board}\nNem nyert. Egyenleg: **${credits(balance)}**`;
      await interaction.reply(msg);
    } catch (err) {
      await interaction.reply({ content: `❌ ${err.message}`, flags: MessageFlags.Ephemeral });
    }
  },
};
