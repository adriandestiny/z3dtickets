const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
let config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-admin-panel')
    .setDescription('Admin panel for welcome message, reaction roles, logs, and support settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    if (!config[guildId]) config[guildId] = {};
    let output = '**Admin Panel**\n';
    // Show current welcome message
    output += `Welcome Message: ${config[guildId].welcomeMessage || 'Not set'}\n`;
    // Show current log channel
    output += `Log Channel: ${config[guildId].logChannelId ? `<#${config[guildId].logChannelId}> (${config[guildId].logChannelId})` : 'Not set'}\n`;
    // Show current support role
    output += `Support Role: ${config[guildId].supportAgentRoleId ? `<@&${config[guildId].supportAgentRoleId}> (${config[guildId].supportAgentRoleId})` : 'Not set'}\n`;
    // Show current mention roles
    output += `Mention Roles: ${(config[guildId].ticketNotifyRoleIds && config[guildId].ticketNotifyRoleIds.length) ? config[guildId].ticketNotifyRoleIds.map(id => `<@&${id}>`).join(', ') : 'Not set'}\n`;
    // Show current reaction message
    output += `Reaction Message: ${config[guildId].reactionRoles && config[guildId].reactionRoles.messageContent ? config[guildId].reactionRoles.messageContent : 'Not set'}\n`;
    // Show current reaction roles
    if (config[guildId].reactionRoles && config[guildId].reactionRoles.emojiRoleMap) {
      output += '\nReaction Role Mappings:';
      for (const [emoji, roleId] of Object.entries(config[guildId].reactionRoles.emojiRoleMap)) {
        const label = config[guildId].reactionRoles.emojiLabels && config[guildId].reactionRoles.emojiLabels[emoji] ? config[guildId].reactionRoles.emojiLabels[emoji] : '';
        output += `\n${emoji} \u2192 <@&${roleId}> ${label ? `\u2014 ${label}` : ''}`;
      }
    } else {
      output += '\nNo reaction role mappings set.';
    }
    // Panel buttons
    const updateBtn = new ButtonBuilder()
      .setCustomId('admin_panel_update')
      .setLabel('Update Panel')
      .setStyle(ButtonStyle.Primary);
    const grabSupportBtn = new ButtonBuilder()
      .setCustomId('admin_panel_grab_support')
      .setLabel('Grab Support Role')
      .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder().addComponents(updateBtn, grabSupportBtn);
    await interaction.reply({ content: output, components: [row], ephemeral: true });
  }
};
