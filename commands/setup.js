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
    const channel = interaction.channel;
    const filter = m => m.author.id === interaction.user.id;
    await interaction.reply({ content: 'Starting interactive setup! Please answer the following questions in this channel.', ephemeral: false });
    // Support Role
    await channel.send('1️⃣ What is the **support role**? Please mention it (e.g., @Support).');
    const collectedRole = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
    const role = collectedRole.first().mentions.roles.first();
    if (!role) return channel.send('No role mentioned. Setup cancelled.');
    config.supportRoleId = role.id;
    // Log Channel
    await channel.send('2️⃣ What is the **log channel**? Please mention it (e.g., #logs).');
    const collectedChannel = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
    const logChannel = collectedChannel.first().mentions.channels.first();
    if (!logChannel) return channel.send('No channel mentioned. Setup cancelled.');
    config.logChannelId = logChannel.id;
    // Reaction Roles
    await channel.send('3️⃣ Do you want to set up reaction roles now? Reply with `yes` or `no`.');
    const collectedRR = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
    if (collectedRR.first().content.toLowerCase() === 'yes') {
      config.reactionRoles = config.reactionRoles || { emojiRoleMap: {} };
      let adding = true;
      while (adding) {
        await channel.send('Send an emoji and mention a role to map (e.g., 🔥 @FireRole), or type `done` to finish.');
        const collectedMap = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
        const msg = collectedMap.first();
        if (msg.content.toLowerCase() === 'done') break;
        const emojiMatch = msg.content.match(/\p{Emoji}/u);
        const emoji = emojiMatch ? emojiMatch[0] : msg.content.split(' ')[0];
        const mapRole = msg.mentions.roles.first();
        if (!emoji || !mapRole) {
          await channel.send('Invalid format. Please send an emoji and mention a role.');
          continue;
        }
        config.reactionRoles.emojiRoleMap[emoji] = mapRole.id;
        await channel.send(`Mapped ${emoji} to <@&${mapRole.id}>.`);
      }
    }
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    await channel.send('✅ Setup complete! You can now use the bot.');
  },
};
