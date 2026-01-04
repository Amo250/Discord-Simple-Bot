'use strict';

const Database = require('better-sqlite3');

/**
 * SQLite database.
 * - bot.sqlite is created automatically in the working directory
 * - better-sqlite3 is synchronous and fast for this small workload
 */
const db = new Database('bot.sqlite');

// Auto-roles per guild (multiple)
db.exec(`
  CREATE TABLE IF NOT EXISTS guild_autoroles (
    guild_id TEXT NOT NULL,
    role_id  TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    PRIMARY KEY (guild_id, role_id)
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_guild_autoroles_guild
  ON guild_autoroles(guild_id);
`);

// Panels
db.exec(`
  CREATE TABLE IF NOT EXISTS role_panels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT
  );
`);

// Panel buttons
db.exec(`
  CREATE TABLE IF NOT EXISTS role_panel_buttons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    panel_id INTEGER NOT NULL,
    custom_id TEXT NOT NULL UNIQUE,
    role_id TEXT NOT NULL,
    label TEXT NOT NULL,
    style INTEGER NOT NULL,
    emoji TEXT,
    group_name TEXT NOT NULL DEFAULT 'General',
    position INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(panel_id) REFERENCES role_panels(id) ON DELETE CASCADE
  );
`);

module.exports = db;
