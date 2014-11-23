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

	function preload() {

		game.load.image('player', 'assets/Player.png');
		game.load.image('enemy', 'assets/Enemy.png');
		game.load.image('bullet', 'assets/Bullet.png');
	}

	function create() {

		//basic game settings
		game.stage.backgroundColor = '#33cc33';
		game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.setImpactEvents(true);

		//collision groups
		var playerCollisionGroup = game.physics.p2.createCollisionGroup();
		var enemiesCollisionGroup = game.physics.p2.createCollisionGroup();
		var bulletCollisionGroup = game.physics.p2.createCollisionGroup();

		game.physics.p2.updateBoundsCollisionGroup();

		//creating player
		player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
		player.anchor.setTo(0.5, 0.5);
		game.physics.p2.enable(player);

		// player.enableBody = true;
		//		player.body.setCircle(35);
		player.body.setCollisionGroup(playerCollisionGroup);
		player.body.collides([enemiesCollisionGroup, bulletCollisionGroup], function() {
			console.log('collision')
		}, this);
		player.body.fixedRotation = true;

		cursors = game.input.keyboard.createCursorKeys();

		keys['w'] = game.input.keyboard.addKey(Phaser.Keyboard.W);
		keys['a'] = game.input.keyboard.addKey(Phaser.Keyboard.A);
		keys['s'] = game.input.keyboard.addKey(Phaser.Keyboard.S);
		keys['d'] = game.input.keyboard.addKey(Phaser.Keyboard.D);
		keys['f'] = game.input.keyboard.addKey(Phaser.Keyboard.F);

		var bullets = game.add.group();
		bullets.enableBody = true;
		bullets.physicsBodyType = Phaser.Physics.P2JS;

		_.each(keys, function(key) {
			key.onDown.add(function() {

				//fullscreen toggle
				if (key.keyCode == Phaser.Keyboard.F) {
					toggleFullscreen();
				}

				var bullet,
					bulletPosition = _.clone(player.position),
					bulletVelocity = {
						x: player.body.velocity.x,
						y: player.body.velocity.y
					};

				if (key.keyCode == Phaser.Keyboard.A) {
					bulletPosition.x -= 30;
					bulletVelocity.x += -300;
				} else if (key.keyCode == Phaser.Keyboard.D) {
					bulletPosition.x += 30;
					bulletVelocity.x += 300;
				} else if (key.keyCode == Phaser.Keyboard.W) {
					bulletPosition.y -= 30;
					bulletVelocity.y += -300;
				} else if (key.keyCode == Phaser.Keyboard.S) {
					bulletPosition.y += 30
					bulletVelocity.y += 300;
				}

				bullet = bullets.create(bulletPosition.x, bulletPosition.y, 'bullet');
				bullet.body.velocity.x = bulletVelocity.x;
				bullet.body.velocity.y = bulletVelocity.y;
				bullet.body.setCircle(10);
				bullet.body.setCollisionGroup(bulletCollisionGroup);
				bullet.body.collides([enemiesCollisionGroup], function(bul, en) {
					bul.sprite.kill();
					en.sprite.kill();
					console.log('collision')
				}, this);

			});
		});

		var enemies = game.add.group();
		enemies.enableBody = true;
		enemies.physicsBodyType = Phaser.Physics.P2JS;

		for (var i = 0; i < 20; i++) {
			var enemy = enemies.create(Math.random() * 800, Math.random() * 600, 'enemy');
			enemy.body.fixedRotation = true;
			enemy.body.setCollisionGroup(enemiesCollisionGroup);
			enemy.body.collides([bulletCollisionGroup, playerCollisionGroup, enemiesCollisionGroup], function(body) {
				enemy.kill();
				// console.log('collision')
			});
		}
	}

	function toggleFullscreen() {
		if (game.scale.isFullScreen) {
			game.scale.stopFullScreen();
		} else {
			game.scale.startFullScreen();
		}
	}

	function update() {

		if (cursors.left.isDown) {
			player.body.velocity.x += -5;
		} else if (cursors.right.isDown) {
			player.body.velocity.x += 5;
		}

		if (cursors.up.isDown) {
			player.body.velocity.y += -5;
		} else if (cursors.down.isDown) {
			player.body.velocity.y += 5;
		}
	}

})();