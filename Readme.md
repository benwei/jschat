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

 { "cmd": "register", "data": "mclient v0.1", "sender": "your chat name"}

## Who
  type "/who"
 { "cmd": "who", args: "" };

## Send Text Message

 { "data": "your message", "sender": "your chat name"}

## close all client

   while you type CTRL+C on server, it will disconnect all client.

