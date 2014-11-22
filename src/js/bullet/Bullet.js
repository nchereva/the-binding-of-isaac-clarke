(function () {
	'use strict';

	var Bullet = function (velocity, weight) {
		velocity = velocity || 10;
		weight = weight || 1;
	};

	module.exports = Bullet;
})();