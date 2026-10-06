import { SlashCommandBuilder } from 'discord.js';
import { credits } from '../../lib/format.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Kreditegyenleg (minden szerveren közös)')
    .addUserOption((o) => o.setName('user').setDescription('Másik felhasználó egyenlege')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const balance = interaction.client.db.balance(target.id);
    const who = target.id === interaction.user.id ? 'Egyenleged' : `${target.username} egyenlege`;
    await interaction.reply(`💰 ${who}: **${credits(balance)}**`);
  },
};
