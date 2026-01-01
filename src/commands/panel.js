'use strict';

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const db = require('../db');

const MAX_BUTTONS_PER_MESSAGE = 25;
const MAX_BUTTONS_PER_ROW = 5;

/**
 * Build the Discord message payload (embed + rows of buttons) for a panel.
 * Buttons are grouped by group_name, and rendered as separate rows.
 * If a group has more than 5 buttons, it spans multiple rows.
 */
function buildPanelMessage(panelId) {
  const panel = db.prepare('SELECT * FROM role_panels WHERE id = ?').get(panelId);

  const buttons = db
    .prepare(`
      SELECT *
      FROM role_panel_buttons
      WHERE panel_id = ?
      ORDER BY group_name ASC, position ASC, id ASC
    `)
    .all(panelId);

  // Enforce Discord limits to avoid API errors
  if (buttons.length > MAX_BUTTONS_PER_MESSAGE) {
    buttons.length = MAX_BUTTONS_PER_MESSAGE;
  }

  const embed = new EmbedBuilder().setTitle(panel.title);

  if (panel.description) embed.setDescription(panel.description);

  // Build a small "legend" in embed fields to make groups clear.
  // This is optional, but improves UX when you have multiple groups.
  const groupsMap = new Map();
  for (const b of buttons) {
    if (!groupsMap.has(b.group_name)) groupsMap.set(b.group_name, []);
    groupsMap.get(b.group_name).push(b);
  }

  if (groupsMap.size > 1) {
    for (const [groupName, groupButtons] of groupsMap.entries()) {
      const line = groupButtons.map((x) => (x.emoji ? `${x.emoji} ${x.label}` : x.label)).join(' • ');
      embed.addFields({ name: groupName, value: line || '-', inline: false });
    }
  }

  // Build rows: each group creates rows of up to 5 buttons.
  const rows = [];

  for (const groupButtons of groupsMap.values()) {
    let currentRow = new ActionRowBuilder();
    let countInRow = 0;

    for (const b of groupButtons) {
      if (countInRow === MAX_BUTTONS_PER_ROW) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
        countInRow = 0;
      }

      const btn = new ButtonBuilder()
        .setCustomId(b.custom_id)
        .setLabel(b.label)
        .setStyle(b.style);

      if (b.emoji) btn.setEmoji(b.emoji);

      currentRow.addComponents(btn);
      countInRow += 1;

      if (rows.length === 5) break; // hard safety: Discord max 5 rows
    }

    if (countInRow > 0 && rows.length < 5) rows.push(currentRow);
    if (rows.length === 5) break;
  }

  return { embeds: [embed], components: rows };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Manage role panels with buttons')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)

    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new role panel message')
        .addChannelOption((opt) => opt.setName('channel').setDescription('Target channel').setRequired(true))
        .addStringOption((opt) => opt.setName('title').setDescription('Panel title').setRequired(true))
        .addStringOption((opt) => opt.setName('description').setDescription('Panel description').setRequired(false))
    )

    .addSubcommand((sub) =>
      sub
        .setName('addbutton')
        .setDescription('Add a role button to an existing panel')
        .addIntegerOption((opt) => opt.setName('panel_id').setDescription('Panel ID').setRequired(true))
        .addRoleOption((opt) => opt.setName('role').setDescription('Role to toggle').setRequired(true))
        .addStringOption((opt) => opt.setName('label').setDescription('Button label').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('style')
            .setDescription('Button style: primary|secondary|success|danger')
            .setRequired(true)
            .addChoices(
              { name: 'primary', value: 'primary' },
              { name: 'secondary', value: 'secondary' },
              { name: 'success', value: 'success' },
              { name: 'danger', value: 'danger' }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('group')
            .setDescription('Group name (e.g. "Group A"). Used for visual grouping.')
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('position')
            .setDescription('Ordering inside the group (0..999). Lower first.')
            .setRequired(false)
        )
        .addStringOption((opt) => opt.setName('emoji').setDescription('Emoji (optional, e.g. 🔒)').setRequired(false))
    )

    .addSubcommand((sub) =>
      sub
        .setName('removebutton')
        .setDescription('Remove a role button from a panel')
        .addIntegerOption((opt) => opt.setName('panel_id').setDescription('Panel ID').setRequired(true))
        .addRoleOption((opt) => opt.setName('role').setDescription('Role to remove from panel').setRequired(true))
    )

    .addSubcommand((sub) =>
      sub
        .setName('refresh')
        .setDescription('Rebuild and update the panel message from database')
        .addIntegerOption((opt) => opt.setName('panel_id').setDescription('Panel ID').setRequired(true))
    )

    .addSubcommand((sub) => sub.setName('list').setDescription('List panels in this server'))

    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete a panel (db + try delete message)')
        .addIntegerOption((opt) => opt.setName('panel_id').setDescription('Panel ID').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'create') {
      const channel = interaction.options.getChannel('channel', true);
      const title = interaction.options.getString('title', true);
      const description = interaction.options.getString('description', false);

      // Create an initial message; we will edit it after buttons are added.
      const tempEmbed = new EmbedBuilder().setTitle(title).setDescription(description || '');
      const message = await channel.send({ embeds: [tempEmbed], components: [] });

      const info = db.prepare(`
        INSERT INTO role_panels (guild_id, channel_id, message_id, title, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(guildId, channel.id, message.id, title, description || null);

      await interaction.reply({
        content: `Panel created. ID: **${info.lastInsertRowid}** (message sent in ${channel}).`,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'list') {
      const panels = db
        .prepare('SELECT id, channel_id, message_id, title FROM role_panels WHERE guild_id = ? ORDER BY id DESC')
        .all(guildId);

      if (!panels.length) {
        await interaction.reply({ content: 'No panels configured.', ephemeral: true });
        return;
      }

      const lines = panels.map((p) => {
        return `• ID **${p.id}** — **${p.title}** (channel <#${p.channel_id}>, message ${p.message_id})`;
      });

      await interaction.reply({ content: lines.join('\n'), ephemeral: true });
      return;
    }

    if (sub === 'delete') {
      const panelId = interaction.options.getInteger('panel_id', true);

      const panel = db.prepare('SELECT * FROM role_panels WHERE id = ? AND guild_id = ?').get(panelId, guildId);
      if (!panel) {
        await interaction.reply({ content: 'Panel not found for this guild.', ephemeral: true });
        return;
      }

      // Best-effort delete: message could be missing or bot may lack perms in that channel.
      try {
        const channel = await interaction.guild.channels.fetch(panel.channel_id);
        const message = await channel.messages.fetch(panel.message_id);
        await message.delete();
      } catch (error) {
        console.warn('[panel.delete] Could not delete message:', error?.message || error);
      }

      db.prepare('DELETE FROM role_panels WHERE id = ? AND guild_id = ?').run(panelId, guildId);

      await interaction.reply({ content: `Panel **${panelId}** deleted.`, ephemeral: true });
      return;
    }

    if (sub === 'addbutton') {
      const panelId = interaction.options.getInteger('panel_id', true);
      const role = interaction.options.getRole('role', true);
      const label = interaction.options.getString('label', true);
      const styleStr = interaction.options.getString('style', true);
      const emoji = interaction.options.getString('emoji', false);
      const groupName = interaction.options.getString('group', false) || 'General';
      const position = interaction.options.getInteger('position', false) ?? 0;

      const panel = db.prepare('SELECT * FROM role_panels WHERE id = ? AND guild_id = ?').get(panelId, guildId);
      if (!panel) {
        await interaction.reply({ content: 'Panel not found for this guild.', ephemeral: true });
        return;
      }

      const count = db
        .prepare('SELECT COUNT(*) AS c FROM role_panel_buttons WHERE panel_id = ?')
        .get(panelId).c;

      if (count >= MAX_BUTTONS_PER_MESSAGE) {
        await interaction.reply({
          content: `This panel already has ${MAX_BUTTONS_PER_MESSAGE} buttons (Discord limit).`,
          ephemeral: true,
        });
        return;
      }

      const styleMap = {
        primary: ButtonStyle.Primary,
        secondary: ButtonStyle.Secondary,
        success: ButtonStyle.Success,
        danger: ButtonStyle.Danger,
      };

      const customId = `rolebtn:${guildId}:${panelId}:${role.id}`;

      try {
        db.prepare(`
          INSERT INTO role_panel_buttons (panel_id, custom_id, role_id, label, style, emoji, group_name, position)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(panelId, customId, role.id, label, styleMap[styleStr], emoji || null, groupName, position);
      } catch (error) {
        console.error('[panel.addbutton] DB error:', error);
        await interaction.reply({ content: 'Failed to add button (maybe duplicate).', ephemeral: true });
        return;
      }

      // Refresh the panel message right away so admins see the update.
      const channel = await interaction.guild.channels.fetch(panel.channel_id);
      const message = await channel.messages.fetch(panel.message_id);
      const payload = buildPanelMessage(panelId);
      await message.edit(payload);

      await interaction.reply({ content: `Button added for role: **${role.name}** (group: ${groupName})`, ephemeral: true });
      return;
    }

    if (sub === 'removebutton') {
      const panelId = interaction.options.getInteger('panel_id', true);
      const role = interaction.options.getRole('role', true);

      const panel = db.prepare('SELECT * FROM role_panels WHERE id = ? AND guild_id = ?').get(panelId, guildId);
      if (!panel) {
        await interaction.reply({ content: 'Panel not found for this guild.', ephemeral: true });
        return;
      }

      const customId = `rolebtn:${guildId}:${panelId}:${role.id}`;
      const result = db.prepare('DELETE FROM role_panel_buttons WHERE custom_id = ?').run(customId);

      if (!result.changes) {
        await interaction.reply({ content: 'Button not found for that role in this panel.', ephemeral: true });
        return;
      }

      const channel = await interaction.guild.channels.fetch(panel.channel_id);
      const message = await channel.messages.fetch(panel.message_id);
      const payload = buildPanelMessage(panelId);
      await message.edit(payload);

      await interaction.reply({ content: `Button removed for role: **${role.name}**`, ephemeral: true });
      return;
    }

    if (sub === 'refresh') {
      const panelId = interaction.options.getInteger('panel_id', true);
      const panel = db.prepare('SELECT * FROM role_panels WHERE id = ? AND guild_id = ?').get(panelId, guildId);

      if (!panel) {
        await interaction.reply({ content: 'Panel not found for this guild.', ephemeral: true });
        return;
      }

      const channel = await interaction.guild.channels.fetch(panel.channel_id);
      const message = await channel.messages.fetch(panel.message_id);
      const payload = buildPanelMessage(panelId);
      await message.edit(payload);

      await interaction.reply({ content: 'Panel refreshed.', ephemeral: true });
    }
  },
};
