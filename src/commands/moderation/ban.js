import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { checkTarget, fail } from '../../lib/modutil.js';
import { logModAction } from '../../lib/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Felhasználó kitiltása')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(0)
    .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Indok').setMaxLength(400))
    .addIntegerOption((o) => o.setName('delete_days').setDescription('Üzenetek törlése az utolsó N napból (0-7)').setMinValue(0).setMaxValue(7)),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const reason = interaction.options.getString('reason') ?? 'Nincs megadva';
    const days = interaction.options.getInteger('delete_days') ?? 0;
    const err = checkTarget(interaction, member, { botPerm: PermissionFlagsBits.BanMembers, verb: 'kitiltás' });
    if (err) return fail(interaction, err);
    if (member && !member.bannable) return fail(interaction, 'Ezt a felhasználót nem tudom kitiltani.');
    await member?.send(`Kitiltottak a **${interaction.guild.name}** szerverről. Indok: ${reason}`).catch(() => {});
    await interaction.guild.members.ban(user.id, { reason: `${interaction.user.tag}: ${reason}`, deleteMessageSeconds: days * 86400 });
    await logModAction(interaction.client, interaction.guild, { action: 'ban', target: user, moderator: interaction.user, reason });
    await interaction.reply({ content: `🔨 **${user.tag}** kitiltva. Indok: ${reason}`, allowedMentions: { parse: [] } });
  },
};
