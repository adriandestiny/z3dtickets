const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, Events } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  init(client) {
    // Ticket setup flow
    client.on('interactionCreate', async interaction => {
      if (!interaction.isButton()) return;
      // Ticket setup flow
      if (interaction.customId === 'setup_ticket_flow') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: 'Only administrators can run this setup.', flags: 64 });
        }
        // Immediately reply to the interaction to avoid expiration
        await interaction.reply({ content: 'Ticket setup started! Please follow the instructions in this channel.', flags: 64 });
        // Ask for support agent role (mention or ID)
        await interaction.channel.send('Please mention the support agent role (e.g., @SupportAgent) or provide the role ID (e.g., 123456789012345678). Only members with this role or admins will be able to view tickets.');
        const filter = m => m.author.id === interaction.user.id && (m.mentions.roles.size > 0 || /^\d{17,19}$/.test(m.content.trim()));
        try {
          const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
          let supportAgentRoleId;
          if (collected.first().mentions.roles.size > 0) {
            supportAgentRoleId = collected.first().mentions.roles.first().id;
          } else {
            supportAgentRoleId = collected.first().content.trim();
          }
          config.supportAgentRoleId = supportAgentRoleId;
          // Ask for log channel ID
          await interaction.channel.send('Please provide the log channel ID (e.g., 1375124421659857019).');
          const filter2 = m => m.author.id === interaction.user.id && /^\d{17,19}$/.test(m.content.trim());
          const collected2 = await interaction.channel.awaitMessages({ filter: filter2, max: 1, time: 60000, errors: ['time'] });
          const logChannelId = collected2.first().content.trim();
          config.logChannelId = logChannelId;
          // Ask for roles to notify (mention or IDs, space/comma separated)
          await interaction.channel.send('Please mention the role(s) to notify when a ticket is opened, or provide their IDs (separated by spaces or commas).');
          const filter3 = m => m.author.id === interaction.user.id && (m.mentions.roles.size > 0 || /\d{17,19}/.test(m.content));
          const collected3 = await interaction.channel.awaitMessages({ filter: filter3, max: 1, time: 60000, errors: ['time'] });
          const msg3 = collected3.first();
          let notifyRoleIds = [];
          if (msg3.mentions.roles.size > 0) {
            notifyRoleIds = msg3.mentions.roles.map(r => r.id);
          } else {
            notifyRoleIds = msg3.content.match(/\d{17,19}/g) || [];
          }
          config.ticketNotifyRoleIds = notifyRoleIds;
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
          await interaction.channel.send('✅ Ticket support setup complete!');
        } catch (e) {
          await interaction.channel.send('Setup timed out or failed. Please try again.');
        }
      }
      // Reaction role setup flow
      if (interaction.customId === 'setup_reaction_roles_flow') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: 'Only administrators can run this setup.', ephemeral: true });
        }
        config.reactionRoles = config.reactionRoles || { emojiRoleMap: {}, emojiLabels: {} };
        let adding = true;
        await interaction.reply({ content: 'Send an emoji, mention a role, and a label for the button (e.g., 🔥 @Role Support), or type `done` to finish. The label is what the reaction is for (e.g., Support, Events, Updates, etc).', ephemeral: true });
        while (adding) {
          const filter = m => m.author.id === interaction.user.id;
          try {
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
            const msg = collected.first();
            if (msg.content.toLowerCase() === 'done') break;
            // Parse: emoji, role (mention or ID), label
            const match = msg.content.trim().match(/^(\p{Emoji}|\S+)\s+(<@&\d{17,19}>|\d{17,19})\s+(.+)$/u);
            if (!match) {
              await interaction.channel.send('Invalid format. Please send an emoji, mention a role, and a label (e.g., 🔥 @Role Support).');
              continue;
            }
            const emoji = match[1];
            let roleId;
            if (match[2].startsWith('<@&')) {
              roleId = match[2].replace(/<@&(\d{17,19})>/, '$1');
            } else {
              roleId = match[2];
            }
            const label = match[3].trim();
            config.reactionRoles.emojiRoleMap[emoji] = roleId;
            config.reactionRoles.emojiLabels = config.reactionRoles.emojiLabels || {};
            config.reactionRoles.emojiLabels[emoji] = label;
            await interaction.channel.send(`Mapped ${emoji} to <@&${roleId}> for "${label}".`);
          } catch (e) {
            await interaction.channel.send('Setup timed out or failed. Please try again.');
            break;
          }
        }
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        await interaction.channel.send('✅ Reaction role setup complete!');
      }
    });
  }
};
