
var Game = {};

Game.init = function(){
    Game.clientMap = {};

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
//    var testKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
//    testKey.onDown.add(Client.sendTest, this);

    var map = game.add.tilemap('map');
    map.addTilesetImage('tilesheet', 'tileset'); // tilesheet is the key of the tileset in map's JSON file
    var layer;
    for(var i = 0; i < map.layers.length; i++) {
        layer = map.createLayer(i);
    }
    layer.inputEnabled = true; // Allows clicking on the map ; it's enough to do it on the last layer
//    layer.events.onInputUp.add(Game.getCoordinates, this);
    var type = game.net.getQueryString()["type"] || "player";
    Game.sprites = game.add.group();
    Game.infoText = game.add.text(0, 0, "foo", { fill: "white" });

    Client.sendNewClient({
        type: type,
        isPlayer: type == "player" || type == "pcplayer",
        needsUpdates: type == "spectator" || type == "pcplayer",
    });
};

Game.update = function() {
    Game.sprites.sort("z", Phaser.Group.SORT_ASCENDING);

    if (Game.myId === undefined) {
        return;
    }

    if (game.input.activePointer.isDown) {
        Game.moving = true;
        var data = {};
        var dx = game.input.x - (game.scale.width / 2);
        var dy = game.input.y - (game.scale.height / 2);
        var dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < 4) {
            data.dx = 0;
            data.dy = 0;
        } else {
            data.dx = dx / dist;
            data.dy = dy / dist;
        }
        Client.sendVelocity(data);
    } else if (Game.moving) {
        Client.sendVelocity({ dx: 0, dy: 0 });
        Game.moving = false;
    }
};
/*
Game.getCoordinates = function(layer, pointer){
    Client.sendClick(pointer.worldX, pointer.worldY);
};
*/
Game.onIdent = function(clientInfo) {
    Game.myId = clientInfo.id;
    var client = {
        info: clientInfo,
    };
    Game.clientMap[clientInfo.id] = client;
    Game.infoText.text = "ID=" + clientInfo.id;
};

Game.onNewClient = function(list){
    for(var i = 0; i < list.length; i++) {
        var clientInfo = list[i];
        var client = {
            info: clientInfo,
        };
        var myClient = Game.clientMap[Game.myId];
        Game.clientMap[clientInfo.id] = client;
        if (clientInfo.isPlayer && myClient.info.needsUpdates) {
            client.sprite = game.add.sprite(clientInfo.x, clientInfo.y, clientInfo.role);
            Game.sprites.add(client.sprite);
        }
    }
};

Game.onUpdate = function(list) {
    for(var i = 0; i < list.length; i++) {
        var clientInfo = list[i];
        var client = Game.clientMap[clientInfo.id];
        if (!client.sprite) continue;

        client.info = clientInfo;
        var tween = game.add.tween(client.sprite);
        tween.to({ x: clientInfo.x, y: clientInfo.y, z: clientInfo.y }, 100);
        tween.start();

        var dir;
        if (Math.abs(clientInfo.dx) > Math.abs(clientInfo.dy)) {
            if (clientInfo.dx > 0) {
                dir = 3;
            } else {
                dir = 1;
            }
        } else {
            if (clientInfo.dy > 0) {
                dir = 2;
            } else if(clientInfo.dy < 0) {
                dir = 0;
            } else {
                client.sprite.frame = 10 * 13;
                continue;
            }
        }
        client.sprite.frame = (dir + 8) * 13 + Math.floor(Date.now() / 125) % 8 + 1;
    }
};

Game.onRemove = function(id) {
    var client = Game.clientMap[id];
    if (client.sprite) client.sprite.destroy();
    delete Game.clientMap[id];
};
