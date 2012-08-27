# Brief
  This is a prototype for chat server written by nodejs.

# Get started
## install

  cd src

  npm install

## run server
  
  node src/mserver.js [port]

## run client
  node src/mclient.js [nickname] [host:port] 

# support commands by server

 Commands json syntax:

## Register

 `{ "cmd": "register", "data": "mclient v0.1", "sender": "your chat name"}`

## Who
  type "/who"
 `{ "cmd": "who", args: "" }`

## Send Text Message

 `{ "data": "your message", "sender": "your chat name"}`

 Once your client has registered by Register command, the sender field won't be reference anymore.

## Send Text Message to specific user id
 
 `{ "cmd": "msg", "data": "your message", "target_id": "id number"}`

 if you don't assign target_id, you can compose them in data field.

 ex:
 `{ "cmd": "msg", "data": "2 your meesage"}`

## close all client

  while you type CTRL+C on server, server will disconnect all client.

