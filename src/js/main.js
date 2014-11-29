(function() {
	'use strict';

	var _ = require('lodash');
	var ai = require('./ai/movement');

	var TILE_SIZE = 50,
		WALL_SIZE = TILE_SIZE * 1.75,
		TILES_X = 13,
		TILES_Y = 7,
		GRID_START = WALL_SIZE + TILE_SIZE / 2;

	var stoneMask = [
		[1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
		[1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
		[1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
		[1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
		[1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
		[1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
		[1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0]
	];

	var game = new Phaser.Game(TILES_X * TILE_SIZE + 2 * WALL_SIZE, TILES_Y * TILE_SIZE + 2 * WALL_SIZE, Phaser.AUTO, '', {
		preload: preload,
		create: create,
		update: update
	});

	var playerCollisionGroup,
		enemiesCollisionGroup,
		bulletsCollisionGroup,
		stonesCollisionGroup;

	var player,
		enemies,
		enemy,
		enemyAis = [],
		stones,
		stone,
		cursors,
		levelGrid,
		keys = {}, // Those are keyboard buttons. I thought it stands for key item to open doors, lol
		//		Bullet = require('./bullet/Bullet.js'),
		bullets,
		bullet,
		fireRate = 2,
		fireDelay = 1000,
		fireDisabled = false;

	function preload() {

		game.load.image('player', 'assets/sprites/isaac.png');
		game.load.image('enemy', 'assets/sprites/enemy.png');
		game.load.image('bullet', 'assets/sprites/bullet-red.png');
		game.load.image('stone', 'assets/sprites/stone_1.png');
		game.load.image('crate', 'assets/sprites/crate_1.png');

	}

	function create() {

		createLevelGrid();

		//basic game settings
		game.stage.backgroundColor = '#33cc33';
		game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.setImpactEvents(true);

		//collision groups
		playerCollisionGroup = game.physics.p2.createCollisionGroup();
		enemiesCollisionGroup = game.physics.p2.createCollisionGroup();
		bulletsCollisionGroup = game.physics.p2.createCollisionGroup();
		stonesCollisionGroup = game.physics.p2.createCollisionGroup();

		game.physics.p2.updateBoundsCollisionGroup();

		//creating player
		player = game.add.sprite(game.world.centerX, game.world.centerY, 'player'); // should be added to group and spawned on grid
		player.anchor.setTo(0.5, 0.5);
		game.physics.p2.enable(player);
		player.body.setCollisionGroup(playerCollisionGroup);
		player.body.collides([enemiesCollisionGroup, bulletsCollisionGroup, stonesCollisionGroup], function() {
			console.log('player collision');
		}, this);
		player.body.fixedRotation = true;

		cursors = game.input.keyboard.createCursorKeys();

		keys['w'] = game.input.keyboard.addKey(Phaser.Keyboard.W);
		keys['a'] = game.input.keyboard.addKey(Phaser.Keyboard.A);
		keys['s'] = game.input.keyboard.addKey(Phaser.Keyboard.S);
		keys['d'] = game.input.keyboard.addKey(Phaser.Keyboard.D);
		keys['f'] = game.input.keyboard.addKey(Phaser.Keyboard.F);

		_.each(keys, function(key) {
			key.onDown.add(function() {

				//fullscreen toggle
				if (key.keyCode == Phaser.Keyboard.F) {
					toggleFullscreen();
				}
			});

			key.onHoldCallback = function() {
				//direction fire
				if (key.keyCode == Phaser.Keyboard.A) {
					playerFire('left');
				} else if (key.keyCode == Phaser.Keyboard.D) {
					playerFire('right');
				} else if (key.keyCode == Phaser.Keyboard.W) {
					playerFire('top');
				} else if (key.keyCode == Phaser.Keyboard.S) {
					playerFire('bottom');
				}
			};
		});

		// Should those be created by function?
		bullets = game.add.group();
		bullets.enableBody = true;
		bullets.physicsBodyType = Phaser.Physics.P2JS;

		enemies = game.add.group();
		enemies.enableBody = true;
		enemies.physicsBodyType = Phaser.Physics.P2JS;

		stones = game.add.group();
		stones.enableBody = true;
		stones.physicsBodyType = Phaser.Physics.P2JS;

		createLevel(stoneMask, stones);

		createEnemy(enemies, 1, 1);
		createEnemy(enemies, 11, 5);
	}

	function playerFire(direction) {

		if (!fireDisabled) {
			fireDisabled = true;

			var bullet,
				bulletPosition = _.clone(player.position),
				bulletVelocity = {
					x: player.body.velocity.x,
					y: player.body.velocity.y
				};

			switch (direction) {
				case ('left'):
					bulletPosition.x -= 30;
					bulletVelocity.x += -300;
					player.body.velocity.x += 200;
					break;
				case ('right'):
					bulletPosition.x += 30;
					bulletVelocity.x += 300;
					player.body.velocity.x += -200;
					break;
				case ('top'):
					bulletPosition.y -= 30;
					bulletVelocity.y += -300;
					player.body.velocity.y += 200;
					break;
				case ('bottom'):
					bulletPosition.y += 30;
					bulletVelocity.y += 300;
					player.body.velocity.y += -200;
					break;
				default:
					console.log('No playerFire direction');
					break;
			}

			bullet = bullets.create(bulletPosition.x, bulletPosition.y, 'bullet');
			bullet.body.velocity.x = bulletVelocity.x;
			bullet.body.velocity.y = bulletVelocity.y;
			bullet.body.setCircle(10);
			bullet.body.setCollisionGroup(bulletsCollisionGroup);
			bullet.body.collides([enemiesCollisionGroup], function(bul, en) {
				if (bul.sprite.alive && en.sprite.alive) {
					bul.sprite.kill();
					en.sprite.kill();
				}
				console.log('collision')
			}, this);

			bullet.body.collides([stonesCollisionGroup], function(bul, en) {
				if (bul.sprite.alive) {
					bul.sprite.kill();
				}
				console.log('collision')
			}, this);

			var fireRateTimeout = setTimeout(function() {
				fireDisabled = false;
			}, fireDelay / fireRate);
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
		_.each(enemyAis, function(ai) {
			ai.move();
		})
	}

	function createLevel(mask, group) {
		if (!_.isArray(mask)) {
			return;
		}

		_.forIn(mask, function(row, y) {
			_.forIn(row, function(item, x) {
				if(!item) return;
				createStone(group, x, y);
			})
		})
	}

	function createStone(group, column, row) {
		var stone = createAtPoint(group, column, row, 'stone');
		stone.body.setCollisionGroup(stonesCollisionGroup);
		stone.body.collides([playerCollisionGroup, enemiesCollisionGroup, bulletsCollisionGroup, stonesCollisionGroup]);
		stone.body.fixedRotation = true;
		stone.body.static = true;
	}

	function createEnemy(group, column, row) {
		var enemy = createAtPoint(group, column, row, 'enemy');
		enemy.body.setCollisionGroup(enemiesCollisionGroup);
		enemy.body.collides([playerCollisionGroup, enemiesCollisionGroup, bulletsCollisionGroup, stonesCollisionGroup]);
		enemyAis.push(new ai(enemy, player, 100, true));
		enemy.body.fixedRotation = true;
	}

	function createLevelGrid() {
		levelGrid = [];
		for (var i = 0; i < TILES_X; i++) {
			levelGrid[i] = [];
			for (var j = 0; j < TILES_Y; j++) {
				levelGrid[i][j] = [GRID_START + i * TILE_SIZE, GRID_START + j * TILE_SIZE];
			}
		}
	}

	function createAtPoint(group, column, row, sprite) {
		var spawn_x = levelGrid[column][row][0];
		var spawn_y = levelGrid[column][row][1];
		return group.create(spawn_x, spawn_y, sprite);
	}

})();