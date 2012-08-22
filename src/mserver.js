
var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

var server_port = 8009;

var server = http.createServer(app);
server.listen(server_port);

var wss = new WebSocketServer({server: server});

Array.prototype.remove= function(){
    var what, a= arguments, L= a.length, ax;
    while(L && this.length){
        what= a[--L];
        while((ax= this.indexOf(what))!= -1){
            this.splice(ax, 1);
        }
    }
    return this;
}

var clients = [];
var num = 0;

function findCurrentSender(ws) {
    for (var i=0; i < clients.length ; i++) {
        var c = clients[i];
        if (c.ws == ws) {
            return c;
        }
    }
    return null;
}

wss.on('connection', function(ws) {
    num++;
    clients.push({ws: ws, id:num});

    ws.on('message', function(data) {
        var mws = ws;
        var obj = null;
        var cmd = null;
        var message = null;
        var sender = null;
        try {
            obj = JSON.parse(data);
            if (obj.hasOwnProperty('data')){
                message = obj['data'];
            }
            if (obj.hasOwnProperty('sender')){
                sender = obj['sender'];
            }
            if (obj.hasOwnProperty('cmd')){
                cmd = obj['cmd'];
            }
            console.log(data);
        } catch (e) {};

        if (!message)
            message = data;

        var cur = findCurrentSender(ws);
        if (cur) {
                if (cmd == 'register') {
                    try {
                        cur.sender= obj['sender'];
                    } catch (e) {};
                    if (cur.sender)
                        console.log('r%d(%s): %s', cur.id, cur.sender, message);
                    else
                        console.log('r%d: %s', cur.id, message);
                }
        }


        for (var i=0; i < clients.length ; i++) {
            var c = clients[i];
            if (c.ws != mws) {
                var blob;
                if (cur.hasOwnProperty('sender')) {
                    blob = {sender: cur.sender, data: message};
                } else if (sender) {
                    blob = {sender: sender, data: message};
                } else {
                    blob = {sender: 'guest', data: message};
                }
                c.ws.send(JSON.stringify(blob));
            }
        }
    });

    ws.on('close', function () {
        var t = null;
        var mws = ws;
        for (var i=0; i < clients.length ; i++) {
            var c = clients[i];
            if (c.ws == mws) {
                t = c;
                clients.remove(t);
                break;
            }
        }
        if (t) {
            console.log('r%d: exit', t.id);
        }
    });

    ws.send('Connected to chat server');
    console.log("conn num: " + clients.length);
});

console.log("jschat server listen on " +  server_port + "...");
