import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Megmutatja a bot késleltetését'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pingelés...', withResponse: true });
    const roundtrip = sent.resource.message.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`☄️ Meteor pong! Válaszidő: **${roundtrip} ms**, WebSocket: **${interaction.client.ws.ping} ms**`);
  },
};
