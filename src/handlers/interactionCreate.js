'use strict';

const db = require('../db');

/**
 * Check whether the bot is allowed to manage a role.
 * This prevents most common failures:
 * - role is higher than the bot's top role
 * - role is managed by an integration
 * - missing permission Manage Roles
 */
function canManageRole(botMember, role) {
  if (!role) return { ok: false, reason: 'Role not found.' };
  if (role.managed) return { ok: false, reason: 'This role is managed by an integration.' };

  if (!botMember?.permissions?.has('ManageRoles')) {
    return { ok: false, reason: 'Bot lacks the Manage Roles permission.' };
  }

  // The bot must have a higher top role than the target role.
  if (botMember.roles.highest.comparePositionTo(role) <= 0) {
    return { ok: false, reason: 'Role is higher or equal to the bot top role.' };
  }

  return { ok: true, reason: '' };
}

/**
 * Central interaction handler:
 * - Slash commands
 * - Button interactions (role toggle)
 */
async function handleInteractionCreate(interaction) {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('[command] Execution error:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: 'An error occurred.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'An error occurred.', ephemeral: true });
      }
    }
    return;
  }

  // Button interactions: toggle a role on the clicking member
  if (!interaction.isButton()) return;

  const binding = db
    .prepare('SELECT role_id FROM role_panel_buttons WHERE custom_id = ?')
    .get(interaction.customId);

  if (!binding) {
    await interaction.reply({ content: 'This button is not configured.', ephemeral: true });
    return;
  }

  const role = interaction.guild.roles.cache.get(binding.role_id);
  if (!role) {
    await interaction.reply({ content: 'Role not found (it may have been deleted).', ephemeral: true });
    return;
  }

  const botMember = interaction.guild.members.me;
  const check = canManageRole(botMember, role);

  if (!check.ok) {
    await interaction.reply({ content: `I cannot manage this role: ${check.reason}`, ephemeral: true });
    return;
  }

  const member = interaction.member;
  const hasRole = member.roles.cache.has(role.id);

  try {
    if (hasRole) {
      await member.roles.remove(role, 'Role panel button toggle');
      await interaction.reply({ content: `Role removed: ${role.name}`, ephemeral: true });
    } else {
      await member.roles.add(role, 'Role panel button toggle');
      await interaction.reply({ content: `Role added: ${role.name}`, ephemeral: true });
    }
  } catch (error) {
    console.error('[button] Role toggle error:', error);
    await interaction.reply({
      content: 'I could not update your roles. Check permissions and role hierarchy.',
      ephemeral: true,
    });
  }
}

module.exports = { handleInteractionCreate };
