import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { checkTarget, fail } from '../../lib/modutil.js';
import { logModAction } from '../../lib/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Felhasználó kirúgása')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setContexts(0)
    .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Indok').setMaxLength(400)),
  async execute(interaction) {
    const member = interaction.options.getMember('user');
    if (!member) return fail(interaction, 'Ez a felhasználó nincs a szerveren.');
    const reason = interaction.options.getString('reason') ?? 'Nincs megadva';
    const err = checkTarget(interaction, member, { botPerm: PermissionFlagsBits.KickMembers, verb: 'kirúgás' });
    if (err) return fail(interaction, err);
    if (!member.kickable) return fail(interaction, 'Ezt a felhasználót nem tudom kirúgni.');
    await member.send(`Kirúgtak a **${interaction.guild.name}** szerverről. Indok: ${reason}`).catch(() => {});
    await member.kick(`${interaction.user.tag}: ${reason}`);
    await logModAction(interaction.client, interaction.guild, { action: 'kick', target: member.user, moderator: interaction.user, reason });
    await interaction.reply({ content: `👢 **${member.user.tag}** kirúgva. Indok: ${reason}`, allowedMentions: { parse: [] } });
  },
};
