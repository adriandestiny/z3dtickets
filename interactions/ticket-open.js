const { ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
  init(client) {
    client.on('interactionCreate', async interaction => {
      if (!interaction.isButton() || interaction.customId !== 'open_ticket') return;
      const guild = interaction.guild;
      const user = interaction.user;
      const supportAgentRole = config.supportAgentRoleId;
      // Create ticket channel with restricted permissions
      const channel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: supportAgentRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: guild.roles.cache.find(r => r.permissions.has(PermissionFlagsBits.Administrator))?.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });
      // Add close button
      const closeBtn = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger);
      const row = new ActionRowBuilder().addComponents(closeBtn);
      // Notify roles
      let notifyMentions = '';
      if (Array.isArray(config.ticketNotifyRoleIds) && config.ticketNotifyRoleIds.length > 0) {
        notifyMentions = config.ticketNotifyRoleIds.map(id => `<@&${id}>`).join(' ');
      }
      await channel.send({
        content: `${notifyMentions} <@${user.id}> Your ticket is open. A support member will be with you soon.`.trim(),
        components: [row]
      });
      // Log event
      const logChannel = guild.channels.cache.get(config.logChannelId);
      if (logChannel) logChannel.send(`:ticket: Ticket opened by ${user.tag} (${user.id}) in <#${channel.id}>`);
      client.emit('ticketOpened', { user: user.tag, channel: channel.name });
      await interaction.reply({ content: `Ticket created: <#${channel.id}>`, ephemeral: true });
      // Store ticket metadata for transcript logging
      if (!global.ticketMeta) global.ticketMeta = {};
      global.ticketMeta[channel.id] = {
        creatorId: user.id,
        creatorTag: user.tag,
        createdAt: new Date().toISOString()
      };
    });
  }
};
