import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { credits } from '../lib/format.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Kreditkezelés adminisztrátoroknak')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Kredit hozzáadása')
        .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('Összeg').setMinValue(1).setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Kredit levonása')
        .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('Összeg').setMinValue(1).setRequired(true)),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    const store = interaction.client.store;
    try {
      const balance = sub === 'add' ? store.add(target.id, amount) : store.remove(target.id, amount);
      const verb = sub === 'add' ? 'hozzáadva' : 'levonva';
      await interaction.reply({
        content: `✅ **${credits(amount)}** ${verb} ${target} számláján. Új egyenleg: **${credits(balance)}**`,
        allowedMentions: { parse: [] },
      });
    } catch (err) {
      await interaction.reply({ content: `❌ ${err.message}`, flags: MessageFlags.Ephemeral });
    }
  },
};
