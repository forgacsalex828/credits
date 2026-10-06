import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('modlog')
    .setDescription('Utolsó moderációs események ezen a szerveren')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0),
  async execute(interaction) {
    const rows = interaction.client.db.modActions(interaction.guildId, 15);
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Moderációs napló')
      .setColor(0x95a5a6)
      .setDescription(rows.length
        ? rows.map((r) => `<t:${Math.floor(r.created_at / 1000)}:R> **${r.action}**${r.user_id ? ` <@${r.user_id}>` : ''} — <@${r.moderator_id}>${r.reason ? `: ${r.reason.slice(0, 80)}` : ''}`).join('\n')
        : 'Még nincs bejegyzés.');
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
