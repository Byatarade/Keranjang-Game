import './style.css';
import Phaser from 'phaser';
const sizes={
    width:500,
    height:500
}

const speedDown=250

const gameCanvas = document.getElementById("gameCanvas");
const gameStartDiv = document.querySelector("#gameStartDiv")
const gameStartBtn = document.querySelector("#gameStartBtn")
const gameEndDiv = document.querySelector("#gameEndDiv")
const gameWinLoseSpan = document.querySelector("#gameWinLoseSpan")
const gameEndScoreSpan = document.querySelector("#gameEndScoreSpan")
const touchBtnLeft = document.querySelector("#touchBtnLeft")
const touchBtnRight = document.querySelector("#touchBtnRight")
const playAgainBtn = document.querySelector("#playAgainBtn")

class GameScene extends Phaser.Scene{
    constructor(){
        super("scene-game");
        this.player;
        this.cursor;
        this.playerSpeed=speedDown+50;
        this.target;
        this.points=0;
        this.textScore;
        this.textTime;
        this.timedEvent;
        this.remainingTime;
        this.coinMusic;
        this.bgMusic;
        this.emitter;
        this.touchLeft=false;
        this.touchRight=false;
        /** Avoid scene.pause/resume — on some mobile browsers arcade physics does not resume gravity reliably after refresh. */
        this.playing=false;
    }
    preload(){
        this.load.image("bg","/assets/bg.png");
        this.load.image("basket","/assets/basket.png");
        this.load.image("apple","/assets/apple.png");
        this.load.image("money","/assets/money.png");
        this.load.audio("coin","/assets/coin.mp3");
        this.load.audio("bgMusic","/assets/bgMusic.mp3");
    }
    create(){
        this.coinMusic = this.sound.add("coin");
        this.bgMusic = this.sound.add("bgMusic");
        this.bgMusic.play()
        // this.bgMusic.stop()

        this.add.image(0,0,"bg").setOrigin(0,0);
        this.player=this.physics.add
            .image(0,sizes.height - 100,"basket")
            .setOrigin(0, 0);
        this.player.setImmovable(true);
        this.player.body.allowGravity=false;
        this.player.setCollideWorldBounds(true);
        // this.player.setSize(80,15).setOffset(10,70);
        this.player.setSize(this.player.width-this.player.width/4, this.player.height/6)
        .setOffset(this.player.width/10,this.player.height - this.player.height/10);

        this.target=this.physics.add
            .image(0,0,"apple")
            .setOrigin(0,0);
        this.target.setMaxVelocity(0,speedDown);
        this.physics.world.disable(this.target);
        this.physics.add.overlap(this.target,this.player,this.targetHit,this.appleCatchAllowed,this);
        this.cursor=this.input.keyboard.createCursorKeys();

        const bindTouch=(down,el)=>{
            if(!el)return;
            const set=(v)=>(e)=>{
                e.preventDefault();
                down(v);
            };
            el.addEventListener("pointerdown",set(true),{passive:false});
            el.addEventListener("pointerup",set(false));
            el.addEventListener("pointercancel",set(false));
        };
        bindTouch((v)=>{this.touchLeft=v},touchBtnLeft);
        bindTouch((v)=>{this.touchRight=v},touchBtnRight);

        this.textScore=this.add.text(sizes.width - 120,10,"Score: 0",{
            fontSize:"20px Arial",
            fill:"#ffffff",
        });
        this.textTime=this.add.text(10,10,"Remaining Time: 30",{
            fontSize:"20px Arial",
            fill:"#ffffff",
        });
        this.emitter=this.add.particles(0,0 ,"money",{
            speed:100,
            gravityY:speedDown-200,
            scale:0.04,
            duration:100,
            emitting:false
        })
        this.emitter.startFollow(this.player,this.player.width/2,this.player.height/2);
    }
    beginPlay(){
        if(this.playing)return;
        this.playing=true;
        this.timedEvent=this.time.delayedCall(30000,this.gameOver,[],this);
        this.spawnAppleAtTop();
    }
    clearRoundTimer(){
        if(this.timedEvent){
            this.time.removeEvent(this.timedEvent);
            this.timedEvent=undefined;
        }
    }
    restartMatch(){
        this.clearRoundTimer();
        this.playing=false;
        this.points=0;
        this.touchLeft=false;
        this.touchRight=false;
        this.textScore.setText("Score: 0");
        this.textTime.setText("Remaining Time: 30");
        this.player.setPosition(0,sizes.height-100);
        this.player.setVelocity(0,0);
        this.physics.world.disable(this.target);
        this.beginPlay();
    }
    spawnAppleAtTop(){
        this.target.setPosition(this.getRandomX(),0);
        this.physics.world.enableBody(this.target);
        const b=this.target.body;
        if(b){
            b.allowGravity=true;
            b.setVelocity(0,0);
            b.setAcceleration(0,0);
        }
    }
    appleCatchAllowed(){
        if(!this.playing)return false;
        const tb=this.target.body;
        const pb=this.player.body;
        if(!tb||!pb||!tb.enable)return false;
        return tb.bottom>=pb.top-4;
    }
    update(){
        if(this.playing&&this.timedEvent){
            this.remainingTime=this.timedEvent.getRemainingSeconds();
            this.textTime.setText(`Remaining Time: ${Math.round(this.remainingTime).toString()}`);
        }
        if(!this.playing)return;

        if (this.target.y >= sizes.height){
            this.spawnAppleAtTop();
        }

        const left=this.cursor.left.isDown||this.touchLeft;
        const right=this.cursor.right.isDown||this.touchRight;
        if(left&&!right){
            this.player.setVelocityX(-this.playerSpeed);
        }else if(right&&!left){
            this.player.setVelocityX(this.playerSpeed);
        }else{
            this.player.setVelocityX(0);
        }
    }
    getRandomX(){
        return Math.floor(Math.random()*480);
    }
    targetHit(){
        if(!this.playing)return;
        this.coinMusic.play()
        this.emitter.start()
        this.spawnAppleAtTop();
        this.points++;
        this.textScore.setText(`Score: ${this.points}`);
    }
    gameOver(){
        this.playing=false;
        this.clearRoundTimer();
        this.player.setVelocity(0,0);
        this.physics.world.disable(this.target);
        gameEndScoreSpan.textContent=this.points;
        gameWinLoseSpan.textContent=this.points>=10?"You Win!":"You Lose!";
        gameEndDiv.style.display="flex";
    }
}

const config = {
    type:Phaser.WEBGL,
    width:sizes.width,
    height:sizes.height,
    canvas:gameCanvas,
    physics:{
        default:"arcade",
        arcade:{
            gravity:{y:speedDown},
            debug:true
        }
    },
    scene:[GameScene]
}
const game = new Phaser.Game(config);

const startGame=()=>{
    if(gameStartDiv.style.display==="none")return;
    gameStartDiv.style.display="none";
    const scene=game.scene.getScene("scene-game");
    if(scene&&typeof scene.beginPlay==="function"){
        scene.beginPlay();
    }
};
gameStartBtn.addEventListener("click",startGame);
gameStartBtn.addEventListener("touchend",startGame,{passive:true});

const playAgain=()=>{
    if(!playAgainBtn||gameEndDiv.style.display==="none")return;
    gameEndDiv.style.display="none";
    const scene=game.scene.getScene("scene-game");
    if(scene&&typeof scene.restartMatch==="function"){
        scene.restartMatch();
    }
};
if(playAgainBtn){
    playAgainBtn.addEventListener("click",playAgain);
    playAgainBtn.addEventListener("touchend",playAgain,{passive:true});
}