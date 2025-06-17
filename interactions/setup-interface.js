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
          return interaction.reply({ content: 'Only administrators can run this setup.', ephemeral: true });
        }
        // Ask for support role (mention or ID)
        await interaction.reply({ content: 'Please mention the support role (e.g., @Support) or provide the role ID (e.g., 123456789012345678).', ephemeral: true });
        const filter = m => m.author.id === interaction.user.id && (m.mentions.roles.size > 0 || /^\d{17,19}$/.test(m.content.trim()));
        try {
          const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
          let roleId;
          if (collected.first().mentions.roles.size > 0) {
            roleId = collected.first().mentions.roles.first().id;
          } else {
            roleId = collected.first().content.trim();
          }
          config.supportRoleId = roleId;
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
        config.reactionRoles = config.reactionRoles || { emojiRoleMap: {} };
        let adding = true;
        await interaction.reply({ content: 'Send an emoji and a role ID to map (e.g., 🔥 123456789012345678), or type `done` to finish.', ephemeral: true });
        while (adding) {
          const filter = m => m.author.id === interaction.user.id;
          try {
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
            const msg = collected.first();
            if (msg.content.toLowerCase() === 'done') break;
            const [emoji, roleId] = msg.content.trim().split(/\s+/);
            if (!emoji || !/^\d{17,19}$/.test(roleId)) {
              await interaction.channel.send('Invalid format. Please send an emoji and a role ID (e.g., 🔥 123456789012345678).');
              continue;
            }
            config.reactionRoles.emojiRoleMap[emoji] = roleId;
            await interaction.channel.send(`Mapped ${emoji} to role ID ${roleId}.`);
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
