# Brief
  This is a prototype for chat server written by nodejs.

# Get started
  node src/mserver.js
  node src/mclient.js

# support commands by server

Commands json syntax:
 Register:
 { "cmd": "register", "data": "mclient v0.1", "sender": "your chat name"}

Send Message:
 { "data": "your message", "sender": "your chat name"}
