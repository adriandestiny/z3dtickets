const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saveconfig')
    .setDescription('Backup config and mappings to a channel as a JSON file')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // Ask for backup channel ID
    await interaction.reply({ content: 'Please provide the channel ID where the config backup should be sent (e.g., 123456789012345678).', flags: 64 });
    const filter = m => m.author.id === interaction.user.id && /^\d{17,19}$/.test(m.content.trim());
    try {
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      const backupChannelId = collected.first().content.trim();
      // Read config and mappings from local files
      const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
      let reactionRoles = {};
      if (config.reactionRoles) {
        reactionRoles = config.reactionRoles;
      }
      const backup = {
        config,
        reactionRoles
      };
      const json = JSON.stringify(backup, null, 2);
      const file = new AttachmentBuilder(Buffer.from(json), { name: `config-backup-${interaction.guild.id}.json` });
      const backupChannel = interaction.guild.channels.cache.get(backupChannelId);
      if (!backupChannel) {
        await interaction.followUp({ content: 'Invalid channel ID. Backup aborted.', flags: 64 });
        return;
      }
      await backupChannel.send({ content: `Config backup for guild ${interaction.guild.id}`, files: [file] });
      await interaction.followUp({ content: 'Config backup saved successfully!', flags: 64 });
      // Log to the log channel if set
      const logChannelId = config.logChannelId;
      if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          await logChannel.send(`A config backup was created by <@${interaction.user.id}> and sent to <#${backupChannelId}>.`);
        }
      }
    } catch (e) {
      await interaction.followUp({ content: 'Backup failed or timed out. Please try again.', flags: 64 });
    }
  }
};
