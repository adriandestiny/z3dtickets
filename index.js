// Discord Ticket Bot Entry Point
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } = require('discord.js');
const config = require('./config.json');
const utils = require('./utils');
const { logTicketEvent } = require('./utils/ticketLogger');
const permissions = require('./utils/permissions');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

client.commands = new Collection();

// Load commands
fs.readdirSync('./commands').filter(f => f.endsWith('.js')).forEach(file => {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
});

// Load interactions
fs.readdirSync('./interactions').filter(f => f.endsWith('.js')).forEach(file => {
  const interaction = require(`./interactions/${file}`);
  if (interaction.init) interaction.init(client);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction, client);
  }
  // Button interactions handled in /interactions
});

// Ticket event logging for open/close
client.on('ticketOpened', (data) => {
  logTicketEvent({
    type: 'open',
    user: data.user,
    channel: data.channel,
    timestamp: new Date().toISOString()
  });
});
client.on('ticketClosed', (data) => {
  logTicketEvent({
    type: 'close',
    user: data.user,
    channel: data.channel,
    timestamp: new Date().toISOString()
  });
});

// Reaction role handling
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  const rr = config.reactionRoles;
  if (!rr || !rr.messageId || reaction.message.id !== rr.messageId) return;
  const emoji = reaction.emoji.name;
  const roleId = rr.emojiRoleMap && rr.emojiRoleMap[emoji];
  if (!roleId) return;
  const member = await reaction.message.guild.members.fetch(user.id);
  await member.roles.add(roleId);
  // Log assignment
  let logChannelId = config.logChannelId;
  if (!logChannelId) {
    // Prompt for log channel if not set
    const channel = reaction.message.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(reaction.message.guild.members.me).has(PermissionFlagsBits.SendMessages));
    if (channel) {
      await channel.send('Please provide a log channel ID for reaction role logs (e.g., 123456789012345678).');
      const filter = m => m.author.id === user.id && /^\d{17,19}$/.test(m.content.trim());
      try {
        const collected = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
        logChannelId = collected.first().content.trim();
        config.logChannelId = logChannelId;
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
      } catch (e) {
        return;
      }
    } else {
      return;
    }
  }
  const logChannel = reaction.message.guild.channels.cache.get(logChannelId);
  if (logChannel) {
    const label = rr.emojiLabels && rr.emojiLabels[emoji] ? rr.emojiLabels[emoji] : '';
    logChannel.send(`:white_check_mark: ${user.tag} (${user.id}) assigned themselves <@&${roleId}> (${label}) via ${emoji}`);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  const rr = config.reactionRoles;
  if (!rr || !rr.messageId || reaction.message.id !== rr.messageId) return;
  const emoji = reaction.emoji.name;
  const roleId = rr.emojiRoleMap && rr.emojiRoleMap[emoji];
  if (!roleId) return;
  const member = await reaction.message.guild.members.fetch(user.id);
  await member.roles.remove(roleId);
  // Log removal
  let logChannelId = config.logChannelId;
  if (!logChannelId) {
    // Prompt for log channel if not set
    const channel = reaction.message.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(reaction.message.guild.members.me).has(PermissionFlagsBits.SendMessages));
    if (channel) {
      await channel.send('Please provide a log channel ID for reaction role logs (e.g., 123456789012345678).');
      const filter = m => m.author.id === user.id && /^\d{17,19}$/.test(m.content.trim());
      try {
        const collected = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
        logChannelId = collected.first().content.trim();
        config.logChannelId = logChannelId;
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
      } catch (e) {
        return;
      }
    } else {
      return;
    }
  }
  const logChannel = reaction.message.guild.channels.cache.get(logChannelId);
  if (logChannel) {
    const label = rr.emojiLabels && rr.emojiLabels[emoji] ? rr.emojiLabels[emoji] : '';
    logChannel.send(`:x: ${user.tag} (${user.id}) removed <@&${roleId}> (${label}) via ${emoji}`);
  }
});

// Auto-register slash commands on Railway or production deploy
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_ENVIRONMENT) {
  try {
    require('./deploy-commands.js');
    console.log('Auto-registered slash commands on deploy.');
  } catch (e) {
    console.error('Failed to auto-register slash commands:', e);
  }
}

async function start() {
  let token = process.env.DISCORD_TOKEN;
  if (!token) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    token = await new Promise(resolve => rl.question('Enter your Discord bot token: ', resolve));
    rl.close();
  }
  client.login(token);
}

start();
