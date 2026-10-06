import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { fail } from '../../lib/modutil.js';
import { logModAction } from '../../lib/modlog.js';

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Üzenetek tömeges törlése (max 100, 14 napnál frissebbek)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(0)
    .addIntegerOption((o) => o.setName('amount').setDescription('Hány üzenet').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption((o) => o.setName('user').setDescription('Csak ennek a felhasználónak az üzenetei')),
  async execute(interaction) {
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return fail(interaction, 'A botnak nincs „Üzenetek kezelése” joga.');
    const amount = interaction.options.getInteger('amount', true);
    const user = interaction.options.getUser('user');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let messages = await interaction.channel.messages.fetch({ limit: 100 });
    if (user) messages = messages.filter((m) => m.author.id === user.id);
    messages = [...messages.values()].slice(0, amount);
    const deleted = await interaction.channel.bulkDelete(messages, true);
    await logModAction(interaction.client, interaction.guild, { action: 'purge', target: user, moderator: interaction.user, reason: `${deleted.size} üzenet törölve a #${interaction.channel.name} csatornában` });
    await interaction.editReply(`🧹 ${deleted.size} üzenet törölve.`);
  },
};
