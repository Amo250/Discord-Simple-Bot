'use strict';

const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config');

const autorole = require('./commands/autorole');
const panel = require('./commands/panel');

/**
 * Register slash commands globally.
 * Global commands can take a few minutes to propagate on Discord.
 * For faster iteration you can switch to guild commands (not included here).
 */
async function registerCommands() {
  if (!clientId || !token) {
    throw new Error('Missing DISCORD_CLIENT_ID or DISCORD_TOKEN in environment.');
  }

  const rest = new REST({ version: '10' }).setToken(token);
  const commands = [autorole.data.toJSON(), panel.data.toJSON()];

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('[register] Slash commands registered');
}

if (require.main === module) {
  registerCommands().catch((error) => {
    console.error('[register] Failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { registerCommands };
