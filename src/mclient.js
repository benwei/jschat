// reference from https://github.com/einaros/ws
var WebSocket = require('ws');
var ws = new WebSocket('ws://localhost:8009/path');

var stdin = process.openStdin();

var messages = [];

var sender = 'guest';
if (process.argv.length > 2)
    sender = process.argv[2];

var banner= '{ "cmd": "register", "data": "mclient v0.1", "sender": "' + sender + '"}';

ws.on('open', function() {
    ws.send(banner);
    setInterval(function () {
        if (messages.length > 0) {
            for (var i = 0; i < messages.length ; i++)
                ws.send(messages[i])
            messages = [];
        }
    }, 100);
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
    //ws.teminate();
});

stdin.on('data', function(chunk) {
    //console.log("Got chunk: " + chunk); }
    var data = chunk.slice(0, chunk.length - 1);
    if (data.length > 0) {
        messages.push(data);
    }
});
