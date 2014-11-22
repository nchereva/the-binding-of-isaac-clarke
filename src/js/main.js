(function() {
  'use strict';

  var _ = require('lodash');

  var game = new Phaser.Game(800, 600, Phaser.AUTO, '', {
    preload: preload,
    create: create,
    update: update
  });
  var player;
  var cursors;
  var enemy;
  var keys = {};
  var Bullet = require('./bullet/Bullet.js');
  //	var fire =

    function preload () {

        game.load.image('logo', 'assets/sprite.png');
        game.load.image('player', 'assets/Player.png');
        game.load.image('enemy', 'assets/black_isaac.png');

  function create() {
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setImpactEvents(true);

    var playerCollisionGroup = game.physics.p2.createCollisionGroup();
    var enemiesCollisionGroup = game.physics.p2.createCollisionGroup();
    var bulletCollisionGroup = game.physics.p2.createCollisionGroup();

    game.physics.p2.updateBoundsCollisionGroup();

        player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
        player.anchor.setTo(0.5, 0.5);

    player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
    game.physics.p2.enable(player);

    player.anchor.setTo(0.5, 0.5);
    // player.enableBody = true;
    player.body.setCircle(35);
    player.body.setCollisionGroup(playerCollisionGroup);
    player.body.collides([enemiesCollisionGroup, bulletCollisionGroup], function() {
      console.log('collision')
    }, this)
    player.body.fixedRotation = true;

    game.stage.backgroundColor = '#33cc33';



    cursors = game.input.keyboard.createCursorKeys();

    keys['w'] = game.input.keyboard.addKey(Phaser.Keyboard.W);
    keys['a'] = game.input.keyboard.addKey(Phaser.Keyboard.A);
    keys['s'] = game.input.keyboard.addKey(Phaser.Keyboard.S);
    keys['d'] = game.input.keyboard.addKey(Phaser.Keyboard.D);

    var bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.P2JS;

    _.each(keys, function(key) {
      key.onDown.add(function() {
        var bullet

				if (key.keyCode == Phaser.Keyboard.A) {
				bullet	= bullets.create(player.position.x-30, player.position.y, 'bullet');
					bullet.body.velocity.x += -30;
				} else if (key.keyCode == Phaser.Keyboard.D) {
				bullet	= bullets.create(player.position.x+30, player.position.y, 'bullet');
					bullet.body.velocity.x += 30;
				} else if (key.keyCode == Phaser.Keyboard.W) {
				bullet	= bullets.create(player.position.x, player.position.y-30, 'bullet');
					bullet.body.velocity.y += -30;
				} else if (key.keyCode == Phaser.Keyboard.S) {
				bullet	= bullets.create(player.position.x, player.position.y+30, 'bullet');
					bullet.body.velocity.y += 30;
				}

				bullet.body.setCircle(20);
				bullet.body.setCollisionGroup(bulletCollisionGroup);
				bullet.body.collides([bulletCollisionGroup, enemiesCollisionGroup, playerCollisionGroup], function() {
					console.log('collision')
				}, this);

			}
    );
    });

    var enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.P2JS;

    for (var i = 0; i < 20; i++) {
      var enemy = enemies.create(Math.random() * 800, Math.random() * 600, 'enemy');
      enemy.body.setCollisionGroup(enemiesCollisionGroup);
      enemy.body.collides([bulletCollisionGroup, playerCollisionGroup, enemiesCollisionGroup], function(body) {
        enemy.kill();
				// console.log('collision')
      });
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
