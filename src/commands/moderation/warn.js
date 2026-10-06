import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { checkTarget, fail } from '../../lib/modutil.js';
import { logModAction } from '../../lib/modlog.js';

const AUTO_TIMEOUT_AT = 3; // 3. figyelmeztetésnél 1 óra timeout
const AUTO_KICK_AT = 5;

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Figyelmeztetés adása')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0)
    .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Indok').setRequired(true).setMaxLength(400)),
  async execute(interaction) {
    const member = interaction.options.getMember('user');
    if (!member) return fail(interaction, 'Ez a felhasználó nincs a szerveren.');
    const reason = interaction.options.getString('reason', true);
    const err = checkTarget(interaction, member, { botPerm: null, verb: 'figyelmeztetés' });
    if (err) return fail(interaction, err);
    const { count } = interaction.client.db.warn(interaction.guildId, member.id, interaction.user.id, reason);
    await logModAction(interaction.client, interaction.guild, { action: 'warn', target: member.user, moderator: interaction.user, reason, extra: `${count}. figyelmeztetés` });
    await member.send(`⚠️ Figyelmeztetést kaptál a **${interaction.guild.name}** szerveren (${count}.). Indok: ${reason}`).catch(() => {});

    let auto = '';
    if (count >= AUTO_KICK_AT && member.kickable) {
      await member.kick(`Automatikus: ${count} figyelmeztetés`).catch(() => {});
      auto = `\n👢 Automatikusan kirúgva (${count} figyelmeztetés).`;
    } else if (count >= AUTO_TIMEOUT_AT && member.moderatable) {
      await member.timeout(3_600_000, `Automatikus: ${count} figyelmeztetés`).catch(() => {});
      auto = `\n🔇 Automatikus 1 órás elhallgattatás (${count} figyelmeztetés).`;
    }
    await interaction.reply({ content: `⚠️ **${member.user.tag}** figyelmeztetve (${count}.). Indok: ${reason}${auto}`, allowedMentions: { parse: [] } });
  },
};
