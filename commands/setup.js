const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Interactive setup for tickets and reaction roles (owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: 'Only the server owner can run setup.', ephemeral: true });
    }
    await interaction.reply({ content: 'Starting interactive setup in your DMs!', ephemeral: true });
    try {
      const dm = await interaction.user.createDM();
      const filter = m => m.author.id === interaction.user.id;
      // Support Role
      await dm.send('Welcome to the interactive setup!\n\n1️⃣ What is the **support role**? Please mention it (e.g., @Support).');
      const collectedRole = await dm.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      const role = collectedRole.first().mentions.roles.first();
      if (!role) return dm.send('No role mentioned. Setup cancelled.');
      config.supportRoleId = role.id;
      // Log Channel
      await dm.send('2️⃣ What is the **log channel**? Please mention it (e.g., #logs).');
      const collectedChannel = await dm.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      const channel = collectedChannel.first().mentions.channels.first();
      if (!channel) return dm.send('No channel mentioned. Setup cancelled.');
      config.logChannelId = channel.id;
      // Reaction Roles
      await dm.send('3️⃣ Do you want to set up reaction roles now? Reply with `yes` or `no`.');
      const collectedRR = await dm.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      if (collectedRR.first().content.toLowerCase() === 'yes') {
        config.reactionRoles = config.reactionRoles || { emojiRoleMap: {} };
        let adding = true;
        while (adding) {
          await dm.send('Send an emoji and mention a role to map (e.g., 🔥 @FireRole), or type `done` to finish.');
          const collectedMap = await dm.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
          const msg = collectedMap.first();
          if (msg.content.toLowerCase() === 'done') break;
          const emoji = msg.content.match(/\p{Emoji}/u) ? msg.content.match(/\p{Emoji}/u)[0] : msg.content.split(' ')[0];
          const mapRole = msg.mentions.roles.first();
          if (!emoji || !mapRole) {
            await dm.send('Invalid format. Please send an emoji and mention a role.');
            continue;
          }
          config.reactionRoles.emojiRoleMap[emoji] = mapRole.id;
          await dm.send(`Mapped ${emoji} to <@&${mapRole.id}>.`);
        }
      }
      fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
      await dm.send('✅ Setup complete! You can now use the bot.');
    } catch (err) {
      try { await interaction.user.send('Setup timed out or failed. Please try again.'); } catch {}
    }
  },
};
