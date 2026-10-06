import { Events, MessageFlags } from 'discord.js';
import { checkCooldown } from '../lib/cooldowns.js';
import { formatDuration } from '../lib/format.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    if (interaction.isAutocomplete()) {
      if (command.autocomplete) await command.autocomplete(interaction).catch(() => {});
      return;
    }
    if (!interaction.isChatInputCommand()) return;

    const wait = checkCooldown(interaction.user.id, interaction.commandName, command.cooldown ?? 1);
    if (wait > 0) {
      await interaction.reply({ content: `⏳ Várj még ${formatDuration(wait)}, mielőtt újra használod a /${interaction.commandName} parancsot.`, flags: MessageFlags.Ephemeral }).catch(() => {});
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
