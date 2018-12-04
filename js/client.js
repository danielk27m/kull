
var Client = {};
Client.socket = io.connect();

Client.sendNewClient = function(){
    Client.socket.emit('newclient');
};

Client.sendVelocity = function(dx, dy){
    Client.socket.emit('velocity', { dx: dx, dy: dy });
};

Client.socket.on('newclient',function(list){
    Game.onNewClient(list);
});

Client.socket.on('update',function(list){
    Game.onUpdate(list);
});

Client.socket.on('disconnect',function(id){
    Game.onDisconnect(id);
});
