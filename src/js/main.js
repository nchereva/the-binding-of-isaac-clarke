'use strict';
//
//var game = new Phaser.Game(800, 600, Phaser.AUTO, 'isaac-for-web-game');
//
//window.Utils = require('./utils');
//window.playerState = {
//    currentLevel: 'Game'
//}
//
//game.state.add('Boot', require('./states/boot'));
//game.state.add('Splash', require('./states/splash'));
//game.state.add('Preloader', require('./states/preloader'));
//game.state.add('Menu', require('./states/menu'));
//game.state.add('Game', require('./states/game'));
//
//game.state.start('Boot');

window.onload = function() {

    var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update});
    var player;
    var cursors;
    var enemy;

    function preload () {

        game.load.image('logo', 'assets/sprite.png');
        game.load.image('player', 'assets/isaac2.png');
        game.load.image('enemy', 'assets/black_isaac.png');

    }

    function create () {

        console.log(game.world);

        player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
        player.anchor.setTo(0.5, 0.5);

        game.stage.backgroundColor = '#33cc33';

        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.enable(player);

        cursors = game.input.keyboard.createCursorKeys();

        var enemies = game.add.group();
        for (var i = 0; i< 20; i++) {
            enemies.create(Math.random() * 800, Math.random() * 600, 'enemy');
        }

        game.physics.p2.enable(enemies);
    }

    function update () {

        if(cursors.left.isDown) {
            player.body.velocity.x += -5;
        }
        else if(cursors.right.isDown) {
            player.body.velocity.x += 5;
        }


        if(cursors.up.isDown) {
            player.body.velocity.y += -5;
        }
        else if (cursors.down.isDown) {
            player.body.velocity.y += 5;
        }
    }

    };
