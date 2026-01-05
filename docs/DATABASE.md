# Database

The bot uses SQLite.

## Tables

### guild_autoroles
Stores auto roles assigned on member join.

```sql
CREATE TABLE guild_autoroles (
  guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (guild_id, role_id)
);
```
