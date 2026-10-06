import { PermissionFlagsBits, MessageFlags } from 'discord.js';

/** Közös ellenőrzések moderációs parancsokhoz. Hibaüzenetet ad vissza, vagy null-t, ha minden rendben. */
export function checkTarget(interaction, member, { botPerm, verb }) {
  if (!interaction.inGuild()) return 'Ezt csak szerveren lehet használni.';
  const me = interaction.guild.members.me;
  if (botPerm && !me.permissions.has(botPerm)) return `A botnak nincs joga ehhez (**${verb}**). Adj neki megfelelő jogosultságot.`;
  if (!member) return null;
  if (member.id === interaction.user.id) return 'Magadon nem hajthatod végre.';
  if (member.id === interaction.client.user.id) return 'Rajtam nem. 😅';
  if (member.id === interaction.guild.ownerId) return 'A szerver tulajdonosán nem lehet.';
  if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 && interaction.user.id !== interaction.guild.ownerId) {
    return 'Nem moderálhatsz olyat, akinek a rangja a tiéddel egyenlő vagy magasabb.';
  }
  if (me.roles.highest.comparePositionTo(member.roles.highest) <= 0) return 'A bot rangja alacsonyabb a célszemélyénél.';
  return null;
}

export async function fail(interaction, msg) {
  const payload = { content: `❌ ${msg}`, flags: MessageFlags.Ephemeral };
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

export { PermissionFlagsBits };
