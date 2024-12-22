/**********************************************************************

Copyright (c) 2018 - 2024 Ben Wei <ben@juluos.org>

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

const e = require('express');
const { json } = require('express');
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
            var blob;
            var mdata = args.shift();
            var mcmd = cmd.replace('/', '')
            if (mcmd == 'register') {
                blob = {cmd: mcmd , data: args[2], sender: args[1]};
            } else {
                blob = {cmd: mcmd, data: mdata};
            }
            json_data = JSON.stringify(blob);
            ws.send(json_data);
        } catch (e) {
            console.log(json.stringify(e));
        }
    }

    this.send = function (data) {
        try {
            var cmd = undefined;
            var str = data.toString();
            var args= [];
            if (data[0] == '/') { 
                var parts = str.split(' ');
                if (parts.length > 1) {
                    cmd = parts[0];
                    args = parts;
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

    function padingNN(num) {
            return num.toString().padStart(2, "0");
    }
    function tsToDateString(msTimestamp) {
        const splitter = '-';
        const date = new Date(msTimestamp);
        var dstr = [ date.getFullYear(),
                padingNN(date.getMonth() + 1),
                padingNN(date.getDate()),
              ].join(splitter) ;
        dstr += " " + [ padingNN(date.getHours()),
                padingNN(date.getMinutes()),
                padingNN(date.getSeconds()),
              ].join(":");
        return dstr;
    }

    ws.on('message', function(data, flags) {
        var obj = null;
        var sender = null;
        var blob = null;
        var ts = null;
        // flags.binary will be set if a binary data is received
        // flags.masked will be set if the data was masked
        try {
            obj = JSON.parse(data);
            sender = obj.sender;
            blob = obj.data;
            ts = obj.ts;
            // [D] console.log("dump:", obj);
        } catch (e) {
            // eat it. treat as text message only
        };
        const decoder = new TextDecoder("UTF-8");

        if (sender) {
            var strts = ts.toString()
            var msts = parseInt(ts.toString(), 10);
            var line = '>> ';
            // [D] + " ts(" + strts + "): ";
            const date_str = tsToDateString(msts);
            if (blob.type == 'Buffer')
            line += decoder.decode(Buffer.from(blob.data));
            else if( blob.type == 'String'){
                line += blob.data;
            } 
            console.log(sender + ' ' + date_str + line);
        } else {
            json_str = JSON.stringify(data);
            
            var objs = JSON.parse(json_str)
            var obj1= decoder.decode(Buffer.from(objs.data))
            console.log("?> " + obj1);
            if (typeof obj1 == 'string') {
		var obj1_is_json = false;
                const xdata = new TextEncoder().encode(obj1)
                try {
               		var xobj = JSON.parse(obj1);
                	console.log("j> " +  xobj['data'], xobj['ts']);
			obj1_is_json = true;
                } catch(e) {
                    // pass;
                }
                console.log("buffer --->" + data);

                function hex_num(n) {
                    const asciis = '0123456789ABCDEF'
                    return asciis[n];
                }
                
		function bos_xxd_builtin(adata) {
			hex_line = '';
			asc_line = '';
			var hex_lines = [];
			var remain = adata.length % 16;
			if (remain > 0) padding_zeros = 16 - remain;

			for (var i = 0; i < adata.length + padding_zeros; i+=1) {
			    element = 0;
			    if (i < adata.length) {
				element = adata[i];
				hex_line += hex_num(element>>4) + hex_num(element%16);
				asc_line += String.fromCharCode(element);
			    } else {
				hex_line += "  ";
				asc_line += " ";
			    }

			    if ((i % 2) == 1) hex_line += ' ';
			    if (((i+1) % 16) == 0) {
			       hex_lines.push(hex_line + '  ' + asc_line);
			       hex_line = '';
			       asc_line = '';
			    }
			}
			if (hex_line.length>0) {
			    hex_lines.push(hex_line + '  ' + asc_line);
			}
			return hex_lines;
		}
		if (obj1_is_json == false) {
		const xhex_lines = bos_xxd_builtin(xdata)
                console.log("hexdump: \n" + xhex_lines.join('\n') + 
                  '\n');
		}
            }
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
