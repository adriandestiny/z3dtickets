// Utility functions for permission checks and logging
const { PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = {
  hasSupportRole(member, supportRoleId) {
    return member.roles.cache.has(supportRoleId);
  },
  logEvent(type, user, channel, config) {
    // Optionally extend for file logging
    // For now, just a stub for channel logging
    return `[${type}] ${user.tag} in #${channel.name}`;
  }
};
