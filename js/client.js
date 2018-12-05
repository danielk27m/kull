
var Client = {};
Client.socket = io.connect();

Client.sendNewClient = function(data){
    Client.socket.emit('newclient', data);
};

Client.sendVelocity = function(data){
    Client.socket.emit('velocity', data);
};

Client.socket.on('ident',function(clientInfo){
    Game.onIdent(clientInfo);
});

Client.socket.on('newclient',function(list){
    Game.onNewClient(list);
});

Client.socket.on('update',function(list){
    Game.onUpdate(list);
});

Client.socket.on('remove',function(id){
    Game.onRemove(id);
});
