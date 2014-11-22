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
    var enemies;

    function preload () {

        game.load.image('logo', 'assets/sprite.png');
        game.load.image('player', 'assets/Player.png');
        game.load.image('enemy', 'assets/black_isaac.png');

    }

    function create () {

        console.log(game.world);

        //basic game settings
        game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.stage.backgroundColor = '#33cc33';

        //adding player
        player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
        player.anchor.setTo(0.5, 0.5);

        //creating enemies
        enemies = game.add.group();
        for (var i = 0; i< 20; i++) {
            enemies.create(Math.random() * 800, Math.random() * 600, 'enemy');
        }

        //creating game physics
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.enable(player);
        game.physics.p2.enable(enemies);

        //go full screen on click
        game.input.onDown.add(gofull, this);

        cursors = game.input.keyboard.createCursorKeys();
    }

    function gofull() {

        if (game.scale.isFullScreen) {
            game.scale.startFullScreen(false);
        } else {
            game.scale.startFullScreen(false);
        }


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
