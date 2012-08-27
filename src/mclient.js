// reference from https://github.com/einaros/ws
var WebSocket = require('ws');
// var ws = new WebSocket('ws://192.168.1.185:8009');

var stdin = process.openStdin();

var sender = 'guest';
var host = 'localhost';

function ChatClient(wsurl) {
    var self = this;
    var ws = new WebSocket(wsurl, {protocolVersion: 8});
    console.log("connecting to " + wsurl);

    var banner= { cmd: "register", data: "mclient v0.1", sender: sender };

    ws.on('open', function() {
        ws.send(JSON.stringify(banner));

    });

    this.cmdfunc = function (cmd, args) {
        try {
            var blob = JSON.stringify({cmd: cmd, data: args});
//            console.log(blob);
            ws.send(blob);
        } catch (e) {
            console.log(e);
        }
    }

    this.send = function (data) {
        try {
            if (data[0] == 47) {
                var str = data.toString();
                var i = str.indexOf(' ');
                var cmd;
                var args= '';
                if (i > 1) {
                    cmd = str.substring(1, i);
                    args = str.slice(i+1);
                } else if (str.length > 3) {
                    cmd = str.substring(1, str.length);
                }
                if (cmd)
                    self.cmdfunc(cmd, args);
            } else {
                ws.send(data)
            }
        } catch (e) {
            console.log("send error:" + e);
        }
    }

    ws.on('close', function(code, data) {
        console.log("disconnected." + code + ":" + data);
        ws.terminate();
        process.exit(0);
    });

    ws.on('message', function(data, flags) {
        var obj = null;
        var sender = null;
        var message = null;
        // flags.binary will be set if a binary data is received
        // flags.masked will be set if the data was masked
        try {
            obj = JSON.parse(data);
            sender = obj['sender'];
            message = obj['data'];
        } catch (e) { };

        if (sender) {
            console.log(sender + "> " + message);
        } else {
            console.log("> " + data);
        }
    });
};

if (process.argv.length > 2)
    sender = process.argv[2];

if (process.argv.length > 3)
    host = process.argv[3];


var url = 'ws://' + host
if (host.indexOf(':') < 0)
 url += ':8009';

var wsclient = new ChatClient(url);

stdin.on('data', function(chunk) {
    //console.log("Got chunk: " + chunk); }
    var data = chunk.slice(0, chunk.length - 1);
    if (data.length > 0) {
        wsclient.send(data);
    }
});
