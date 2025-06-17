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
        if (interaction.user.id !== interaction.guild.ownerId) {
          return interaction.reply({ content: 'Only the server owner can run this setup.', ephemeral: true });
        }
        // Ask for support role
        await interaction.reply({ content: 'Please mention the support role (e.g., @Support).', ephemeral: true });
        const filter = m => m.author.id === interaction.user.id && m.mentions.roles.size > 0;
        try {
          const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
          const role = collected.first().mentions.roles.first();
          if (!role) return interaction.channel.send('No role mentioned. Setup cancelled.');
          config.supportRoleId = role.id;
          // Ask for log channel
          await interaction.channel.send('Please mention the log channel (e.g., #logs).');
          const filter2 = m => m.author.id === interaction.user.id && m.mentions.channels.size > 0;
          const collected2 = await interaction.channel.awaitMessages({ filter: filter2, max: 1, time: 60000, errors: ['time'] });
          const logChannel = collected2.first().mentions.channels.first();
          if (!logChannel) return interaction.channel.send('No channel mentioned. Setup cancelled.');
          config.logChannelId = logChannel.id;
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
          await interaction.channel.send('✅ Ticket support setup complete!');
        } catch (e) {
          await interaction.channel.send('Setup timed out or failed. Please try again.');
        }
      }
      // Reaction role setup flow
      if (interaction.customId === 'setup_reaction_roles_flow') {
        if (interaction.user.id !== interaction.guild.ownerId) {
          return interaction.reply({ content: 'Only the server owner can run this setup.', ephemeral: true });
        }
        config.reactionRoles = config.reactionRoles || { emojiRoleMap: {} };
        let adding = true;
        await interaction.reply({ content: 'Send an emoji and mention a role to map (e.g., 🔥 @FireRole), or type `done` to finish.', ephemeral: true });
        while (adding) {
          const filter = m => m.author.id === interaction.user.id;
          try {
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
            const msg = collected.first();
            if (msg.content.toLowerCase() === 'done') break;
            const emojiMatch = msg.content.match(/\p{Emoji}/u);
            const emoji = emojiMatch ? emojiMatch[0] : msg.content.split(' ')[0];
            const mapRole = msg.mentions.roles.first();
            if (!emoji || !mapRole) {
              await interaction.channel.send('Invalid format. Please send an emoji and mention a role.');
              continue;
            }
            config.reactionRoles.emojiRoleMap[emoji] = mapRole.id;
            await interaction.channel.send(`Mapped ${emoji} to <@&${mapRole.id}>.`);
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
