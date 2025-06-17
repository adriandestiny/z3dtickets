const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-reaction-roles')
    .setDescription('Post a reaction role message and record its ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const rr = config.reactionRoles;
    if (!rr || !rr.emojiRoleMap || Object.keys(rr.emojiRoleMap).length === 0) {
      return interaction.reply({ content: 'Reaction role configuration is missing.', ephemeral: true });
    }
    // Prompt for which reactions to add and what they are for
    await interaction.reply({ content: 'React to this message with the emojis you want to use for roles. Only your reactions will be added. After reacting, type `done` and specify what each emoji is for (e.g., Support, Events, Updates, etc).', fetchReply: true });
    const message = await interaction.fetchReply();
    // Wait for user reactions
    const filter = (reaction, user) => user.id === interaction.user.id && rr.emojiRoleMap[reaction.emoji.name];
    const collected = await message.awaitReactions({ filter, time: 60000 });
    // Only add reactions set by the user
    for (const [emoji, roleId] of Object.entries(rr.emojiRoleMap)) {
      if (collected.has(emoji)) {
        try {
          await message.react(emoji);
        } catch (e) {
          console.error(`Failed to react with ${emoji}`, e);
        }
      }
    }
    config.reactionRoles.messageId = message.id;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
  }
};
