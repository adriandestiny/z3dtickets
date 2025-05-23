const { ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
  init(client) {
    client.on('interactionCreate', async interaction => {
      if (!interaction.isButton() || interaction.customId !== 'open_ticket') return;
      const guild = interaction.guild;
      const user = interaction.user;
      const supportRole = config.supportRoleId;
      // Create ticket channel
      const channel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: supportRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });
      // Add close button
      const closeBtn = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger);
      const row = new ActionRowBuilder().addComponents(closeBtn);
      await channel.send({
        content: `<@${user.id}> Your ticket is open. A support member will be with you soon.`,
        components: [row]
      });
      // Log event
      const logChannel = guild.channels.cache.get(config.logChannelId);
      if (logChannel) logChannel.send(`:ticket: Ticket opened by ${user.tag} (${user.id}) in <#${channel.id}>`);
      client.emit('ticketOpened', { user: user.tag, channel: channel.name });
      await interaction.reply({ content: `Ticket created: <#${channel.id}>`, ephemeral: true });
    });
  }
};
