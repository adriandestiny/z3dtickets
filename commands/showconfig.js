const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('showconfig')
    .setDescription('Display the current config and mappings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    try {
      const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
      let output = 'Current Config:\n';
      output += `Log Channel: ${config.logChannelId ? `<#${config.logChannelId}> (${config.logChannelId})` : 'Not set'}\n`;
      output += `Support Role: ${config.supportRoleId ? `<@&${config.supportRoleId}> (${config.supportRoleId})` : 'Not set'}\n`;
      if (config.reactionRoles && config.reactionRoles.emojiRoleMap) {
        output += '\nReaction Role Mappings:';
        for (const [emoji, roleId] of Object.entries(config.reactionRoles.emojiRoleMap)) {
          const label = config.reactionRoles.emojiLabels && config.reactionRoles.emojiLabels[emoji] ? config.reactionRoles.emojiLabels[emoji] : '';
          output += `\n${emoji} → <@&${roleId}> ${label ? `— ${label}` : ''}`;
        }
      } else {
        output += '\nNo reaction role mappings set.';
      }
      await interaction.reply({ content: output, flags: 64 });
    } catch (e) {
      await interaction.reply({ content: 'Failed to load config.', flags: 64 });
    }
  }
};
