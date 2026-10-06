import { Events, MessageFlags } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`Ismeretlen parancs: ${interaction.commandName}`);
      return;
    }
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`Hiba a /${interaction.commandName} parancsban:`, err);
      const payload = { content: '❌ Hiba történt a parancs futtatása közben.', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
      else await interaction.reply(payload).catch(() => {});
    }
  },
};
