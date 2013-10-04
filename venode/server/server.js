var HttpPort = 8000;
var V4PortReceive = 5000;
var V4PortSend = 5001;
var V4Ip = process.argv[2];
var ServerFolder = './ServerRoot';
var static = require('node-static');
var dgram = require('dgram');
var http = require('http');
var clients = {};
var clientFiles = new static.Server(ServerFolder);

var httpServer = http.createServer(function(request, response) 
{
	clientFiles.serve(request, response);
});

process.argv.forEach(function (val, index, array) 
{
	console.log(index + ': ' + val);
});

io = require('socket.io').listen(httpServer);
io.set('log level', 1);
httpServer.listen(HttpPort);
serverUdp = dgram.createSocket("udp4");

function UdpSend(message,Host,port)
{
	var client = dgram.createSocket("udp4");
	var buff = new Buffer(message);
	client.send(buff, 0, buff.length, port, Host, function(err, bytes) 
	{
		client.close();
	});
}

io.sockets.on('connection', function (socket) 
{
	//console.log("new connection: " +socket.id);
    if(!clients[socket.id])
	{
		clients[socket.id] = socket; 
		
		var NewId = "NewCLient||"+  socket.id;
		UdpSend(NewId,V4Ip,V4PortReceive)
	}	
	
	socket.on('message', function (msg) 
	{ 
	  
		var message = "update|"+ msg +"|"+ socket.id;
		UdpSend(message,V4Ip,V4PortReceive)
		
	});
 
	serverUdp.on("message", function (msg, rinfo) 
	{
		var jmsg = JSON.parse(msg.toString('ascii', 0, rinfo.size));

		if (jmsg.id=="broadcast") 
		{
			socket.emit("vvvv",jmsg);
		} 
		else if(clients[jmsg.id])
		{
			clients[jmsg.id].emit("vvvv",jmsg);
			//{"type":"update","vtype":"slider","name":"slider1","value":"6","id":"broadcast"}
		}
	});
    
	socket.on('disconnect', function ()
	{ 
		var address = socket.handshake.address;
		var DiscoId = "ClientDisconected||" + socket.id;
		UdpSend(DiscoId,V4Ip,V4PortReceive) 
		
		delete clients[socket.id];
		serverUdp.removeAllListeners("message");
    });
});

serverUdp.bind(V4PortSend);
