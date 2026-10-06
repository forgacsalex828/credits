import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { fail } from '../../lib/modutil.js';
import { logModAction } from '../../lib/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Elhallgattatás feloldása')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0)
    .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true)),
  async execute(interaction) {
    const member = interaction.options.getMember('user');
    if (!member) return fail(interaction, 'Ez a felhasználó nincs a szerveren.');
    if (!member.isCommunicationDisabled()) return fail(interaction, 'Ez a felhasználó nincs elhallgattatva.');
    await member.timeout(null, `${interaction.user.tag}: feloldás`);
    await logModAction(interaction.client, interaction.guild, { action: 'untimeout', target: member.user, moderator: interaction.user });
    await interaction.reply({ content: `🔊 **${member.user.tag}** elhallgattatása feloldva.`, allowedMentions: { parse: [] } });
  },
};
