const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-reaction-roles')
    .setDescription('Post a reaction role message and record its ID'),
  async execute(interaction) {
    const rr = config.reactionRoles;
    if (!rr || !rr.emojiRoleMap || Object.keys(rr.emojiRoleMap).length === 0) {
      return interaction.reply({ content: 'Reaction role configuration is missing.', ephemeral: true });
    }
    const message = await interaction.reply({
      content: rr.messageContent || 'React to get your roles:',
      fetchReply: true
    });
    for (const emoji of Object.keys(rr.emojiRoleMap)) {
      try {
        await message.react(emoji);
      } catch (e) {
        console.error(`Failed to react with ${emoji}`, e);
      }
    }
    config.reactionRoles.messageId = message.id;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
  }
};
