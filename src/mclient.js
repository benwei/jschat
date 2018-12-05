/**********************************************************************

Copyright (c) 2018 Ben Wei <ben@juluos.org>

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
*********************************************************************/

var WebSocket = require('ws'),
nconf= require('nconf');

nconf.file({file: __dirname + '/config.json'});

var default_port_num = 8009;
var port_num = nconf.get("port");
if (!port_num) {
	port_num = default_port_num;
}

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

    ws.on('error', function(e) {
        console.log(e);
    });

    this.cmdfunc = function (cmd, args) {
        try {
            var blob = JSON.stringify({cmd: cmd, data: args});
            ws.send(blob);
        } catch (e) {
            console.log(e);
        }
    }

    this.send = function (data) {
        try {
            var cmd = '';
            var str = data.toString();
            if (data[0] == 47) {
                var i = str.indexOf(' ');
                var args= '';
                if (i > 1) {
                    cmd = str.substring(1, i);
                    args = str.slice(i+1);
                } else if (str.length > 3) {
                    cmd = str.substring(1, str.length);
                }
            }

            if (cmd) {
                self.cmdfunc(cmd, args);
            } else {
                ws.send(str);
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
        } catch (e) {
            // eat it. treat as text message only
        };

        if (sender) {
            console.log(sender + "> " + message);
        } else {
            console.log("> " + data);
        }
    });

    this.close = function () {
        ws.close();
    };
};

// main

if (process.argv.length > 2) {
    sender = process.argv[2];
}

if (process.argv.length > 3) {
    host = process.argv[3];
}

var url = 'ws://' + host;
if (host.indexOf(':') < 0) {
    url += ':' + port_num;
}

var wsclient = new ChatClient(url);

stdin.on('data', function(chunk) {
    // console.log("Got chunk: " + chunk); 
    var data = chunk.slice(0, chunk.length - 1);
    if (data.length > 0) {
        if (data == '/quit') {
            wsclient.close();
        } else {
            wsclient.send(data);
        }
    }
});
