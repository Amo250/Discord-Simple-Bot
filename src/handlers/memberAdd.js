'use strict';

const db = require('../db');

/**
 * Handle auto-role assignment when a member joins a guild.
 * The role is configured per guild in the database.
 */
async function handleMemberAdd(member) {
  const row = db
    .prepare('SELECT auto_role_id FROM guild_settings WHERE guild_id = ?')
    .get(member.guild.id);

  if (!row || !row.auto_role_id) return;

  const role = member.guild.roles.cache.get(row.auto_role_id);
  if (!role) return;

  try {
    await member.roles.add(role, 'Auto role on join');
  } catch (error) {
    console.error('[memberAdd] Failed to add auto role:', error);
  }
}

module.exports = { handleMemberAdd };
