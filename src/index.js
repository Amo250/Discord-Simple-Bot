'use strict';

const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { token } = require('./config');
const { registerCommands } = require('./register-commands');
const { handleMemberAdd } = require('./handlers/memberAdd');
const { handleInteractionCreate } = require('./handlers/interactionCreate');

/**
 * Discord client
 * - Guilds: required for slash commands
 * - GuildMembers: required for guildMemberAdd event and role toggles
 */
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember],
});

// Slash commands collection (loaded manually here, can be automated if you want)
client.commands = new Collection();
client.commands.set('autorole', require('./commands/autorole'));
client.commands.set('panel', require('./commands/panel'));

client.once('ready', async () => {
  console.log(`[ready] Logged in as ${client.user.tag}`);

  // Register commands on startup for convenience.
  // You can disable this if you prefer manual `npm run register`.
  try {
    await registerCommands();
  } catch (error) {
    console.error('[ready] Failed to register commands:', error);
  }
});

client.on('guildMemberAdd', async (member) => {
  await handleMemberAdd(member);
});

client.on('interactionCreate', async (interaction) => {
  await handleInteractionCreate(interaction);
});

if (!token) {
  console.error('Missing DISCORD_TOKEN in environment.');
  process.exit(1);
}

client.login(token);
