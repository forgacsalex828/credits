import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { checkTarget, fail } from '../../lib/modutil.js';
import { logModAction } from '../../lib/modlog.js';
import { parseDuration, formatDuration } from '../../lib/format.js';

const MAX = 28 * 86_400_000;

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Felhasználó elhallgattatása')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0)
    .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('Időtartam, pl. 10m, 2h, 1d (max 28d)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Indok').setMaxLength(400)),
  async execute(interaction) {
    const member = interaction.options.getMember('user');
    if (!member) return fail(interaction, 'Ez a felhasználó nincs a szerveren.');
    const ms = parseDuration(interaction.options.getString('duration', true));
    if (!ms || ms < 10_000 || ms > MAX) return fail(interaction, 'Érvénytelen időtartam. Példa: `10m`, `2h`, `1d` (10 mp és 28 nap között).');
    const reason = interaction.options.getString('reason') ?? 'Nincs megadva';
    const err = checkTarget(interaction, member, { botPerm: PermissionFlagsBits.ModerateMembers, verb: 'elhallgattatás' });
    if (err) return fail(interaction, err);
    if (!member.moderatable) return fail(interaction, 'Ezt a felhasználót nem tudom elhallgattatni.');
    await member.timeout(ms, `${interaction.user.tag}: ${reason}`);
    await logModAction(interaction.client, interaction.guild, { action: 'timeout', target: member.user, moderator: interaction.user, reason, extra: formatDuration(ms) });
    await interaction.reply({ content: `🔇 **${member.user.tag}** elhallgattatva **${formatDuration(ms)}** időre. Indok: ${reason}`, allowedMentions: { parse: [] } });
  },
};
