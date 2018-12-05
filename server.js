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
        if (!clientInfo.isPlayer) return;
        var now = Date.now();

        if (clientInfo.moveEnableTime >= now) return;
        var newx = clientInfo.x + clientInfo.dx * elapsed * clientInfo.speed / 10.0;
        var newy = clientInfo.y + clientInfo.dy * elapsed * clientInfo.speed / 10.0;
        forAllClients(function(socket2) {
            if (socket2 == socket) return;

            var clientInfo2 = socket2.myClientInfo;
            if (!clientInfo2.isPlayer) return;

            var distx = newx - clientInfo2.x;
            var disty = newy - clientInfo2.y;
            var dist = Math.sqrt(distx * distx + disty * disty);
            if (dist < 24) {
                newx = clientInfo.x;
                newy = clientInfo.y;

                if (clientInfo.catchEnableTime < now && clientInfo2.catchEnableTime < now) {
                    if (clientInfo.role === "hunter") {
                        if (clientInfo2.role === "prey") {
                            clientInfo2.moveEnableTime = now + 2000;
                            clientInfo.catchEnableTime = now + 2000;
                            clientInfo.role = "prey";
                            clientInfo.speed = 1.0;
                            clientInfo2.role = "hunter";
                            clientInfo2.speed = 0.8;
                        }
                    }
                }
            }
        });
        clientInfo.x = newx;
        clientInfo.y = newy;
    });
    var allClientInfo = getAllClients();
    //console.log("update to all");
    forAllClients(function(socket) {
        if(socket.myClientInfo.needsUpdates) {
            socket.emit('update', allClientInfo);
        }
    });
    //io.emit('update', allClientInfo);
}

setInterval(updateState, 100);

io.on('connection',function(socket){

    socket.on('newclient',function(data){
        var role = data.isPlayer? randomBool()? "hunter" : "prey" : "";
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
            moveEnableTime: Date.now(),
            catchEnableTime: Date.now(),
        };
        console.log("new client: " + JSON.stringify(socket.myClientInfo));
        //console.log("newclient from " + socket.myClientInfo.id);
        //console.log("ident and newclient to " + socket.myClientInfo.id);
        socket.emit('ident', socket.myClientInfo);
        socket.emit('newclient', getAllClients());
        //console.log("newclient to all except " + socket.myClientInfo.id);
        forAllClients(function(socket2) {
            if (socket2 != socket && socket2.myClientInfo.needsUpdates) {
                socket2.emit('newclient', [socket.myClientInfo]);
            }
        });

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
