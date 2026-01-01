# Discord Role Bot (Node.js / discord.js v14)

Features:
- Auto role assignment when a user joins the server
- Role panels with **buttons** (toggle add/remove) so users can cumulate roles
- Fully configurable **inside Discord** via slash commands
- Persistent storage using SQLite (`bot.sqlite`)

## Requirements
- Node.js 18+
- A Discord bot application with a token
- Bot permissions:
  - Manage Roles
  - Send Messages
  - Read Messages / View Channels
  - Use Application Commands
  - Read Message History (recommended)

Important:
- The bot's highest role must be **above** any role it needs to assign/remove.

## Setup
```bash
npm install
cp .env.example .env
# Fill DISCORD_TOKEN and DISCORD_CLIENT_ID in .env
```

## Run
```bash
npm run start
```

## Commands

### Auto role
- `/autorole set role:@Member`
- `/autorole clear`

### Panels (grouped buttons)
Create a panel in a channel:
- `/panel create channel:#roles title:"Pick your roles" description:"Click to toggle roles"`

Add buttons (with a group label):
- `/panel addbutton panel_id:1 role:@News label:"News" style:primary group:"Announcements" emoji:📰`
- `/panel addbutton panel_id:1 role:@Dev label:"Dev" style:success group:"Tech" emoji:💻`

Refresh a panel from DB:
- `/panel refresh panel_id:1`

List panels:
- `/panel list`

Remove a button from a panel:
- `/panel removebutton panel_id:1 role:@Dev`

Delete a panel (db + best-effort message delete):
- `/panel delete panel_id:1`

## Notes
- Discord limits: max **25 buttons** per message (5 rows × 5 buttons).
- Groups are rendered as separate button rows (and described in the embed).
