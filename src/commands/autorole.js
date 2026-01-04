'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure auto roles on member join')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)

    // Add role
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add an auto role')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role to assign on join').setRequired(true)
        )
    )

    // Remove role
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove an auto role')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role to stop assigning on join').setRequired(true)
        )
    )

    // List roles
    .addSubcommand((sub) => sub.setName('list').setDescription('List auto roles'))

    // Clear all
    .addSubcommand((sub) => sub.setName('clear').setDescription('Clear all auto roles'))

    // Optional: keep "set" as alias to replace the whole list with 1 role
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Replace auto roles with a single role')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role to assign on join').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'add') {
      const role = interaction.options.getRole('role', true);

      db.prepare(`
        INSERT OR IGNORE INTO guild_autoroles (guild_id, role_id)
        VALUES (?, ?)
      `).run(guildId, role.id);

      await interaction.reply({ content: `✅ Auto role added: **${role.name}**`, ephemeral: true });
      return;
    }

    if (sub === 'remove') {
      const role = interaction.options.getRole('role', true);

      const res = db.prepare(`
        DELETE FROM guild_autoroles
        WHERE guild_id = ? AND role_id = ?
      `).run(guildId, role.id);

      await interaction.reply({
        content: res.changes
          ? `🗑️ Auto role removed: **${role.name}**`
          : `ℹ️ **${role.name}** was not in the auto role list.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'list') {
      const rows = db.prepare(`
        SELECT role_id FROM guild_autoroles
        WHERE guild_id = ?
        ORDER BY created_at ASC
      `).all(guildId);

      if (!rows.length) {
        await interaction.reply({ content: 'No auto roles configured.', ephemeral: true });
        return;
      }

      const names = rows
        .map((r) => interaction.guild.roles.cache.get(r.role_id))
        .filter(Boolean)
        .map((role) => `• ${role.name} (${role.id})`);

      await interaction.reply({
        content: `Auto roles on join:\n${names.join('\n')}`,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'clear') {
      db.prepare(`DELETE FROM guild_autoroles WHERE guild_id = ?`).run(guildId);
      await interaction.reply({ content: '🧹 All auto roles cleared.', ephemeral: true });
      return;
    }

    // alias: set = replace by a single role
    if (sub === 'set') {
      const role = interaction.options.getRole('role', true);

      const tx = db.transaction(() => {
        db.prepare(`DELETE FROM guild_autoroles WHERE guild_id = ?`).run(guildId);
        db.prepare(`INSERT INTO guild_autoroles (guild_id, role_id) VALUES (?, ?)`).run(guildId, role.id);
      });

      tx();

      await interaction.reply({
        content: `✅ Auto roles replaced with: **${role.name}**`,
        ephemeral: true,
      });
    }
  },
};
