import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { fail } from '../../lib/modutil.js';
import { logModAction } from '../../lib/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Csatorna zárolása vagy feloldása (mindenki írási joga)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setContexts(0)
    .addSubcommand((s) => s.setName('on').setDescription('Zárolás').addStringOption((o) => o.setName('reason').setDescription('Indok')))
    .addSubcommand((s) => s.setName('off').setDescription('Feloldás')),
  async execute(interaction) {
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) return fail(interaction, 'A botnak nincs „Csatornák kezelése” joga.');
    const lock = interaction.options.getSubcommand() === 'on';
    const reason = interaction.options.getString('reason') ?? (lock ? 'Zárolva' : 'Feloldva');
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: lock ? false : null }, { reason: `${interaction.user.tag}: ${reason}` });
    await logModAction(interaction.client, interaction.guild, { action: lock ? 'lock' : 'unlock', target: null, moderator: interaction.user, reason: `#${interaction.channel.name}: ${reason}` });
    await interaction.reply(lock ? `🔒 Csatorna zárolva. ${reason}` : '🔓 Csatorna feloldva.');
  },
};
