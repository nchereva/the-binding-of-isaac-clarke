(function () {
	'use strict';

	var _ = require('lodash');
	var MovementAi = require('./ai/movement');
	var ShootAi = require('./ai/shooting');
//	var Doors = require('./world/Doors');
//	var DOOR_DIRECTIONS = Doors.DOOR_DIRECTIONS;

	var TILE_SIZE = 50,
		WALL_SIZE = TILE_SIZE * 1.6,
		TILES_X = 16,
		TILES_Y = 10,
		GRID_START = WALL_SIZE + TILE_SIZE / 2,
		ROOM_X = TILES_X * TILE_SIZE + 2 * WALL_SIZE,
		ROOM_Y = TILES_Y * TILE_SIZE + 2 * WALL_SIZE,
		DOOR_SIZE = 2 * TILE_SIZE,
		DEFAULT_SEED = ['defaultSeed'];

	var generatorSeed = DEFAULT_SEED;
	var LevelGenerator = require('./world/LevelGenerator');
	var levelGenerator = new LevelGenerator(generatorSeed);

	var roomsMask = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	];

	var game = new Phaser.Game(ROOM_X, ROOM_Y, Phaser.AUTO, '', {
		preload: preload,
		create: create,
		update: update,
		render: render
	});

	var physics;

	var collisionGroups = {
		playerCollisionGroup: {},
		enemiesCollisionGroup: {},
		bulletsCollisionGroup: {},
		stonesCollisionGroup: {},
		doorsCollisionGroup: {},
		wallsCollisionGroup: {}
	};

	var player,
		playerHealth = 10,
		playerHealthText = '',

		enemies,
		enemyAis = [],

//		Bullet = require('./bullet/Bullet.js'),
		bullets,
		bulletDamage = 1,
		fireRate = 2, // shots per second
		fireDelay = 1000,   // one second
		invulnerableDuration = 1000,

		stones,
		cursors,
		levelGrid,

		pad1,
		keyboard,
		keyboardControls = {},

		roomOffsetX,
		roomOffsetY,

		wallDoorless,
		wallPiece1,
		wallPiece2,

		wall_corner_top_left,
		wall_corner_top_right,
		wall_corner_bottom_left,
		wall_corner_bottom_right,

		door,
		doors,
		lastUsedDoor;

	/**
	 *   Phaser signals aka custom events
	 */
	game.onPlayerDamage = new Phaser.Signal();

	function preload() {
		/**
		 *  Preloading game asssets
		 */
		game.load.image('wallCorner', 'assets/sprites/wall_corner_1.png');
		game.load.image('wallPattern', 'assets/sprites/wall_pattern_1.png');
		game.load.image('floorPattern', 'assets/sprites/floor.png');
		game.load.image('player', 'assets/sprites/isaac.png');
		game.load.image('enemy', 'assets/sprites/enemy.png');
		game.load.image('bullet', 'assets/sprites/bullet-red.png');
		game.load.image('stone', 'assets/sprites/stone_1.png');
		game.load.image('crate', 'assets/sprites/crate_1.png');
		game.load.image('doorCollisionSprite', 'assets/sprites/doorCollisionSprite.png');

	}

	function create() {
		/**
		 *
		 */

		createLevelGrid();

		window.game = game;

		/**
		 *  Basic game settings
		 */
		game.stage.backgroundColor = '#0E74AF';
		game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.world.setBounds(0, 0, ROOM_X * roomsMask[0].length, ROOM_Y * roomsMask.length);

		/**
		 *  Enabling game physics
		 */
		game.physics.startSystem(Phaser.Physics.P2JS);
		physics = game.physics.p2;
		physics.setImpactEvents(true);

		_.forIn(collisionGroups,function(value, key){
			collisionGroups[key] = physics.createCollisionGroup();
		});
		physics.updateBoundsCollisionGroup();

		/**
		 *  Game input controls
		 */
		game.input.gamepad.start();
		pad1 = game.input.gamepad.pad1;
		keyboard = game.input.keyboard;
		cursors = keyboard.createCursorKeys();

		keyboardControls['w'] = keyboard.addKey(Phaser.Keyboard.W);
		keyboardControls['a'] = keyboard.addKey(Phaser.Keyboard.A);
		keyboardControls['s'] = keyboard.addKey(Phaser.Keyboard.S);
		keyboardControls['d'] = keyboard.addKey(Phaser.Keyboard.D);
		keyboardControls['f'] = keyboard.addKey(Phaser.Keyboard.F);

		keyboardControls['f'].onDown.add(function () {
			toggleFullscreen();
		});

		createWorld(roomsMask, createRoom, spawnInterier);

		//game.camera.focusOnXY(player.x, player.y);
	}



	function enableWallCollision(wallTileSprite) {
		wallTileSprite.enableBody = true;
		wallTileSprite.physicsBodyType = Phaser.Physics.P2JS;
		game.physics.p2.enable(wallTileSprite);
		wallTileSprite.body.setCollisionGroup(collisionGroups.wallsCollisionGroup);
		wallTileSprite.body.fixedRotation = true;
		wallTileSprite.body.static = true;
		wallTileSprite.body.collides(_.values(collisionGroups));
	}

	function enableDoorCollision(doorSprite) {
		doorSprite.enableBody = true;
		doorSprite.physicsBodyType = Phaser.Physics.P2JS;
		game.physics.p2.enable(doorSprite);
		doorSprite.body.setCollisionGroup(collisionGroups.doorsCollisionGroup);
		doorSprite.body.fixedRotation = true;
		doorSprite.body.static = true;
		doorSprite.body.collides(collisionGroups.playerCollisionGroup, doorsCollisionHandler);
		doorSprite.body._id = _.uniqueId('door_');
		doorSprite.body.collides(_.values(collisionGroups));
	}

	function doorsCollisionHandler(door, player) {
		console.log(door);
		if (lastUsedDoor === door._id) {
			return;
		}
		player.setZeroVelocity();
		switch (door._direction) {
			case ('top'):
				player.y -= 160;
				game.camera.focusOnXY(game.camera.x + (game.heigth * 0.5), game.camera.y - (game.width * 0.5));
				break;
			case ('bottom'):
				player.y += 160;
				game.camera.focusOnXY(game.camera.x + (game.heigth * 0.5), game.camera.y + (game.width * 1.5));
				break;
			case ('left'):
				player.x -= 160;
				game.camera.focusOnXY(game.camera.x - (game.heigth * 1.5), game.camera.y + (game.width * 0.5));
				break;
			case ('right'):
				player.x += 160;
				game.camera.focusOnXY(game.camera.x + (game.heigth * 1.5), game.camera.y + (game.width * 0.5));
				break;
		}
		lastUsedDoor = door._id;
	}

	function createWorld(roomMask, roomConstructor, spawnConstructor) {
		if (!_.isArray(roomMask)) {
			return;
		}

		_.forIn(roomMask, function (row, y) {
			_.forIn(row, function (item, x) {
				if (!item) {
					return;
				}
				roomConstructor(x * ROOM_X, y * ROOM_Y);
			});
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

		_.forIn(roomMask, function (row, y) {
			_.forIn(row, function (item, x) {
				if (!item) {
					return;
				}
				spawnConstructor(x * ROOM_X, y * ROOM_Y);
			});
		});
	}

	function spawnInterier(x, y) {
		roomOffsetX = x;
		roomOffsetY = y;

		var enemiesMask = levelGenerator.newMask({
			x: TILES_X,
			y: TILES_Y,
			enemies: {
				count: 4
			}
		});
		var stoneMask = levelGenerator.newMask({
			x: TILES_X,
			y: TILES_Y,
			enemies: {
				count: 6
			}
		});

		//creating player
		createPlayer();

		createLevel(stoneMask, stones, createStone);
		createLevel(enemiesMask, enemies, createEnemy);
	}

	function createRoom(x, y, orientation) {
		roomOffsetX = x;
		roomOffsetY = y;

		createWalls(true, true, true, true); // top, right, bottom, left
	}

	function createCorners() {
		// wall corners
		wall_corner_top_left = game.add.sprite(roomOffsetX, roomOffsetY, 'wallCorner');
		wall_corner_top_right = game.add.sprite(roomOffsetX + ROOM_X, roomOffsetY, 'wallCorner');
		wall_corner_bottom_left = game.add.sprite(roomOffsetX, roomOffsetY + ROOM_Y, 'wallCorner');
		wall_corner_bottom_right = game.add.sprite(roomOffsetX + ROOM_X, roomOffsetY + ROOM_Y, 'wallCorner');

		// corners flipping
		wall_corner_top_right.scale.x = -1;
		wall_corner_bottom_left.scale.y = -1;
		wall_corner_bottom_right.angle = 180;
	}

	function createWalls(top, right, bottom, left) {
		createCorners();
		var roomCenterX = roomOffsetX + ROOM_X / 2,
			roomCenterY = roomOffsetY + ROOM_Y / 2,
			addSprite = game.add.tileSprite.bind(game.add);

		var floorWidth = TILES_X * TILE_SIZE,
			floorHeight = TILES_Y * TILE_SIZE,
			wallStartX = roomOffsetX + WALL_SIZE,
			wallStartY = roomOffsetY + WALL_SIZE,
			wallEndX = wallStartX + floorWidth,
			wallEndY = wallStartY + floorHeight,
			wallPieceWidthX = floorWidth / 2 - DOOR_SIZE / 2,
			wallPieceWidthY = floorHeight / 2 - DOOR_SIZE / 2,
			wallHeight = WALL_SIZE,
			x1, x2, y1, y2;

		var floor = game.add.tileSprite(wallStartX, wallStartY, TILES_X * TILE_SIZE, TILES_Y * TILE_SIZE, 'floorPattern');

		if (top) {
			x1 = wallStartX + wallPieceWidthX / 2;
			x2 = wallEndX - wallPieceWidthX / 2;
			y1 = roomOffsetY + WALL_SIZE / 2;
			wallPiece1 = addSprite(x1, y1, wallPieceWidthX, wallHeight, 'wallPattern');
			wallPiece2 = addSprite(x2, y1, wallPieceWidthX, wallHeight, 'wallPattern');
			door = game.add.sprite(roomCenterX, roomOffsetY + 15, 'doorCollisionSprite');
			enableWallCollision(wallPiece1);
			enableWallCollision(wallPiece2);
			enableDoorCollision(door);
			door.body._direction = 'top';
		} else {
			wallDoorless = addSprite(roomCenterX, roomOffsetY + WALL_SIZE / 2, TILES_X * TILE_SIZE, WALL_SIZE, 'wallPattern');
			enableWallCollision(wallDoorless);
		}

		if (right) {
			x1 = wallEndX + WALL_SIZE / 2;
			y1 = wallStartY + wallPieceWidthY / 2;
			y2 = wallEndY - wallPieceWidthY / 2;
			wallPiece1 = addSprite(x1, y1, wallPieceWidthY, wallHeight, 'wallPattern');
			wallPiece2 = addSprite(x1, y2, wallPieceWidthY, wallHeight, 'wallPattern');
			door = game.add.sprite(roomOffsetX + ROOM_X - 15, roomCenterY, 'doorCollisionSprite');
			door.angle = 90;
			wallPiece1.angle = 90;
			wallPiece2.angle = 90;
			enableWallCollision(wallPiece1);
			enableWallCollision(wallPiece2);
			enableDoorCollision(door);
			door.body._direction = 'right';
		} else {
			wallDoorless = addSprite(roomOffsetX + ROOM_X - WALL_SIZE / 2, roomCenterY, TILES_Y * TILE_SIZE, WALL_SIZE, 'wallPattern');
			wallDoorless.angle = 90;
			enableWallCollision(wallDoorless);
		}

		if (bottom) {
			x1 = wallStartX + wallPieceWidthX / 2;
			x2 = wallEndX - wallPieceWidthX / 2;
			y1 = wallEndY + WALL_SIZE / 2;
			wallPiece1 = addSprite(x1, y1, wallPieceWidthX, wallHeight, 'wallPattern');
			wallPiece2 = addSprite(x2, y1, wallPieceWidthX, wallHeight, 'wallPattern');
			door = game.add.sprite(roomCenterX, roomOffsetY + ROOM_Y - 15, 'doorCollisionSprite');
			door.angle = 180;
			wallPiece1.angle = 180;
			wallPiece2.angle = 180;
			enableWallCollision(wallPiece1);
			enableWallCollision(wallPiece2);
			enableDoorCollision(door);
			door.body._direction = 'bottom';
		} else {
			wallDoorless = addSprite(roomCenterX, roomOffsetY + ROOM_Y - WALL_SIZE / 2, TILES_X * TILE_SIZE, WALL_SIZE, 'wallPattern');
			wallDoorless.angle = 180;
			enableWallCollision(wallDoorless);
		}

		if (left) {
			x1 = roomOffsetX + WALL_SIZE / 2;
			y1 = wallStartY + wallPieceWidthY / 2;
			y2 = wallEndY - wallPieceWidthY / 2;
			wallPiece1 = addSprite(x1, y1, wallPieceWidthY, wallHeight, 'wallPattern');
			wallPiece2 = addSprite(x1, y2, wallPieceWidthY, wallHeight, 'wallPattern');
			door = game.add.sprite(roomOffsetX + 15, roomCenterY, 'doorCollisionSprite');
			door.angle = -90;
			wallPiece1.angle = -90;
			wallPiece2.angle = -90;
			enableWallCollision(wallPiece1);
			enableWallCollision(wallPiece2);
			enableDoorCollision(door);
			door.body._direction = 'left';
		} else {
			wallDoorless = addSprite(roomOffsetX + WALL_SIZE / 2, roomCenterY, TILES_Y * TILE_SIZE, WALL_SIZE, 'wallPattern');
			wallDoorless.angle = -90;
			enableWallCollision(wallDoorless);
		}
	}

	var createPlayer = _.once(function () {
		player = game.add.sprite(roomOffsetX + ROOM_X / 2, roomOffsetY + ROOM_Y / 2, 'player'); // should be added to group and spawned on grid
		player.anchor.setTo(0.5, 0.5);
		player.invulnerable = false;
		player.fireDisabled = false;
		player.invulnerableDuration = invulnerableDuration;
		player.health = playerHealth;
		game.physics.p2.enable(player);
		player.body.setCollisionGroup(collisionGroups.playerCollisionGroup);
		player.body.collides(_.values(_.omit(collisionGroups, 'playerCollisionGroup')));
		player.body.fixedRotation = true;
		player.events.onKilled.add(function () {
			player.fireDisabled = true;
		});

		player.events.onOutOfBounds.add(function () {
			game.camera.follow(player);
		});

		for (var i = 0; i < player.health; i++) {
			playerHealthText += '♥';
		}
		game.onPlayerDamage.add(playerHealthReduce);

		game.camera.follow(player);
	});

	function playerHealthReduce(damage) {
		/**
		 * @method playerHealthReduce
		 * @param {number} damage - Damage recieved by player.
		 */
		if (playerHealth <= damage) {
			// TODO: Death code here
			playerHealth = 0;
			playerHealthText = "";
		} else {
			playerHealth -= damage;
			playerHealthText = playerHealthText.slice(0, -(damage));
		}
	}

	function createLevel(mask, group, constructor) {
		if (!_.isArray(mask)) {
			return;
		}

		_.forIn(mask, function (row, y) {
			_.forIn(row, function (value, x) {
				if (!value) {
					return;
				}
				constructor(group, x, y, value);
			});
		});
	}

	function createStone(group, column, row) {
		var stone = createAtPoint(group, column, row, 'stone');
		stone.body.setCollisionGroup(collisionGroups.stonesCollisionGroup);
		stone.body.collides(_.values(_.omit(collisionGroups, 'stonesCollisionGroup')));
		stone.body.fixedRotation = true;
		stone.body.static = true;
	}

	function createEnemy(group, column, row) {
		var enemy = createAtPoint(group, column, row, 'enemy');
		enemy._id = _.uniqueId('enemy_');
		enemy.body.fixedRotation = true;
		enemy.body.setCollisionGroup(collisionGroups.enemiesCollisionGroup);
		enemy.body.collides(_.values(collisionGroups));
		enemyAis.push(new ShootAi({
			object: enemy,
			target: player,
			bulletsGroup: bullets,
			bulletCollisionGroup: collisionGroups.bulletsCollisionGroup,
			targetCollisionGroup: _.values(_.omit(collisionGroups, 'bulletsCollisionGroup', 'enemiesCollisionGroup', 'playerCollisionGroup')),
			playerCollisionGroup: collisionGroups['playerCollisionGroup'],
			bulletDamage: bulletDamage,
			difficulty: 1
		}));
	}

	function createLevelGrid() {
		levelGrid = [];
		for (var i = 0; i < TILES_X; i++) {
			levelGrid[i] = [];
			for (var j = 0; j < TILES_Y; j++) {
				levelGrid[i][j] = {
					x: GRID_START + i * TILE_SIZE,
					y: GRID_START + j * TILE_SIZE
				}
			}
		}
	}

	function getSpriteCoordinates(column, row) {
		if (column instanceof Object) {
			row = column.y;
			column = column.x;
		}
		return {
			x: levelGrid[column][row].x + roomOffsetX,
			y: levelGrid[column][row].y + roomOffsetY
		};
	}

	function createAtPoint(group, column, row, sprite) {
		var coords = getSpriteCoordinates(column, row);
		return group.create(coords.x, coords.y, sprite);
	}

	function playerFire(direction) {
		/**
		 * @method playerFire
		 * @param {string} direction - Direction to shoot.
		 */

		if (!player.fireDisabled) {
			player.fireDisabled = true;

			var playerVelocity = player.body.velocity,
				bullet,
				bulletPosition = _.clone(player.position),
				bulletVelocity = {
					x: playerVelocity.x,
					y: playerVelocity.y
				};

			switch (direction) {
				case ('left'):
					bulletPosition.x -= 30;
					bulletVelocity.x += -300;
					playerVelocity.x += 200;
					break;
				case ('right'):
					bulletPosition.x += 30;
					bulletVelocity.x += 300;
					playerVelocity.x += -200;
					break;
				case ('top'):
					bulletPosition.y -= 30;
					bulletVelocity.y += -300;
					playerVelocity.y += 200;
					break;
				case ('bottom'):
					bulletPosition.y += 30;
					bulletVelocity.y += 300;
					playerVelocity.y += -200;
					break;
				default:
					console.log('playerFire(): Wrong playerFire direction passed');
					break;
			}

			bullet = bullets.create(bulletPosition.x, bulletPosition.y, 'bullet');
			bullet.body.velocity.x = bulletVelocity.x;
			bullet.body.velocity.y = bulletVelocity.y;
			bullet.body.setCircle(10);
			bullet.body.setCollisionGroup(collisionGroups.bulletsCollisionGroup);
			bullet.body.collides([collisionGroups.enemiesCollisionGroup], function (bul, en) {
				if (bul.sprite.alive && en.sprite.alive) {
					bul.sprite.kill();
					en.sprite.kill();
				}
				console.log('collision');
			}, this);

			bullet.body.collides([collisionGroups.stonesCollisionGroup, collisionGroups.doorsCollisionGroup, collisionGroups.wallsCollisionGroup], function (bul) {
				if (bul.sprite.alive) {
					bul.sprite.kill();
				}
			});

			var fireRateTimeout = setTimeout(function () {
				player.fireDisabled = false;
			}, fireDelay / fireRate);
		}
	}

	function toggleFullscreen() {
		if (game.scale.isFullScreen) {
			game.scale.stopFullScreen();
		} else {
			game.scale.startFullScreen(false); // false = retain pixel art, true = smooth art
		}
	}

	function update() {
		/**
		 *  Called 60 times per second.
		 */

		if (cursors.left.isDown || pad1.isDown(Phaser.Gamepad.XBOX360_X)) {
			playerFire('left');
		} else if (cursors.right.isDown || pad1.isDown(Phaser.Gamepad.XBOX360_B)) {
			playerFire('right');
		} else if (cursors.up.isDown || pad1.isDown(Phaser.Gamepad.XBOX360_Y)) {
			playerFire('top');
		} else if (cursors.down.isDown || pad1.isDown(Phaser.Gamepad.XBOX360_A)) {
			playerFire('bottom');
		}

		//player movement
		if (keyboardControls['w'].isDown || pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_UP || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.1)) {
			player.body.velocity.y += -5;
		} else if (keyboardControls['s'].isDown || pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_DOWN || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.1)) {
			player.body.velocity.y += 5;
		}
		if (keyboardControls['a'].isDown || pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1)) {
			player.body.velocity.x += -5;
		} else if (keyboardControls['d'].isDown || pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1)) {
			player.body.velocity.x += 5;
		}

		//enemy actions
		_.each(enemyAis, function (ai) {
			if (ai.move) {
				ai.move();
			}
			if (ai.shoot) {
				ai.shoot();
			}
		});
	}

	function render() {
		/**
		 *  Additional debugging info rendering
		 */
		game.debug.cameraInfo(game.camera, 32, 32);
		game.debug.spriteCoords(player, 32, 475);

		// fps
		game.time.advancedTiming = true;
		game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");

		// TODO: Player health functionality
		game.debug.text(playerHealthText + ": " + playerHealth, 33, 14, "#ff0000");
	}
})();