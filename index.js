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
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
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

client.login(process.env.DISCORD_TOKEN);
