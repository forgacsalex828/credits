import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { fail } from '../../lib/modutil.js';
import { logModAction } from '../../lib/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Kitiltás feloldása felhasználó-ID alapján')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(0)
    .addStringOption((o) => o.setName('user_id').setDescription('Felhasználó ID').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Indok').setMaxLength(400)),
  async execute(interaction) {
    const id = interaction.options.getString('user_id', true).trim();
    if (!/^\d{17,20}$/.test(id)) return fail(interaction, 'Érvénytelen felhasználó-ID.');
    const reason = interaction.options.getString('reason') ?? 'Nincs megadva';
    const user = await interaction.guild.members.unban(id, `${interaction.user.tag}: ${reason}`).catch(() => null);
    if (!user) return fail(interaction, 'Nem találtam ilyen kitiltást.');
    await logModAction(interaction.client, interaction.guild, { action: 'unban', target: user, moderator: interaction.user, reason });
    await interaction.reply({ content: `✅ **${user.tag}** kitiltása feloldva.`, allowedMentions: { parse: [] } });
  },
};
