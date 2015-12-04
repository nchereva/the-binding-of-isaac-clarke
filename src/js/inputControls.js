/**
 * Created by Dzmitry_Siver on 5/20/2015.
 */
(function () {
	var game,
		gamepad,
		player,
		playerVelocity,
		keyboard,
		keyboardControls = {},
		pad1;

	module.exports = function (options) {
		game = options.game;
		player = options.player;

		playerVelocity = player.body.velocity;
		keyboard = game.input.keyboard;
		pad1 = game.input.gamepad.pad1;
		gamepad = Phaser.Gamepad;


		this.toggleFullscreen = function() {
			/**
			 * @desc Toggles fullscreen
			 */
			if (game.scale.isFullScreen) {
				game.scale.stopFullScreen();
			} else {
				game.scale.startFullScreen(false); // false = retain pixel art, true = smooth art
			}
		};

		this.move = function() {
			/**
			 * @desc Adjusts player velocity based on key pressed
			 */

			if (keyboardControls['w'].isDown || pad1.isDown(gamepad.XBOX360_DPAD_UP || pad1.axis(gamepad.XBOX360_STICK_LEFT_Y) < -0.1)) {
				playerVelocity.y += -5;
			} else if (keyboardControls['s'].isDown || pad1.isDown(gamepad.XBOX360_DPAD_DOWN || pad1.axis(gamepad.XBOX360_STICK_LEFT_Y) > 0.1)) {
				playerVelocity.y += 5;
			}
			if (keyboardControls['a'].isDown || pad1.isDown(gamepad.XBOX360_DPAD_LEFT || pad1.axis(gamepad.XBOX360_STICK_LEFT_X) < -0.1)) {
				playerVelocity.x += -5;
			} else if (keyboardControls['d'].isDown || pad1.isDown(gamepad.XBOX360_DPAD_RIGHT || pad1.axis(gamepad.XBOX360_STICK_LEFT_X) > 0.1)) {
				playerVelocity.x += 5;
			}
		};

		keyboardControls['w'] = keyboard.addKey(Phaser.Keyboard.W);
		keyboardControls['a'] = keyboard.addKey(Phaser.Keyboard.A);
		keyboardControls['s'] = keyboard.addKey(Phaser.Keyboard.S);
		keyboardControls['d'] = keyboard.addKey(Phaser.Keyboard.D);
		keyboardControls['f'] = keyboard.addKey(Phaser.Keyboard.F);

		keyboardControls['f'].onDown.add(this.toggleFullscreen);
	}

})();
