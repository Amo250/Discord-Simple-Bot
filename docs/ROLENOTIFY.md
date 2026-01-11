# Role Notifications (rolenotify)

You can configure custom messages to be sent when the bot assigns a specific role.

## Template variables
- `{user}`: mention the user
- `{username}`: the user's username
- `{role}`: mention the role
- `{rolename}`: the role name

## Commands
- `/rolenotify add role:@Role channel:#channel message:"Welcome {user}, you now have {role}!"`
- `/rolenotify edit rule:ID [role] [channel] [message]`
- `/rolenotify enable rule:ID` / `/rolenotify disable rule:ID`
- `/rolenotify remove rule:ID`
- `/rolenotify list`
- `/rolenotify test rule:ID user:@User`
