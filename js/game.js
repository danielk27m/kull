
var Game = {};

Game.init = function(){
    game.stage.disableVisibilityChange = true;
};

Game.preload = function() {
    game.load.tilemap('map', 'assets/map/map1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.spritesheet('tileset', 'assets/map/tilesheet.png', 32, 32);
    game.load.spritesheet('hair', 'assets/sprites/hair.png', 64, 64);
    game.load.spritesheet('hunter', 'assets/sprites/hunter.png', 64, 64);
    game.load.spritesheet('prey', 'assets/sprites/prey.png', 64, 64);
};

Game.create = function(){
    Game.clientMap = {};

    var map = game.add.tilemap('map');
    map.addTilesetImage('tilesheet', 'tileset'); // tilesheet is the key of the tileset in map's JSON file
    var layer;
    for(var i = 0; i < map.layers.length; i++) {
        layer = map.createLayer(i);
    }
    layer.inputEnabled = true; // Allows clicking on the map ; it's enough to do it on the last layer
    layer.events.onInputUp.add(Game.getCoordinates, this);
    Client.sendNewClient({ type: "full" });
};

Game.getCoordinates = function(layer, pointer){
    Client.sendClick(pointer.worldX, pointer.worldY);
};

Game.onNewClient = function(list){
    list.forEach(function(clientInfo) {
        Game.clientMap[clientInfo.id] = {
            info: clientInfo,
            sprite: game.add.sprite(clientInfo.x, clientInfo.y, 'hunter'),
        };
    });
};

Game.onUpdate = function(list) {
    list.forEach(function(clientInfo) {
        var client = Game.clientMap[clientInfo.id];
        client.info = clientInfo;
        var tween = game.add.tween(client.sprite);
        tween.to({ x: clientInfo.x, y: clientInfo.y }, 100);
        tween.start();
    });
};

Game.disconnect = function(id){
    Game.clientMap[id].sprite.destroy();
    delete Game.clientMap[id];
};
