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
        f(socket);
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
    return randomInt(0, 1)? true : false;
}

var lastUpdate = Date.now();
function updateState() {
    var thisUpdate = Date.now();
    var elapsed = thisUpdate - lastUpdate;
    lastUpdate = thisUpdate;

    forAllClients(function(socket) {
        socket.myClientInfo.x += socket.myClientInfo.dx * elapsed / 1000.0;
        socket.myClientInfo.y += socket.myClientInfo.dy * elapsed / 1000.0;
    });
    var allClientInfo = getAllClients();
    forAllClients(function(socket) {
        socket.emit('allclients', allClientInfo);
    });
}

setInterval(updateState, 100);

io.on('connection',function(socket){

    socket.on('newclient',function(){
        socket.myClientInfo = {
            id: server.lastClientID++,
            x: randomInt(100,400),
            y: randomInt(100,400),
            dx: 0,
            dy: 0,
            isHunter: randomBool()
        };
        socket.emit('allclients', getAllClients());
        socket.broadcast.emit('newclient',socket.myClientInfo);

        socket.on('velocity', function(data){
            console.log('client ' + data.id + ' vel ' + data.dx +', ' + data.dy);
            socket.myClientInfo.dx = data.dx;
            socket.myClientInfo.dy = data.dy;
            io.emit('client', socket.myClientInfo);
        });

        socket.on('disconnect',function(){
            io.emit('disconnect', socket.myClientInfo.id);
        });
    });
});
