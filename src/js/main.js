(function() {
	'use strict';

	var _ = require('lodash');
	var movementAi = require('./ai/movement');
	var shootAi = require('./ai/shooting');

	var DOORS = {
		LEFT: 'LEFT',
		RIGHT: 'RIGHT',
		TOP: 'TOP',
		BOTTOM: 'BOTTOM'
	}

	var lastUsedDoor;

	var TILE_SIZE = 50,
		WALL_SIZE = TILE_SIZE * 1.75,
		TILES_X = 13,
		TILES_Y = 7,
		GRID_START = WALL_SIZE + TILE_SIZE / 2,
		WORLD_X = TILES_X * TILE_SIZE + 2 * WALL_SIZE,
		WORLD_Y = TILES_Y * TILE_SIZE + 2 * WALL_SIZE,
		roomOffsetX, roomOffsetY;


	var room = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	];

	var stoneMask = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	];

	var doorMask = [
		[0, 0, 0, 0, 0, 0, DOORS.TOP, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[DOORS.LEFT, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, DOORS.RIGHT],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, DOORS.BOTTOM, 0, 0, 0, 0, 0, 0]
	];

	var game = new Phaser.Game(WORLD_X, WORLD_Y, Phaser.AUTO, '', {
		preload: preload,
		create: create,
		update: update,
		render: render
	});

	var playerCollisionGroup,
		enemiesCollisionGroup,
		bulletsCollisionGroup,
		stonesCollisionGroup,
		doorCollisionGroup;

	var player,
		enemies,
		enemy,
		enemyAis = [],
		doors,
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
		game.stage.backgroundColor = '#0E74AF';
		game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.world.setBounds(0, 0, WORLD_X * room[0].length, WORLD_Y * room.length);
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.setImpactEvents(true);

		//collision groups
		playerCollisionGroup = game.physics.p2.createCollisionGroup();
		enemiesCollisionGroup = game.physics.p2.createCollisionGroup();
		bulletsCollisionGroup = game.physics.p2.createCollisionGroup();
		stonesCollisionGroup = game.physics.p2.createCollisionGroup();
		doorCollisionGroup = game.physics.p2.createCollisionGroup();

		// game.world.setBounds(0, 0, WORLD_X, WORLD_Y);


		window.game = game;

		game.physics.p2.updateBoundsCollisionGroup();


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

		doors = game.add.group();
		doors.enableBody = true;
		doors.physicsBodyType = Phaser.Physics.P2JS;

		createWorld(room, createRoom);

		game.camera.focusOnXY(player.x, player.y);

	}

	function createRoom(x, y, orientation) {
		roomOffsetX = x;
		roomOffsetY = y;
		//creating player

		game.add.text(x, y, _.uniqueId('_room'));

		createPlayer();
		createLevel(stoneMask, stones, createStone);
		createLevel(doorMask, doors, createDoor);

		// createEnemy(enemies, 1, 1);
		// createEnemy(enemies, 11, 5);

	}

	var createPlayer = _.once(function() {
		player = game.add.sprite(roomOffsetX + WORLD_X / 2, roomOffsetY + WORLD_Y / 2, 'player'); // should be added to group and spawned on grid
		player.anchor.setTo(0.5, 0.5);
		game.physics.p2.enable(player);
		player.body.setCollisionGroup(playerCollisionGroup);
		player.body.collides([enemiesCollisionGroup, bulletsCollisionGroup, stonesCollisionGroup, doorCollisionGroup], function() {
			// console.log('player collision');
		}, this);
		player.body.fixedRotation = true;

		player.events.onOutOfBounds.add(function(){
			game.camera.follow(player);
		})

		game.camera.follow(player);
	});

	function createWorld(roomMask, roomConstructor) {
		if (!_.isArray(roomMask)) {
			return;
		}

		_.forIn(roomMask, function(row, y) {
			_.forIn(row, function(item, x) {
				if (!item) return;
				roomConstructor(x * WORLD_X, y * WORLD_Y);
			})
		})
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

			bullet.body.collides([stonesCollisionGroup, doorCollisionGroup], function(bul, en) {
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
			if (ai.move) ai.move();
			if (ai.shoot) ai.shoot();
		})
	}

	function createLevel(mask, group, constructor) {
		if (!_.isArray(mask)) {
			return;
		}

		_.forIn(mask, function(row, y) {
			_.forIn(row, function(value, x) {
				if (!value) return;
				constructor(group, x, y, value);
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

	function createDoor(group, column, row, direction) {
		var door = createAtPoint(group, column, row, 'crate');
		door.body._id = _.uniqueId('door_');
		door.body.direction = direction;
		door.body.setCollisionGroup(doorCollisionGroup);
		door.body.collides([playerCollisionGroup], function(door, player) {
			// console.log(door.direction);
			// game.camera.unfollow();
			if (lastUsedDoor === door._id) return;
			switch (door.direction) {
				case DOORS.TOP:
					player.y -= 325;
					game.camera.focusOnXY(game.camera.x + (WORLD_X * 0.5), game.camera.y - (WORLD_Y * 0.5));
					break;
				case DOORS.BOTTOM:
					player.y += 325;
					game.camera.focusOnXY(game.camera.x + (WORLD_X * 0.5), game.camera.y + (WORLD_Y * 1.5));

					break;
				case DOORS.LEFT:
					player.x -= 325;
					game.camera.focusOnXY(game.camera.x - (WORLD_X * 1.5), game.camera.y + (WORLD_Y * 0.5));

					break;
				case DOORS.RIGHT:
					player.x += 325;
					game.camera.focusOnXY(game.camera.x + (WORLD_X * 1.5), game.camera.y + (WORLD_Y * 0.5));
					break;
			}
			lastUsedDoor = door._id;
		});
		door.body.collides([enemiesCollisionGroup, bulletsCollisionGroup, stonesCollisionGroup]);
		door.body.fixedRotation = true;
		door.body.static = true;
	}

	function createEnemy(group, column, row) {
		var enemy = createAtPoint(group, column, row, 'enemy');
		enemy._id = _.uniqueId('enemy_');
		enemy.body.fixedRotation = true;
		enemy.body.setCollisionGroup(enemiesCollisionGroup);
		enemy.body.collides([bulletsCollisionGroup, enemiesCollisionGroup, playerCollisionGroup, stonesCollisionGroup, doorCollisionGroup]);
		enemyAis.push(new shootAi({
			object: enemy,
			target: player,
			bulletsGroup: bullets,
			bulletCollisionGroup: bulletsCollisionGroup,
			targetCollisionGroup: [playerCollisionGroup, stonesCollisionGroup, doorCollisionGroup],
			difficulty: 2
		}));
		enemyAis.push(new movementAi(enemy, player, 500));
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
		var spawn_x = levelGrid[column][row][0] + roomOffsetX;
		var spawn_y = levelGrid[column][row][1] + roomOffsetY;
		return group.create(spawn_x, spawn_y, sprite);
	}

	function render() {
		game.debug.cameraInfo(game.camera, 32, 32);
		game.debug.spriteCoords(player, 32, 475);
	}
})();