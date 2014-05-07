# Brief

This is a prototype for chat server written by nodejs in server side, nodejs client and webclient (jquery, css, html). clients and server are communicating with websocket channel.

# Feature

* support message cache on server side
* support web client to send message as broadcast to all user
* tested with chrome, firefox, saffari latest versions
* support command line client (nodejs) to send message

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

## License ##

(The MIT License)

Copyright (c) 2012 Ben Wei &lt;ben@storos.mobi&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
