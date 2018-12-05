
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
    game.load.audio('music', 'assets/music/one.mp3');
    game.load.audio('avoid1', 'assets/sounds/avoid1.wav');
    game.load.audio('catch1', 'assets/sounds/catch1.wav');
    game.load.audio('idle1', 'assets/sounds/idle1.wav');
    game.load.audio('idle2', 'assets/sounds/idle2.wav');
    game.load.audio('idle3', 'assets/sounds/idle3.wav');
    game.load.audio('idle4', 'assets/sounds/idle4.wav');
    game.load.image('control', 'assets/sprites/compass.png');
};

Game.create = function(){
    Phaser.Canvas.setImageRenderingCrisp(game.canvas);

    Game.type = game.net.getQueryString()["type"] || "player";

    if (Game.type == "player") {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        // game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        // game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        Game.controlSprite = game.add.sprite(game.scale.width / 2, game.scale.height / 2, "control")
        Game.controlSprite.pivot.setTo(Game.controlSprite.width / 2, Game.controlSprite.height - Game.controlSprite.width / 2)
    } else {
        var map = game.add.tilemap('map');
        map.addTilesetImage('tilesheet', 'tileset'); // tilesheet is the key of the tileset in map's JSON file
        var layer;
        for (var i = 0; i < map.layers.length; i++) {
            layer = map.createLayer(i);
        }
        layer.inputEnabled = true; // Allows clicking on the map ; it's enough to do it on the last layer
        //    layer.events.onInputUp.add(Game.getCoordinates, this);
    }

    Game.sprites = game.add.group();

    Game.music = game.add.audio('music');
    Game.avoid1 = game.add.audio('avoid1');
    Game.catch1 = game.add.audio('catch1');
    Game.idle1 = game.add.audio('idle1');
    Game.idle2 = game.add.audio('idle2');
    Game.idle3 = game.add.audio('idle3');
    Game.idle4 = game.add.audio('idle4');
    Game.nextIdle = Date.now();

    Client.sendNewClient({
        type: Game.type,
        isPlayer: Game.type == "player" || Game.type == "pcplayer",
        needsUpdates: Game.type == "spectator" || Game.type == "pcplayer",
        playsSound: Game.type == "spectator",
    });
};

function playSound(name, looped) {
    if (Game.myId) {
        if (Game.clientMap[Game.myId].info.playsSound) {
            if (looped) {
                Game[name].loopFull();
            } else {
                Game[name].play();
            }
        }
    }
}

function playerColor(id) {
    var colorAngle = id * 2.5;
    var red = Math.floor(Math.sin(colorAngle - 2) * 127.5 + 127.5);
    var green = Math.floor(Math.sin(colorAngle) * 127.5 + 127.5);
    var blue = Math.floor(Math.sin(colorAngle + 2) * 127.5 + 127.5);
    return (red << 16) + (green << 8) + (blue);
}

function removeSprite(client) {
    if (client.hair) client.hair.destroy();
    if (client.body) client.body.destroy();
}

function addSprite(client, role) {
    client.body = game.add.sprite(client.info.x, client.info.y, role);
    client.hair = game.add.sprite(client.info.x, client.info.y, "hair");
    client.body.pivot.setTo(32, 56);
    client.hair.pivot.setTo(32, 56);
    Game.sprites.add(client.body);
    Game.sprites.add(client.hair);
    client.hair.tint = playerColor(client.info.id);
}

Game.update = function() {
    Game.sprites.sort("z", Phaser.Group.SORT_ASCENDING);

    var now = Date.now();
    if (Game.nextIdle < now) {
        playSound(["idle1", "idle2", "idle3", "idle4"][Math.floor(Math.random() * 4)], false);
        Game.nextIdle = now + 3000 + Math.random() * 10000;
    }

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

    if (Game.type == "player") {
        Game.controlSprite.rotation = Game.moving ? game.physics.arcade.angleToPointer(Game.controlSprite) + Math.PI / 2 : 0;
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

    playSound("music", true);
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
            color = playerColor(clientInfo.id);
            color = "000000" + Number(color).toString(16);
            color = color.substr(color.length - 6);
            client.scoreText = game.add.text(660, client.info.id * 24 + 8, "0", { fill: "#" + color, strokeThickness: 2, stroke: "black", boundsAlignH: "right" });
            client.scoreText.setTextBounds(0, 0, 100, 0);
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
                playSound("catch1", false);
            }
        }

        client.info = clientInfo;
        var x = clientInfo.x;
        var y = clientInfo.y;
        var z = clientInfo.y;
        var tween = game.add.tween(client.body);
        tween.to({ x: x, y: y, z: z }, 100);
        tween.start();
        var tween2 = game.add.tween(client.hair);
        tween2.to({ x: x, y: y, z: z + 0.5 }, 100);
        tween2.start();

        client.scoreText.setText(clientInfo.score);

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
        client.hair.frame = client.body.frame = (dir + 8) * 13 + Math.floor(Date.now() / 125) % 8 + 1;
    }
};

Game.onRemove = function(id) {
    var client = Game.clientMap[id];
    removeSprite(client);
    client.scoreText.destroy();
    delete Game.clientMap[id];
};
