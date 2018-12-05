
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
    Phaser.Canvas.setImageRenderingCrisp(game.canvas);

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

function removeSprite(client) {
    if (client.hair) client.hair.destroy();
    if (client.body) client.body.destroy();
}

function addSprite(client, role) {
    client.body = game.add.sprite(client.info.x, client.info.y, role);
    client.hair = game.add.sprite(client.info.x, client.info.y, "hair");
    Game.sprites.add(client.body);
    Game.sprites.add(client.hair);
    var colorAngle = client.info.id * 2.5;
    var red = Math.sin(colorAngle - 2) * 127.5 + 127.5;
    var green = Math.sin(colorAngle) * 127.5 + 127.5;
    var blue = Math.sin(colorAngle + 2) * 127.5 + 127.5;
    client.hair.tint = (red << 16) + (green << 8) + (blue);
}

Game.update = function() {
    Game.sprites.sort("z", Phaser.Group.SORT_ASCENDING);

    if (Game.myId === undefined) {
        return;
    }

    var data = { dx: 0, dy: 0};

    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        data.dx--;
    }
    if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        data.dx++;
    }
    if (game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        data.dy--;
    }
    if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        data.dy++;
    }

    if (game.input.activePointer.isDown) {
        Game.moving = true;
        var dx = game.input.x - (game.scale.width / 2);
        var dy = game.input.y - (game.scale.height / 2);
        var dist = Math.sqrt(dx * dx + dy * dy);
        if(dist >= 4) {
            data.dx += dx / dist;
            data.dy += dy / dist;
        }
    }
    var d = Math.sqrt(data.dx * data.dx + data.dy * data.dy);
    if(d) {
        data.dx /= d;
        data.dy /= d;
    }
    Client.sendVelocity(data);
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
            addSprite(client, client.info.role);
        }
    }
};

Game.onUpdate = function(list) {
    for(var i = 0; i < list.length; i++) {
        var clientInfo = list[i];
        var client = Game.clientMap[clientInfo.id];
        if (!client.body) continue;

        if (client.info) {
            if (client.info.role != clientInfo.role) {
                removeSprite(client);
                addSprite(client, clientInfo.role);
            }
        }

        client.info = clientInfo;
        var tween = game.add.tween(client.body);
        tween.to({ x: clientInfo.x, y: clientInfo.y, z: clientInfo.y }, 100);
        tween.start();
        var tween2 = game.add.tween(client.hair);
        tween2.to({ x: clientInfo.x, y: clientInfo.y, z: clientInfo.y }, 100);
        tween2.start();

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
                client.hair.frame = client.body.frame = 10 * 13;
                continue;
            }
        }
        client.hair.frame = client.body.frame = (dir + 8) * 13 + Math.floor(Date.now() / 125) % 8 + 1;    }
};

Game.onRemove = function(id) {
    var client = Game.clientMap[id];
    removeSprite(client);
    delete Game.clientMap[id];
};
