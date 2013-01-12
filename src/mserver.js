
var WebSocketServer = require('ws').Server,
http = require('http'),
nconf= require('nconf'),
util = require('util'),
express = require('express'),
app = express();

nconf.file({file: __dirname + '/config.json'});
var default_port_num = 8009;

var port_num = nconf.get("port");
if (!port_num) {
	port_num = default_port_num;
}

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

function findUserByID(id) {
    for (var i=0; i < clients.length ; i++) {
        var c = clients[i];
        if (c.id == id) {
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

var WSC_CMD_NO_BROADCAST = 0,
WSC_CMD_BROADCAST = 1;

function cmd_register(user, obj, message) {
    try {
        user.sender= obj['sender'];
    } catch (e) {};

    if (user.sender)
        console.log('r%d(%s): %s', user.id, user.sender, message);
    else
        console.log('r%d: %s', user.id, message);
    return WSC_CMD_NO_BROADCAST;
}

function compose_message_blob(sender, message) {
        return JSON.stringify({sender: sender, data: message});
}

function cmd_msg_to(user, obj, message) {
    var target_id = '';
    if (obj.hasOwnProperty('target_id')) {
        target_id = obj['target_id'];
    } else {
        var i = message.indexOf(' ');
        if (i > 0) {
            target_id = message.substring(0, i);
            message = message.slice(i+1);
            console.log('target_id:' + target_id);
            console.log('target_msg:' + message);
        } else {
            var msg = compose_message_blob(user.sender, "syntax: /msg <id> <message string>");
        user.ws.send(msg);
            return WSC_CMD_NO_BROADCAST;
        }
    }

    target = findUserByID(target_id);
    if (target) {
        var msg = compose_message_blob(user.sender, message);
        target.ws.send(msg);
    } else {
        var msg = compose_message_blob(user.sender, "target user not found");
        user.ws.send(msg);
    }
    return WSC_CMD_NO_BROADCAST;
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
    return WSC_CMD_NO_BROADCAST;
}

var user_commander;

var cmd_help = function (user) {
    var helper = '';
    for (var k in user_commander) {
        var desc = user_commander[k][1];
        if (desc)
            helper+= k + ": " + desc + "\n"
    }
    var msg = {sender: 'system', data:helper};
    user.ws.send(JSON.stringify(msg));
    return WSC_CMD_NO_BROADCAST;
}

user_commander = {
msg: [cmd_msg_to, 'send message to specific user'],
who: [cmd_who, 'list who online'],
register: [cmd_register, null], //'register user identity'],
help: [cmd_help, 'command helper']
};




var server_port = port_num;

if (process.argv.length >=3)
server_port = process.argv[2];

function ChatServer () {

    app.use(express.static(__dirname + '/public'));
    app.use(function (req, res, next) {
        console.log(req.url);
        next();
    });

    var server = http.createServer(app);
    server.listen(server_port);

    var wss = new WebSocketServer({server: server});

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
                    var ret = pf[0](user, obj, message);
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

    var self = this;
    self.send = function(data, flags) {
        var sender = 'server'
        try {
            for (var i=0; i < clients.length ; i++) {
                var c = clients[i];
                var blob = {sender: sender, data: message};
                c.ws.send(JSON.stringify(blob));
            }
        } catch(e) {
            console.log("err");
        }
    };

    self.shutdown = false;
    self.closeAll = function(data, flags) {
	self.shutdown = true;
        var sender = 'server'
        try {
            for (var i=0; i < clients.length ; i++) {
                var c = clients[i];
                c.ws.close(3000, "chat v1 info closing...");
            }
        } catch(e) {
            console.log("err");
        }

	setTimeout(function () {
    		console.log('server stopped.');
		process.exit(0);
	}, 1000);
    };

    console.log("jschat server listen on " +  server_port + "...");
};

var chat_server = new ChatServer();

process.on('uncaughtException', function (err) {
    console.log('Server Error Caught exception: ' + err);
});


process.on('SIGINT', function () {
    if (chat_server.shutdown) {
    	console.log('server stopping...');
	return;
    }
    console.log('Got SIGINT. Close all clients.');
    chat_server.closeAll();
});
