import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { credits } from '../../lib/format.js';
import { config } from '../../lib/config.js';

// A kreditek globálisak, ezért ezt csak a bot tulajdonosai (OWNER_IDS) használhatják,
// különben bármelyik szerver adminja korlátlan kreditet osztogathatna.
export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Kreditkezelés a bot tulajdonosainak')
    .addSubcommand((s) => s.setName('add').setDescription('Kredit hozzáadása')
      .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true))
      .addIntegerOption((o) => o.setName('amount').setDescription('Összeg').setMinValue(1).setRequired(true)))
    .addSubcommand((s) => s.setName('remove').setDescription('Kredit levonása')
      .addUserOption((o) => o.setName('user').setDescription('Felhasználó').setRequired(true))
      .addIntegerOption((o) => o.setName('amount').setDescription('Összeg').setMinValue(1).setRequired(true)))
    .addSubcommand((s) => s.setName('stats').setDescription('Globális statisztika')),
  async execute(interaction) {
    if (!config.ownerIds.includes(interaction.user.id)) {
      await interaction.reply({ content: '🔒 Ezt csak a bot tulajdonosa használhatja (OWNER_IDS a .env-ben).', flags: MessageFlags.Ephemeral });
      return;
    }
    const sub = interaction.options.getSubcommand();
    const db = interaction.client.db;
    if (sub === 'stats') {
      const s = db.stats();
      await interaction.reply({ content: `📊 Felhasználók: **${s.users}**, összes kredit: **${credits(s.credits)}**, szerverek: **${interaction.client.guilds.cache.size}**`, flags: MessageFlags.Ephemeral });
      return;
    }
    const target = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    try {
      const balance = sub === 'add' ? db.add(target.id, amount) : db.remove(target.id, amount);
      await interaction.reply({ content: `✅ **${credits(amount)}** ${sub === 'add' ? 'hozzáadva' : 'levonva'}: ${target}. Új egyenleg: **${credits(balance)}**`, allowedMentions: { parse: [] } });
    } catch (err) {
      await interaction.reply({ content: `❌ ${err.message}`, flags: MessageFlags.Ephemeral });
    }
  },
};
