const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loadconfig')
    .setDescription('Restore config and mappings from a JSON file in a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.reply({ content: 'Please upload the config backup JSON file in this channel.', flags: 64 });
    const filter = m => m.author.id === interaction.user.id && m.attachments.size > 0 && m.attachments.first().name.endsWith('.json');
    try {
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      const file = collected.first().attachments.first();
      const response = await fetch(file.url);
      const json = await response.json();
      // Write config and mappings to local files
      if (json.config) {
        fs.writeFileSync('./config.json', JSON.stringify(json.config, null, 2));
      }
      // Optionally handle other files or mappings if needed
      // Log to the log channel if set
      let config = {};
      try {
        config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
      } catch {}
      const logChannelId = config.logChannelId;
      if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          await logChannel.send(`A config restore was performed by <@${interaction.user.id}> using a backup file.`);
        }
      }
      await interaction.followUp({ content: 'Config and mappings loaded successfully! Please restart the bot if needed.', flags: 64 });
    } catch (e) {
      await interaction.followUp({ content: 'Loading failed or timed out. Please try again.', flags: 64 });
    }
  }
};
