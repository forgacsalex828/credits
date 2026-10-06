import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { credits } from '../../lib/format.js';

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Kredit küldése másik felhasználónak')
    .addUserOption((o) => o.setName('user').setDescription('Címzett').setRequired(true))
    .addIntegerOption((o) => o.setName('amount').setDescription('Összeg').setMinValue(1).setRequired(true))
    .addStringOption((o) => o.setName('note').setDescription('Megjegyzés').setMaxLength(100)),
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    const note = interaction.options.getString('note');
    if (target.bot) {
      await interaction.reply({ content: '🤖 Botnak nem küldhetsz kreditet.', flags: MessageFlags.Ephemeral });
      return;
    }
    try {
      const result = interaction.client.db.transfer(interaction.user.id, target.id, amount, note);
      await interaction.reply({
        content: `💸 ${interaction.user} küldött **${credits(amount)}**-et ${target} részére.${note ? ` _„${note}”_` : ''}\nEgyenleged: **${credits(result.from)}**`,
        allowedMentions: { users: [target.id] },
      });
    } catch (err) {
      await interaction.reply({ content: `❌ ${err.message}`, flags: MessageFlags.Ephemeral });
    }
  },
};
