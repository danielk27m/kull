var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.lastClientID = 0;

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

function forAllClients(f) {
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var socket = io.sockets.connected[socketID];
        if(socket.myClientInfo) f(socket);
    });
}

function getAllClients(){
    var clients = [];
    forAllClients(function(socket) {
        var clientInfo = socket.myClientInfo;
        if(clientInfo) clients.push(clientInfo);
    });
    return clients;
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function randomBool() {
    return randomInt(0, 2)? true : false;
}

var lastUpdate = Date.now();
function updateState() {
    var thisUpdate = Date.now();
    var elapsed = thisUpdate - lastUpdate;
    lastUpdate = thisUpdate;

    forAllClients(function(socket) {
        var clientInfo = socket.myClientInfo;
        clientInfo.x += clientInfo.dx * elapsed * clientInfo.speed / 10.0;
        clientInfo.y += clientInfo.dy * elapsed * clientInfo.speed / 10.0;
    });
    var allClientInfo = getAllClients();
    //console.log("update to all");
    forAllClients(function(socket) {
        socket.emit('update', allClientInfo);
    });
    //io.emit('update', allClientInfo);
}

setInterval(updateState, 100);

io.on('connection',function(socket){

    socket.on('newclient',function(data){
        var role = randomBool()? "hunter" : "prey";
        socket.myClientInfo = {
            id: server.lastClientID++,
            type: data.type,
            x: randomInt(100,400),
            y: randomInt(100,400),
            dx: 0,
            dy: 0,
            role: role,
            speed: role == "hunter"? 0.8 : 1,
            isPlayer: data.isPlayer || false,
            needsUpdates: data.needsUpdates || false,
        };
        console.log("new client: " + JSON.stringify(socket.myClientInfo));
        //console.log("newclient from " + socket.myClientInfo.id);
        //console.log("ident and newclient to " + socket.myClientInfo.id);
        socket.emit('ident', socket.myClientInfo);
        socket.emit('newclient', getAllClients());
        //console.log("newclient to all except " + socket.myClientInfo.id);
        socket.broadcast.emit('newclient', [socket.myClientInfo]);

        socket.on('velocity', function(data){
            //console.log("velocity from " + socket.myClientInfo.id);
//            console.log('client ' + data.id + ' vel ' + data.dx +', ' + data.dy);
            socket.myClientInfo.dx = data.dx;
            socket.myClientInfo.dy = data.dy;
            //console.log("update to all");
            //io.emit('update', socket.myClientInfo);
        });

        socket.on('disconnect',function(){
            console.log("disconnect from " + socket.myClientInfo.id);
            //console.log("remove to all");
            forAllClients(function(socket2) {
                socket2.emit('remove', socket.myClientInfo.id);
            });
            //io.emit('remove', socket.myClientInfo.id);
        });
    });
});
