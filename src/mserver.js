
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

var WSC_PERM_ADMIN = 0,
WSC_PERM_USER = 1,
WSC_PERM_GUEST = 2;

var WSC_STAT_CONNECTED = 1,
WSC_STAT_TERMINATE = 2;


function cmd_register(user, obj, message) {
    try {
        user.sender= obj['sender'];
    } catch (e) {};

    if (user.sender)
        console.log('r%d(%s): %s', user.id, user.sender, message);
    else
        console.log('r%d: %s', user.id, message);
    return 0;
}

function cmd_who (user, obj, message) {
    for (var i = 0;  i < clients.length; i++) {
        var c = clients[i];
        var msg = '';
            msg += (c == user) ? '* ' : '  ';

        msg += c.id + ":";

        if (c.hasOwnProperty('sender')) {
            msg += c.sender;
        } else {
            msg += 'guest';
        }

        try {
            user.ws.send(msg);
        } catch (e) {
            console.log("error: "  + e);
        }
    }
    return 0;
}

var user_commander = {
    who: cmd_who,
    register: cmd_register };


    wss.on('connection', function(ws) {
        num++;
        clients.push({ws: ws, id:num,
            msgcount: 0,
            perm: WSC_PERM_GUEST,
            state: WSC_STAT_CONNECTED
        });

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

            var user = findCurrentSender(ws);
            if (user) {
                var pf = user_commander[cmd];
                if (pf) {
                    var ret = pf(user, obj, message);
                    // no broadcast if ret is zero
                    if (ret == 0) return;
                } else if (cmd) {
                    user.ws.send("unsupported cmd: " + cmd);
                    return;
                }
            }

            if (user.state == WSC_STAT_TERMINATE) {
                user.ws.close(3000, 'admin stop');
                return;
            }

            user.msgcount++;
            for (var i=0; i < clients.length ; i++) {
                var c = clients[i];
                var blob;
                if (user.hasOwnProperty('sender')) {
                    blob = {sender: user.sender, data: message};
                } else if (sender) {
                    blob = {sender: sender, data: message};
                } else {
                    blob = {sender: 'guest', data: message};
                }
                c.ws.send(JSON.stringify(blob));
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
