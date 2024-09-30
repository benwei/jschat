# Brief

This is a prototype for chat server written by nodejs in server side, nodejs client and webclient (jquery, css, html). clients and server are communicating with websocket channel.

# Feature

* support message cache on server side
* support web client to send message as broadcast to all user
* tested with chrome, firefox, saffari latest versions
* support command line client (nodejs) to send message
* support Enter Key to send message directly, shift + CTRL for new line
* let others can connect Chat Board

# Get started
## install

```
  cd src

  npm install
```

## run server

```
  node src/mserver.js [port]
```

## run client

```
  node src/mclient.js [nickname] [host:port]
```

## snapshots

![chat on 3 browers](https://raw.githubusercontent.com/benwei/jschat/master/docs/images/jschat_chrome_firefox_safari.png)
![chat server console](https://raw.githubusercontent.com/benwei/jschat/master/docs/images/jschat_server_debug_console.png)
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

## Appendix
* [License file](License)
