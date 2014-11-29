(function() {

	var _ = require('lodash');
	var DEFAULTS = {
		range: 300,
		shotSpeed: 300,
		fireRate: 1,
		fireDelay: 2000,
		immediate: true,
		fireDisabled: false,
		difficulty: 1,
		infelicity: 0.8
	}

	module.exports = function(options) {
		_.assign(this, _.defaults(_.clone(DEFAULTS), options));
		if (options.difficulty) this.difficulty = options.difficulty;
		this._id = _.uniqueId(this.object._id + '_')


		if (!this.bulletsGroup || !this.bulletCollisionGroup || !this.targetCollisionGroup) {
			console.warn('No collision or group provided or targetCollisionGroup');
			return;
		}

		this.shoot = function() {
			if (!this.object.alive) return;
			var dx = this.target.position.x - this.object.position.x;
			var dy = this.target.position.y - this.object.position.y;
			var distance = Phaser.Point.distance(this.target, this.object, true)
			if (distance > this.range) return;
			var vx = this.shotSpeed * dx / distance;
			var vy = this.shotSpeed * dy / distance;
			var bullet = this.fire(vx, vy);
		}

		this.startShooting = function() {
			this.fireRateTimeout = setTimeout(function() {
					this.fireDisabled = false;
				}.bind(this),
				this.fireDelay / this.fireRate
			);
		}

		if (this.immediate) {
			this.startShooting();
		}

		this.stopShooting = function stopShooting() {
			clearTimeout(this.fireRateTimeout);
		};

		this.fire = function(vx, vy) {
			var infelicity = Math.random() * (1 - this.infelicity) + this.infelicity;
			if (!this.fireDisabled) {
				this.fireDisabled = true;

				var bullet,
					bulletVelocity,
					bulletPosition = _.clone(this.object.position);
				if (this.difficulty > 1) {
					bulletVelocity = {
						x: vx + this.target.body.velocity.x * infelicity,
						y: vy + this.target.body.velocity.y * infelicity
					};
				} else {
					bulletVelocity = {
						x: vx,
						y: vy
					};
				}
				// switch (direction) {
				// 	case ('left'):
				// 		bulletPosition.x -= 30;
				// 		bulletVelocity.x += -300;
				// 		this.object.body.velocity.x += 200;
				// 		break;
				// 	case ('right'):
				// 		bulletPosition.x += 30;
				// 		bulletVelocity.x += 300;
				// 		this.object.body.velocity.x += -200;
				// 		break;
				// 	case ('top'):
				// 		bulletPosition.y -= 30;
				// 		bulletVelocity.y += -300;
				// 		this.object.body.velocity.y += 200;
				// 		break;
				// 	case ('bottom'):
				// 		bulletPosition.y += 30;
				// 		bulletVelocity.y += 300;
				// 		this.object.body.velocity.y += -200;
				// 		break;
				// 	default:
				// 		console.log('No playerFire direction');
				// 		break;
				// }

				bullet = this.bulletsGroup.create(bulletPosition.x, bulletPosition.y, 'bullet');
				bullet.body.velocity.x = bulletVelocity.x;
				bullet.body.velocity.y = bulletVelocity.y;
				bullet.body.setCircle(10);
				bullet.body.setCollisionGroup(this.bulletCollisionGroup);
				bullet.body.collides(this.targetCollisionGroup, function(bul, en) {
					if (bul.sprite.alive && en.sprite.alive) {
						bul.sprite.kill();
					}
				}, this);
				this.startShooting();
			}
		}
		this.object.events.onKilled.add(this.stopShooting.bind(this));
	}
})();