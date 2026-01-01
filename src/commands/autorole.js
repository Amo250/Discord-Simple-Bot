'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure auto role on member join')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set the auto role')
        .addRoleOption((opt) => opt.setName('role').setDescription('Role to assign on join').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('clear').setDescription('Disable auto role')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'set') {
      const role = interaction.options.getRole('role', true);

      db.prepare(`
        INSERT INTO guild_settings (guild_id, auto_role_id)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET auto_role_id = excluded.auto_role_id
      `).run(guildId, role.id);

      await interaction.reply({ content: `Auto role set to: **${role.name}**`, ephemeral: true });
      return;
    }

    if (sub === 'clear') {
      db.prepare(`
        INSERT INTO guild_settings (guild_id, auto_role_id)
        VALUES (?, NULL)
        ON CONFLICT(guild_id) DO UPDATE SET auto_role_id = NULL
      `).run(guildId);

      await interaction.reply({ content: 'Auto role disabled.', ephemeral: true });
    }
  },
};
