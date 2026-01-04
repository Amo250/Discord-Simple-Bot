'use strict';

const db = require('../db');

async function handleMemberAdd(member) {
  const rows = db
    .prepare('SELECT role_id FROM guild_autoroles WHERE guild_id = ?')
    .all(member.guild.id);

  if (!rows.length) return;

  const rolesToAdd = rows
    .map((r) => member.guild.roles.cache.get(r.role_id))
    .filter(Boolean);

  if (!rolesToAdd.length) return;

  try {
    await member.roles.add(rolesToAdd, 'Auto roles on join');
  } catch (error) {
    console.error('[memberAdd] Failed to add auto roles:', error);
  }
}

module.exports = { handleMemberAdd };
