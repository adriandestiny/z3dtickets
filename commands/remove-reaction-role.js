const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-reaction-role')
    .setDescription('Remove a reaction role mapping (owner only)')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji to remove')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // Only allow server owner
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can use this command.', flags: 64 });
    }
    const emoji = interaction.options.getString('emoji');
    if (!config.reactionRoles || !config.reactionRoles.emojiRoleMap || !config.reactionRoles.emojiRoleMap[emoji]) {
      return interaction.reply({ content: `No mapping found for emoji ${emoji}.`, ephemeral: true });
    }
    delete config.reactionRoles.emojiRoleMap[emoji];
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    return interaction.reply({ content: `Removed mapping for emoji ${emoji}.`, ephemeral: true });
  }
};
