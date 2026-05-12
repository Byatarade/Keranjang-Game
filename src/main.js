import './style.css';
import Phaser from 'phaser';

const sizes = {
    width: 500,
    height: 500
};

const speedDown = 250;

const gameCanvas = document.getElementById("gameCanvas");
const gameStartDiv = document.querySelector("#gameStartDiv");
const gameStartBtn = document.querySelector("#gameStartBtn");
const gameEndDiv = document.querySelector("#gameEndDiv");
const gameWinLoseSpan = document.querySelector("#gameWinLoseSpan");
const gameEndScoreSpan = document.querySelector("#gameEndScoreSpan");
const gamePlayAgainBtn = document.querySelector("#gamePlayAgainBtn");
const touchBtnLeft = document.querySelector("#touchBtnLeft");
const touchBtnRight = document.querySelector("#touchBtnRight");

/* ───── global touch state (bound once, never duplicated) ───── */
let touchLeft = false;
let touchRight = false;

function bindTouchOnce(el, setter) {
    if (!el) return;
    const handler = (v) => (e) => {
        e.preventDefault();
        setter(v);
    };
    el.addEventListener("pointerdown", handler(true), { passive: false });
    el.addEventListener("pointerup", handler(false));
    el.addEventListener("pointercancel", handler(false));
    el.addEventListener("pointerleave", handler(false)); // safety: if finger slides off
}

bindTouchOnce(touchBtnLeft, (v) => { touchLeft = v; });
bindTouchOnce(touchBtnRight, (v) => { touchRight = v; });

class GameScene extends Phaser.Scene {
    constructor() {
        super("scene-game");
        this.player;
        this.cursor;
        this.playerSpeed = speedDown + 50;
        this.target;
        this.points = 0;
        this.textScore;
        this.textTime;
        this.timedEvent;
        this.remainingTime;
        this.coinMusic;
        this.bgMusic;
        this.emitter;
        this.isGameOver = false;
    }

    preload() {
        this.load.image("bg", "/assets/bg.png");
        this.load.image("basket", "/assets/basket.png");
        this.load.image("apple", "/assets/apple.png");
        this.load.image("money", "/assets/money.png");
        this.load.audio("coin", "/assets/coin.mp3");
        this.load.audio("bgMusic", "/assets/bgMusic.mp3");
    }

    create() {
        /* ── reset state on each (re)start ── */
        this.points = 0;
        this.isGameOver = false;

        this.coinMusic = this.sound.add("coin");
        this.bgMusic = this.sound.add("bgMusic", { loop: true });

        /* ── background ── */
        this.add.image(0, 0, "bg").setOrigin(0, 0);

        /* ── player / basket ── */
        this.player = this.physics.add
            .image(sizes.width / 2, sizes.height - 100, "basket")
            .setOrigin(0, 0);
        this.player.setImmovable(true);
        this.player.body.allowGravity = false;
        this.player.setCollideWorldBounds(true);
        this.player.setSize(
            this.player.width - this.player.width / 4,
            this.player.height / 6
        ).setOffset(
            this.player.width / 10,
            this.player.height - this.player.height / 10
        );

        /* ── apple target ── */
        this.target = this.physics.add
            .image(this.getRandomX(), 0, "apple")
            .setOrigin(0, 0);
        this.target.setMaxVelocity(0, speedDown);

        this.physics.add.overlap(this.target, this.player, this.targetHit, null, this);

        /* ── keyboard ── */
        this.cursor = this.input.keyboard.createCursorKeys();

        /* ── HUD ── */
        this.textScore = this.add.text(sizes.width - 120, 10, "Score: 0", {
            fontSize: "20px Arial",
            fill: "#ffffff",
        });
        this.textTime = this.add.text(10, 10, "Remaining Time: 30", {
            fontSize: "20px Arial",
            fill: "#ffffff",
        });

        /* ── timer ── */
        this.timedEvent = this.time.delayedCall(30000, this.gameOver, [], this);

        /* ── particles ── */
        this.emitter = this.add.particles(0, 0, "money", {
            speed: 100,
            gravityY: speedDown - 200,
            scale: 0.04,
            duration: 100,
            emitting: false
        });
        this.emitter.startFollow(this.player, this.player.width / 2, this.player.height / 2);

        /* ── pause until player clicks start (only first time) ── */
        if (gameStartDiv.style.display !== "none") {
            this.scene.pause("scene-game");
        } else {
            // restarting: start music immediately
            this.bgMusic.play();
        }
    }

    update() {
        if (this.isGameOver) return;

        this.remainingTime = this.timedEvent.getRemainingSeconds();
        this.textTime.setText(`Remaining Time: ${Math.round(this.remainingTime).toString()}`);

        /* ── reset apple if it goes past the bottom ── */
        if (this.target.y >= sizes.height) {
            this.target.setY(0);
            this.target.setX(this.getRandomX());
        }

        /* ── movement: keyboard OR touch ── */
        const left = this.cursor.left.isDown || touchLeft;
        const right = this.cursor.right.isDown || touchRight;
        if (left && !right) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (right && !left) {
            this.player.setVelocityX(this.playerSpeed);
        } else {
            this.player.setVelocityX(0);
        }
    }

    getRandomX() {
        return Math.floor(Math.random() * (sizes.width - 40));
    }

    targetHit() {
        this.coinMusic.play();
        this.emitter.start();
        this.target.setY(0);
        this.target.setX(this.getRandomX());
        this.points++;
        this.textScore.setText(`Score: ${this.points}`);
    }

    gameOver() {
        this.isGameOver = true;

        /* stop music & physics — but do NOT destroy the game */
        this.bgMusic.stop();
        this.physics.pause();
        this.timedEvent.remove(false);
        this.player.setVelocityX(0);

        /* update UI */
        gameEndScoreSpan.textContent = this.points;
        if (this.points >= 10) {
            gameWinLoseSpan.textContent = "Kamu Menang! 🎉";
        } else {
            gameWinLoseSpan.textContent = "Kamu Kalah 😢";
        }
        gameEndDiv.style.display = "flex";
    }
}

/* ───── Phaser config ───── */
const config = {
    type: Phaser.WEBGL,
    width: sizes.width,
    height: sizes.height,
    canvas: gameCanvas,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: speedDown },
            debug: false
        }
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config);

/* ───── Start button ───── */
gameStartBtn.addEventListener("click", () => {
    gameStartDiv.style.display = "none";
    const scene = game.scene.getScene("scene-game");
    if (scene && scene.bgMusic) {
        scene.bgMusic.play();
    }
    game.scene.resume("scene-game");
});

/* ───── Play Again button ───── */
gamePlayAgainBtn.addEventListener("click", () => {
    gameEndDiv.style.display = "none";
    /* fully restart the scene — fresh apple, fresh timer, fresh score */
    game.scene.stop("scene-game");
    game.scene.start("scene-game");
});