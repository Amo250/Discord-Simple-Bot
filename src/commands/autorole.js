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
    .addSubcommand((sub) => sub.setName('list').setDescription('List auto roles')),

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

      const roles = rows
          .map((r) => interaction.guild.roles.cache.get(r.role_id))
          .filter(Boolean);

      if (!roles.length) {
        await interaction.reply({
          content: 'Auto roles are configured, but none of the roles exist anymore on this server.',
          ephemeral: true,
        });
        return;
      }

      const lines = roles.map((role) => `• ${role.name} (${role.id})`);

      await interaction.reply({
        content: `Auto roles on join:\n${lines.join('\n')}`,
        ephemeral: true,
      });
      return;
    }

    // Safety fallback (should never happen)
    await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
  }

};
