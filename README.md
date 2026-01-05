# Discord Role Bot

A simple and safe Discord bot to automatically assign roles to new members and let users self-assign roles via interactive panels.

*This is my first Discord bot project, and I am using AI to assist me with the development.*

---

## ✨ Features

- Multiple auto roles on member join
- Self-assignable role panels (buttons)
- Slash commands only (no legacy commands)
- Per-server configuration
- SQLite storage
- Secure by default

---

## 🚀 Quick Start

1. Create a Discord application and bot
2. Clone the repository
3. Configure the `.env` file
4. Install dependencies
5. Register slash commands
6. Start the bot

👉 Full technical documentation is available in the **`/docs`** folder.

---

## 🤖 Commands Overview

### Auto roles
Automatically assign roles when a member joins the server.

- `/autorole add role:@Role`
- `/autorole remove role:@Role`
- `/autorole list`

### Panels
Create interactive role panels with buttons.

- `/panel create`
- `/panel addbutton`
- `/panel removebutton`
- `/panel refresh`
- `/panel list`
- `/panel delete`

👉 See the complete command reference in **`docs/COMMANDS.md`**

---

## 🔐 Permissions & Security

- Commands require **Manage Roles**
- Bot role must be **higher than managed roles**
- Users do not need permissions to click panel buttons
- No personal data is stored

---

## 🧪 Contributing & Testing

This project is currently in an **early testing phase**.

Bug reports and feedback are highly appreciated.

---

## 📚 Documentation

All detailed documentation is available in the **`/docs`** folder:

- `COMMANDS.md` — full command reference
- `DEPLOYMENT.md` — installation & run
- `DATABASE.md` — SQLite schema
- `SECURITY.md` — permissions & best practices
- `ARCHITECTURE.md` — functional flows
- `TROUBLESHOOTING.md` — common issues

---

## 📄 License

This project is licensed under the **MIT License**.
