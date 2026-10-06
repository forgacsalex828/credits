import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { fail } from '../../lib/modutil.js';
import { logModAction } from '../../lib/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Figyelmeztetések kezelése')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0)
    .addSubcommand((s) => s.setName('list').setDescription('Figyelmeztetések listája')
      .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true)))
    .addSubcommand((s) => s.setName('remove').setDescription('Egy figyelmeztetés törlése')
      .addIntegerOption((o) => o.setName('id').setDescription('Figyelmeztetés ID').setRequired(true)))
    .addSubcommand((s) => s.setName('clear').setDescription('Összes figyelmeztetés törlése')
      .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true))),
  async execute(interaction) {
    const db = interaction.client.db;
    const sub = interaction.options.getSubcommand();
    if (sub === 'list') {
      const user = interaction.options.getUser('user', true);
      const rows = db.warnings(interaction.guildId, user.id);
      const embed = new EmbedBuilder()
        .setTitle(`⚠️ ${user.tag} figyelmeztetései (${rows.length})`)
        .setColor(0xf1c40f)
        .setDescription(rows.length ? rows.slice(0, 15).map((w) => `\`#${w.id}\` <t:${Math.floor(w.created_at / 1000)}:d> <@${w.moderator_id}>: ${w.reason}`).join('\n') : 'Nincs figyelmeztetése.');
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    if (sub === 'remove') {
      const id = interaction.options.getInteger('id', true);
      if (!db.removeWarning(interaction.guildId, id)) return fail(interaction, 'Nincs ilyen figyelmeztetés ezen a szerveren.');
      await logModAction(interaction.client, interaction.guild, { action: 'warn_remove', target: null, moderator: interaction.user, reason: `#${id} törölve` });
      return interaction.reply({ content: `✅ A #${id} figyelmeztetés törölve.`, flags: MessageFlags.Ephemeral });
    }
    const user = interaction.options.getUser('user', true);
    const n = db.clearWarnings(interaction.guildId, user.id);
    await logModAction(interaction.client, interaction.guild, { action: 'warn_remove', target: user, moderator: interaction.user, reason: `${n} figyelmeztetés törölve` });
    return interaction.reply({ content: `✅ ${n} figyelmeztetés törölve: **${user.tag}**.`, allowedMentions: { parse: [] } });
  },
};
