(function() {
	'use strict';

	var _ = require('lodash');

	var DOOR_DIRECTIONS = {
		LEFT: 'LEFT',
		RIGHT: 'RIGHT',
		TOP: 'TOP',
		BOTTOM: 'BOTTOM'
	};
	var TILES_X,
		TILES_Y;

	var _game;

	var lastUsedDoor;

	function getDoorPosition(orientation) {
		if (!orientation) {
			return;
		}

		switch (orientation) {
			case DOOR_DIRECTIONS.TOP:
				return {
					x: Math.round(TILES_X / 2),
					y: 0
				};
			case DOOR_DIRECTIONS.BOTTOM:
				return {
					x: Math.round(TILES_X / 2),
					y: TILES_Y - 1
				};

			case DOOR_DIRECTIONS.LEFT:
				return {
					x: 0,
					y: Math.round(TILES_Y / 2)
				};

			case DOOR_DIRECTIONS.RIGHT:
				return {
					x: TILES_X - 1,
					y: Math.round(TILES_Y / 2)
				};
		}
	}

	function doorCollisionHandler(door, player) {
		if (lastUsedDoor === door._id) {
			return;
		}
		player.setZeroVelocity();
		switch (door.direction) {
			case DOOR_DIRECTIONS.TOP:
				player.y -= 325;
				_game.camera.focusOnXY(_game.camera.x + (_game.heigth * 0.5), _game.camera.y - (_game.width * 0.5));
				break;
			case DOOR_DIRECTIONS.BOTTOM:
				player.y += 325;
				_game.camera.focusOnXY(_game.camera.x + (_game.heigth * 0.5), _game.camera.y + (_game.width * 1.5));
				break;
			case DOOR_DIRECTIONS.LEFT:
				player.x -= 325;
				_game.camera.focusOnXY(_game.camera.x - (_game.heigth * 1.5), _game.camera.y + (_game.width * 0.5));
				break;
			case DOOR_DIRECTIONS.RIGHT:
				player.x += 325;
				_game.camera.focusOnXY(_game.camera.x + (_game.heigth * 1.5), _game.camera.y + (_game.width * 0.5));
				break;
		}
		lastUsedDoor = door._id;
	}

	/**
	options = {
			group: {},
			direction: {},
			spriteName: {},
			collisionGroup: {},
			collisionGroups: {},
			collisionHandler: {}
		}
	**/

	function createDoor(options) {
		var collisionHandler = options.collisionHandler || doorCollisionHandler;
		var door = options.group.create(options.position.x, options.position.y, options.spriteName);
		if (options.direction == 'LEFT' || options.direction == 'RIGHT') {
			door.angle = -90;
		}
		door.body._id = _.uniqueId('door_');
		door.body.direction = options.direction;
		door.body.setCollisionGroup(options.collisionGroup);
		door.body.collides(options.collisionGroups.playerCollisionGroup, doorCollisionHandler);
		door.body.collides(_.values(options.collisionGroups));
		door.body.fixedRotation = true;
		door.body.static = true;
	}

	var DoorsHelper = function(game, tilesX, tilesY) {
		_game = game;
		TILES_X = tilesX;
		TILES_Y = tilesY;
		return {
			getGame: function() {
				return _game;
			},
			getLastUsedRoom: function() {
				return lastUsedDoor;
			},
			getDoorPosition: getDoorPosition,
			createDoor: createDoor
		};
	};
	DoorsHelper.DOOR_DIRECTIONS = DOOR_DIRECTIONS;
	module.exports = DoorsHelper;
})();