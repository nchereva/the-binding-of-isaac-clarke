(function() {
	'use strict';
	var _ = require('lodash');

	/*
	options = {
		tilesX:{},
		tilesY:{}
	}
	*/

	var generateBetween = function(min, max) {
		min = min || 0;
		return this.generator.between(min, max);
	};

	var generetePosition = function(options) {
		return {
			x: this.generateFromZero(options.x - 1),
			y: this.generateFromZero(options.y - 1)
		};
	};

	var generateEnemies = function(options) {
		var enemies = [];
		_.times(options.enemies.count, function() {
			enemies.push(this.generetePosition(options));
		}, this);
		return enemies;
	};

	var newMask = function(options) {
		var roomMask = [];

		var pushEmptyArray = function() {
			_.invoke(roomMask, 'push', 0);
		};

		var mapObject = function(object) {
			roomMask[object.y][object.x] = 1;
		};

		var enemies = this.generateEnemies(options);

		roomMask = _.times(options.y, _.bind(roomMask.splice, roomMask, 0, []));

		_.times(options.x, pushEmptyArray);

		_.each(enemies, mapObject);

		return roomMask;
	};

	module.exports = function(seeds) {
		this.generator = new Phaser.RandomDataGenerator(seeds);
		this.newMask = newMask;
		this.generateEnemies = generateEnemies;
		this.generateBetween = generateBetween;
		this.generetePosition = generetePosition;
		this.generateFromZero = _.curry(this.generateBetween, 2)(0); //https://lodash.com/docs#curry
		return this;
	};

})();