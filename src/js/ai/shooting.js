(function () {

	var _ = require('lodash');
	var DEFAULTS = {
		range: 300,
		shotSpeed: 300,
		fireRate: 0.5,
		fireDelay: 1000,
		immediate: true,
		fireDisabled: false,
		difficulty: 1,
		fireDamage: 1,
		infelicity: 0.8
	};
	var blinkingTime = 200;

	module.exports = function (options) {
		_.assign(this, _.defaults(_.clone(DEFAULTS), options));
		if (options.difficulty) this.difficulty = options.difficulty;
		this._id = _.uniqueId(this.object._id + '_');


		if (!this.bulletsGroup || !this.bulletCollisionGroup || !this.targetCollisionGroup) {
			console.warn('No collision or group provided or targetCollisionGroup');
			return;
		}

		this.shoot = function () {
			if (!this.object.alive) return;
			var dx = this.target.position.x - this.object.position.x;
			var dy = this.target.position.y - this.object.position.y;
			var distance = Phaser.Point.distance(this.target, this.object, true);
			if (distance > this.range) return;
			var vx = this.shotSpeed * dx / distance;
			var vy = this.shotSpeed * dy / distance;
			var bullet = this.fire(vx, vy);
		};

		this.startShooting = function () {
			this.fireRateTimeout = setTimeout(function () {
					this.fireDisabled = false;
				}.bind(this),
				this.fireDelay / this.fireRate
			);
		};

		//if (this.immediate) {
		//	setTimeout(this.startShooting(),500);
		//}

		this.stopShooting = function stopShooting() {
			clearTimeout(this.fireRateTimeout);
		};

		this.fire = function (vx, vy) {
			if (!this.fireDisabled) {
				var infelicity = Math.random() * (1 - this.infelicity) + this.infelicity;
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

				bullet = this.bulletsGroup.create(bulletPosition.x, bulletPosition.y, 'bullet');
				bullet.body.velocity.x = bulletVelocity.x;
				bullet.body.velocity.y = bulletVelocity.y;
				bullet.body.setCircle(10);
				bullet.body.setCollisionGroup(this.bulletCollisionGroup);
				bullet.body.collides(this.playerCollisionGroup, function (bul, target) {
					if (bul.sprite.alive && target.sprite.alive) {
						bul.sprite.kill();
						if (target.sprite.invulnerable == false) {
							target.sprite.invulnerable = true;
							target.sprite.damage(this.fireDamage);
							target.sprite.game.onPlayerDamage.dispatch(this); // onDamage event
							target.sprite.game.add.tween(target.sprite)
								.to({alpha: 0.3}, blinkingTime, Phaser.Easing.Linear.None(), false, 0,
								target.sprite.invulnerableDuration / blinkingTime - 2)
								.to({alpha: 1}, blinkingTime, Phaser.Easing.Linear.None()).start();
							setTimeout(function () {
								target.sprite.invulnerable = false;
							}, target.sprite.invulnerableDuration);
						}
					}
				}, this);
				bullet.body.collides(this.targetCollisionGroup, function (bul, target) {
					if (bul.sprite.alive && target.sprite.alive) {
						bul.sprite.kill();
					}
				}, this);
				this.startShooting();
			}
		};
		this.object.events.onKilled.add(this.stopShooting.bind(this));
	}
})();