# Discord Role Bot

A Discord bot for role management (auto-roles, panels, buttons) built with **discord.js**, **slash commands**, and **SQLite**.

This README covers **command-line / shell deployment only**.

---

## Table of Contents

- [Requirements](#requirements)
- [Recommended Project Structure](#recommended-project-structure)
- [Discord Setup (Required)](#discord-setup-required)
- [Environment Configuration](#environment-configuration)
- [SQLite Database Initialization](#sqlite-database-initialization)
- [Database Schema](#database-schema)
- [Install Dependencies](#install-dependencies)
- [Load Environment Variables (Important)](#load-environment-variables-important)
- [Register Slash Commands](#register-slash-commands)
- [Run the Bot with PM2](#run-the-bot-with-pm2-local-install)
- [Restarting the Bot](#restarting-the-bot)
- [Invite the Bot to a Server](#invite-the-bot-to-a-server-required)
- [Auto Roles](#auto-roles)
- [Security & Permissions](#security--permissions)
- [Functional Flow](#functional-flow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Final Checklist](#final-checklist)
- [License](#license)

---

## Requirements

### System
- Linux (Ubuntu recommended)
- Non-root user with shell access
- `sudo` only required for installing system packages

### Software
- **Node.js 18+** (Node **20 LTS recommended**)
- **npm**
- **git**
- **sqlite3**
- Build tools (required for `better-sqlite3`):
  ```bash
  sudo apt install -y build-essential python3
  ```

> ⚠️ If you use `nodenv`, **do not install Node/npm via `apt`**.

---

## Recommended Project Structure

```text
bot-discord/
├── src/                # source code
├── node_modules/       # dependencies (generated)
├── package.json
├── package-lock.json
├── shared/
│   ├── .env            # environment variables (not committed)
│   ├── data/
│   │   └── bot.db      # SQLite database
│   └── logs/
```

---

## Discord Setup (Required)

### 1. Create a Discord Application
- https://discord.com/developers/applications
- Create a new application
- Go to **Bot** → create the bot

### 2. Get the required IDs
- **Bot Token** → `DISCORD_TOKEN`
- **Application ID** → `DISCORD_CLIENT_ID`
- **Server ID** (Developer Mode enabled in Discord) → `DISCORD_GUILD_ID`

⚠️ Use the **Bot Token**, not the Client Secret.

---

## Environment Configuration

### Create the `.env` file
```bash
nano shared/.env
```

Minimal content:

```env
NODE_ENV=production

DISCORD_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DISCORD_CLIENT_ID=123456789012345678
DISCORD_GUILD_ID=987654321098765432

DATABASE_PATH=/home/<user>/bot-discord/shared/data/bot.db
LOG_LEVEL=info
```

Secure the file:
```bash
chmod 600 shared/.env
```

---

## SQLite Database Initialization

```bash
mkdir -p shared/data shared/logs
sqlite3 shared/data/bot.db "PRAGMA user_version=1;"
```

---

## Database Schema

The bot uses a lightweight **SQLite** database.

### `guild_autoroles`

Stores the list of roles automatically assigned when a member joins a server.

```sql
CREATE TABLE guild_autoroles (
  guild_id   TEXT NOT NULL,
  role_id    TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (guild_id, role_id)
);
```

---

## Install Dependencies

```bash
npm install --omit=dev
```

---

## Load Environment Variables (Important)

```bash
set -a
source shared/.env
set +a
```

Verification:
```bash
node -e "const t=process.env.DISCORD_TOKEN||''; console.log('token_len', t.length, 'has_space', /\s/.test(t));"
```

---

## Register Slash Commands

```bash
npm run register
```

---

## Run the Bot with PM2 (Local Install)

```bash
npm install pm2 --save-prod
npx pm2 start src/index.js --name discord-role-bot --time
npx pm2 save
```

---

## Restarting the Bot

```bash
npx pm2 restart discord-role-bot --update-env
```

---

## Invite the Bot to a Server (Required)

```text
https://discord.com/api/oauth2/authorize?client_id=DISCORD_CLIENT_ID&scope=bot%20applications.commands&permissions=268435456
```

---

## Auto Roles

The bot supports **multiple auto roles per server**.

Commands:
- `/autorole add role:@Member`
- `/autorole remove role:@Newsletter`
- `/autorole list`
- `/autorole clear`
- `/autorole set role:@Member`

---

## Security & Permissions

### Required Discord Permissions
The bot requires the following permissions:
- **Manage Roles** — assign and remove roles
- **View Channels** — respond to slash commands
- **Send Messages** — send feedback and panel messages

### Role Hierarchy
- The bot’s role **must be higher** than any role it assigns
- The bot **cannot** assign roles above its own role

### Gateway Intents
Minimal recommended intents:
- `Guilds`
- `GuildMembers`

Avoid enabling unnecessary privileged intents to reduce attack surface.

### Secrets Handling
- Never commit `.env` files
- Rotate the bot token immediately if leaked
- Use restrictive file permissions (`chmod 600`)

---

## Functional Flow

### Member Join Flow
1. A new member joins the server
2. Discord emits a `guildMemberAdd` event
3. The bot queries `guild_autoroles`
4. All configured roles are assigned to the member

### Auto Role Management Flow
1. Admin runs `/autorole add/remove`
2. Bot validates permissions
3. Role IDs are stored or removed from SQLite
4. Configuration is immediately effective

### Slash Command Flow
1. User invokes a slash command
2. Discord validates permissions
3. Bot executes the handler
4. Bot responds (ephemeral or public)

---

## Troubleshooting

### `Missing DISCORD_CLIENT_ID or DISCORD_TOKEN`
- `.env` not loaded
- Wrong variable names
- Fix:
  ```bash
  set -a; source shared/.env; set +a
  ```

---

### `Invalid Authorization header`
Most common cause: **whitespace in the token**.

Check:
```bash
node -e "const t=process.env.DISCORD_TOKEN||''; console.log(t.length, /\s/.test(t));"
```

Fix CRLF / invisible characters:
```bash
sed -i 's/\r$//' shared/.env
```

---

### `Used disallowed intents`
The bot requests gateway intents not enabled.

Recommended fix:
- Reduce intents in code to:
  ```js
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers
  ```
- OR enable required intents in the Discord Developer Portal

---

### Bot is running but not visible on Discord
- Bot not invited to the server
- Wrong `DISCORD_GUILD_ID`
- Wrong token (another bot)

Verify token:
```bash
curl -s -H "Authorization: Bot $DISCORD_TOKEN" https://discord.com/api/v10/users/@me
```

---

### Slash commands do not appear
- `npm run register` not executed
- Wrong `DISCORD_GUILD_ID`
- Commands registered globally (propagation delay)

Check guild commands:
```bash
curl -s -H "Authorization: Bot $DISCORD_TOKEN" "https://discord.com/api/v10/applications/$DISCORD_CLIENT_ID/guilds/$DISCORD_GUILD_ID/commands"
```

---

### `better-sqlite3` build fails
- Missing build tools
- Node version too recent

Fix:
```bash
sudo apt install -y build-essential python3
```
or use **Node 20 LTS**.

---

## Contributing

This project is currently in **early testing phase**.

---

## Final Checklist

- [ ] Bot invited
- [ ] Permissions correct
- [ ] `.env` secured
- [ ] Slash commands registered
- [ ] Bot online

---

## License

MIT License
