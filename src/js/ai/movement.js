(function() {
	var sqrt = Math.sqrt,
		sqr = function(x) {
			return Math.pow(x, 2);
		};
	module.exports = function(object, target, speed, immediate) {
		this.object = object;
		this.speed = speed || 10;
		this.immediate = immediate;
		this.move = function() {
			var dx = target.position.x - this.object.position.x;
			var dy = target.position.y - this.object.position.y;
			// var distance = sqrt(sqr(dx)+sqr(dy));
			var distance = Phaser.Point.distance(target, this.object, true)
			var vx = speed * dx / distance;
			var vy = speed * dy / distance;
			// var vx = sqrt(sqr(speed, 2) / (1 + sqr(dx / dy, 2)));
			// var vy = sqrt(sqr(speed, 2) / (1 + sqr(dy / dx, 2)));
			this.object.body.velocity.x = vx;
			this.object.body.velocity.y = vy;
		}
		if (this.immediate) {
			this.move();
		}
	}
})();