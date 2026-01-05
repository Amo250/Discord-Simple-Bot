# Commands Reference

Only members with the **Manage Roles** permission can use these commands.

---

## 🔁 Auto Roles

Auto roles are roles automatically assigned when a new member joins the server.

### `/autorole add`

Add a role to the auto-role list.

```
/autorole add role:@Role
```

**Parameters**
- `role` *(required)*  
  The role to assign automatically on member join.

**Notes**
- Applied only to future members
- Existing members are not modified
- The bot role must be higher than the target role

---

### `/autorole remove`

Remove a role from the auto-role list.

```
/autorole remove role:@Role
```

**Parameters**
- `role` *(required)*  
  The role to stop assigning automatically.

**Notes**
- Does not remove the role from existing members
- Safe operation (no mass changes)

---

### `/autorole list`

List all auto roles configured for the server.

```
/autorole list
```

**Output**
- Role name
- Role ID

**Notes**
- Roles deleted from Discord are ignored
- Only existing roles are displayed

---

## 🎛️ Panels

Panels allow users to **self-assign roles** using buttons.

A panel is:
- a bot message
- posted in a channel
- containing role buttons

---

### `/panel create`

Create a new role panel.

```
/panel create channel:#channel title:"Title" description:"Optional description"
```

**Parameters**
- `channel` *(required)*  
  Target channel where the panel message will be posted
- `title` *(required)*  
  Panel title (displayed in the embed)
- `description` *(optional)*  
  Panel description text

**Behavior**
- Creates a panel entry in the database
- Sends a message in the target channel
- Returns a **Panel ID**

---

### `/panel addbutton`

Add a role button to an existing panel.

```
/panel addbutton panel_id:1 role:@Role label:"Label" style:primary
```

**Required parameters**
- `panel_id`  
  ID of the panel
- `role`  
  Role to toggle
- `label`  
  Button label
- `style`  
  Button style (`primary`, `secondary`, `success`, `danger`)

**Optional parameters**
- `group`  
  Group name for visual grouping (default: `General`)
- `position`  
  Order inside the group (lower = first)
- `emoji`  
  Emoji displayed on the button (e.g. 🔔)

**Notes**
- Maximum 25 buttons per panel
- Maximum 5 buttons per row
- Clicking the button toggles the role

---

### `/panel removebutton`

Remove a role button from a panel.

```
/panel removebutton panel_id:1 role:@Role
```

**Parameters**
- `panel_id` *(required)*  
- `role` *(required)*  

**Behavior**
- Removes the button configuration
- Does not remove roles from users

---

### `/panel refresh`

Rebuild and update a panel message from the database.

```
/panel refresh panel_id:1
```

**Use cases**
- Panel message looks outdated
- Manual edits were reverted
- Discord UI did not refresh correctly

---

### `/panel list`

List all panels in the server.

```
/panel list
```

**Output includes**
- Panel ID
- Title
- Channel
- Message ID

---

### `/panel delete`

Delete a panel.

```
/panel delete panel_id:1
```

**Behavior**
- Removes the panel from the database
- Attempts to delete the panel message
- If message deletion fails, configuration is still removed

---

## 👥 User Interaction (No Commands)

- Users click a button
- Role is added if missing
- Role is removed if already present
- No permissions required for users

---

## 🔐 Permissions Summary

| Feature | Required |
|------|--------|
| Auto roles | Manage Roles |
| Panels | Manage Roles |
| Button clicks | None |
