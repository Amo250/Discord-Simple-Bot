# Discord Role Bot

A Discord bot for role management (auto-roles, panels, buttons) built with **discord.js**, **slash commands**, and **SQLite**.

This README covers **command-line / shell deployment only**.  
Plesk is **not** covered.

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

## Install Dependencies

From the project root:

```bash
npm install --omit=dev
```

This will generate `node_modules/` and `package-lock.json`.

---

## Load Environment Variables (Important)

For **every new shell session**:

```bash
set -a
source shared/.env
set +a
```

Verify without exposing secrets:
```bash
node -e "const t=process.env.DISCORD_TOKEN||''; console.log('token_len', t.length, 'has_space', /\s/.test(t));"
```

Expected:
```text
token_len > 50
has_space false
```

---

## Register Slash Commands

Run once at first deploy and whenever commands change:

```bash
npm run register
```

Expected:
```text
[register] Slash commands registered
```

---

## Run the Bot with PM2 (Local Install)

### Install PM2 locally
```bash
npm install pm2 --save-prod
```

### Start the bot
```bash
npx pm2 start src/index.js --name discord-role-bot --time
npx pm2 save
```

### Status and logs
```bash
npx pm2 status
npx pm2 logs discord-role-bot
```

---

## Restarting the Bot

If `.env` changed:
```bash
npx pm2 restart discord-role-bot --update-env
```

Otherwise:
```bash
npx pm2 restart discord-role-bot
```

---

## Invite the Bot to a Server (Required)

The bot **never joins a server automatically**.

Minimal invite URL:
```text
https://discord.com/api/oauth2/authorize?client_id=DISCORD_CLIENT_ID&scope=bot%20applications.commands&permissions=268435456
```

- `applications.commands` → slash commands
- `Manage Roles` permission required for role assignment

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

## Final Checklist

- [ ] Bot invited to the server
- [ ] `.env` clean (no whitespace)
- [ ] `npm run register` successful
- [ ] `pm2 status` → online
- [ ] Bot visible and online on Discord
- [ ] Slash commands visible (`/panel`, etc.)

---

## License
MIT
