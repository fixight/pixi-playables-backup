import './style.css';
import * as PIXI from 'pixi.js';

import wallImg from './assets/wall.png';
import shelfImg from './assets/shelf.png';
import amogusImg from './assets/imp_0.png';
import ballImg from './assets/ball.png';
import imposterImg from './assets/imposter.png';
import imposterData from './assets/imposter.json';
import chairImg from './assets/chair.png';
import dustImg from './assets/dust.png';
import dustData from './assets/dust.json';
import decorImg from './assets/decor1.png';
import startImg from './assets/start.png';

import bgmSrc from './assets/bg.mp3'; 
import jumpSrc from './assets/jump.mp3';

const getAssetPath = (src) => (src && src.default) ? src.default : src;

// СПЕЦИАЛЬНАЯ ФУНКЦИЯ ДЛЯ FACEBOOK
// Загружает картинку из base64 через HTMLDOM, чтобы обойти блокировку fetch()
const loadTextureDirectly = (src) => {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            resolve(PIXI.Texture.from(img));
        };
        img.onerror = (err) => {
            console.error("Image load error:", err);
            reject(new Error("Failed to load image"));
        };
        img.src = getAssetPath(src);
    });
};

const STORE_URL = "https://play.google.com/store/apps/details?id=com.your.game"; 
const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;

let isAnimating = false;
let hasInteracted = false;
let currentState = 'shelf';

function openStore() {
    console.log("Call to Action: Open Store");

    PIXI.Ticker.shared.stop(); 
    
    if (typeof FbPlayableAd !== 'undefined') {
        FbPlayableAd.onCTAClick();
    }
    if (typeof mraid !== "undefined") {
        if (mraid.open) mraid.open(STORE_URL);
        else window.open(STORE_URL, "_blank");
    } else {
        window.open(STORE_URL, "_blank");
    }
}

const init = async () => {
    try {
        const app = new PIXI.Application();
        await app.init({ 
            width: window.innerWidth, 
            height: window.innerHeight, 
            backgroundColor: 0x87CEEB, 
            autoDensity: true,
            resolution: window.devicePixelRatio || 1
        });
        document.body.appendChild(app.canvas);

        app.stage.eventMode = 'static';

        const bgmPath = getAssetPath(bgmSrc);
        const bgm = bgmPath ? new Audio(bgmPath) : null;
        if (bgm) { bgm.loop = true; bgm.volume = 0.4; }

        const jumpPath = getAssetPath(jumpSrc);
        const jumpSfx = jumpPath ? new Audio(jumpPath) : null;

        const playSound = (sound) => {
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log("Audio blocked:", e));
            }
        };

        // ИСПОЛЬЗУЕМ loadTextureDirectly ВМЕСТО PIXI.Assets.load
        const dustTexture = await loadTextureDirectly(dustImg);
        if (dustData && dustData.meta) delete dustData.meta.image; // Защита от скрытых fetch запросов
        const dustspritesheet = new PIXI.Spritesheet(dustTexture, dustData);
        await dustspritesheet.parse();
        const dustframeKeys = Object.keys(dustspritesheet.textures).sort((a, b) => {
          return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10);
        });

        const baseTexture = await loadTextureDirectly(imposterImg);
        if (imposterData && imposterData.meta) delete imposterData.meta.image; // Защита от скрытых fetch запросов
        const spritesheet = new PIXI.Spritesheet(baseTexture, imposterData);
        await spritesheet.parse();
        const frameKeys = Object.keys(spritesheet.textures).sort((a, b) => {
            return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10);
        });

        const [wallTex, shelfTex, amogusTex, ballTex, chairTex, decorTex, startTex] = await Promise.all([
            loadTextureDirectly(wallImg),
            loadTextureDirectly(shelfImg),
            loadTextureDirectly(amogusImg),
            loadTextureDirectly(ballImg),
            loadTextureDirectly(chairImg),
            loadTextureDirectly(decorImg),
            loadTextureDirectly(startImg),
        ]);

        const gameContainer = new PIXI.Container();
        app.stage.addChild(gameContainer);

        const bgWall = new PIXI.TilingSprite({ 
            texture: wallTex, 
            width: GAME_WIDTH + 400,
            height: GAME_HEIGHT 
        });
        bgWall.anchor.set(0.5);
        bgWall.x = GAME_WIDTH / 2;
        bgWall.y = GAME_HEIGHT / 2;
        gameContainer.addChild(bgWall);

        const shelf = new PIXI.Sprite({ texture: shelfTex });
        shelf.anchor.set(0, 0.5);
        shelf.x = 100; shelf.y = 650; 
        gameContainer.addChild(shelf);

        const chair = new PIXI.Sprite({ texture: chairTex });
        chair.anchor.set(0.5, 0.5);
        chair.scale.set(1);
        chair.x = 1000; chair.y = 830;
        gameContainer.addChild(chair);

        const ball = new PIXI.Sprite({ texture: ballTex });
        ball.anchor.set(0.5, 1);
        ball.x = 630; ball.y = 950; 
        gameContainer.addChild(ball);

        const decor = new PIXI.Sprite({ texture: decorTex });
        decor.anchor.set(0.5, 1);
        decor.x = 1290; decor.y = 950; 
        gameContainer.addChild(decor);

        const start = new PIXI.Sprite({ texture: startTex });
        start.anchor.set(0.5, 1);
        start.x = 1690; start.y = 750; 
        gameContainer.addChild(start);

        const amogusFrames = frameKeys.map(key => spritesheet.textures[key]);
        const dustFrames = dustframeKeys.map(key => dustspritesheet.textures[key]);
        const jumpFrames = amogusFrames.slice(12, 19);
        const fallDustFrames = dustFrames; 

        const amogusContainer = new PIXI.Container();
        amogusContainer.x = shelf.x + (shelf.width * 0.7);
        amogusContainer.y = shelf.y - (shelf.height * 0.3);
        gameContainer.addChild(amogusContainer);

        const amogus = new PIXI.AnimatedSprite(jumpFrames);
        amogus.anchor.set(0.5, 0.5);
        amogus.y = -amogus.height / 2;
        amogus.animationSpeed = 0.25;
        amogusContainer.addChild(amogus);
        amogus.play();

        function jumpToBall() {
            if (isAnimating || currentState !== 'shelf') return;
            
            playSound(jumpSfx);
            isAnimating = true;
            amogus.textures = jumpFrames;
            amogus.gotoAndPlay(0);

            let progress = 0;
            const jumpDuration = 550;
            const startX = amogusContainer.x;
            const startY = amogusContainer.y;
            const endX = ball.x;
            const endY = ball.y - (ball.height * 0.55);
            const jumpArcHeight = 250; 

            const flyLoop = (ticker) => {
                progress += ticker.deltaMS / jumpDuration;
                if (progress >= 1) {
                    progress = 1;
                    app.ticker.remove(flyLoop);
                    
                    amogus.stop();
                    amogus.angle = 0;
                    currentState = 'ball';
                    isAnimating = false;
                    
                    deform(ball, 0.15, 150);
                    setTimeout(() => jumpToChair(2), 100);
                    return;
                }
                amogusContainer.x = startX + (endX - startX) * progress;
                const arcBase = 4 * progress * (1 - progress);
                amogusContainer.y = startY + (endY - startY) * progress - (Math.pow(arcBase, 0.75) * jumpArcHeight);
                amogus.angle = 360 * (1 - Math.pow(1 - progress, 3));
            };
            app.ticker.add(flyLoop);
        }

        function jumpToChair(rotations) {
            if (isAnimating) return;
            isAnimating = true;
            amogus.play();
            playSound(jumpSfx);
            
            let progress = 0;
            const jumpDuration = 750;
            const startX = amogusContainer.x;
            const startY = amogusContainer.y;
            const endX = chair.x;
            const endY = chair.y - chair.height / 2.5;
            const jumpArcHeight = 350;

            const flyLoop = (ticker) => {
                progress += ticker.deltaMS / jumpDuration;
                if (progress >= 1) {
                    progress = 1;
                    app.ticker.remove(flyLoop);
                    isAnimating = false;
                    currentState = 'chair';
                    amogus.angle = 0;
                    deform(chair, 0.1, 140);

                    if (fallDustFrames && fallDustFrames.length > 0) {
                        const newDust = new PIXI.AnimatedSprite(fallDustFrames);
                        newDust.anchor.set(0.5, 1);
                        newDust.y = 30;
                        newDust.animationSpeed = 0.45;
                        newDust.loop = false;
                        newDust.onComplete = () => newDust.destroy();
                        newDust.play();
                        amogusContainer.addChild(newDust);
                    }
                }
                amogusContainer.x = startX + (endX - startX) * progress;
                const arcBase = 4 * progress * (1 - progress);
                amogusContainer.y = startY + (endY - startY) * progress - (Math.pow(arcBase, 0.75) * jumpArcHeight);
                amogus.angle = 360 * (1 - Math.pow(1 - progress, 3)) * rotations;
            };
            app.ticker.add(flyLoop);
        }

        function deform(object, strength, duration) {
            let progress = 0;
            const baseScaleX = object.scale.x;
            const baseScaleY = object.scale.y;
            const deformLoop = (ticker) => {
                progress += ticker.deltaMS / duration;
                if (progress >= 1) {
                    object.scale.set(baseScaleX, baseScaleY);
                    app.ticker.remove(deformLoop);
                    return;
                }
                const s = Math.sin(progress * Math.PI);
                object.scale.set(baseScaleX + (s * strength), baseScaleY - (s * strength));
            };
            app.ticker.add(deformLoop);
        }

        app.stage.hitArea = app.screen;
        app.stage.on('pointerdown', () => {
            if (!hasInteracted) {
                hasInteracted = true;
                jumpToBall();
                if (bgm) bgm.play().catch(e => console.log("Music play failed", e));
            } else {
                openStore();
            }
        });

        function resize() {
            const w = window.innerWidth;
            const h = window.innerHeight;

            app.renderer.resize(w, h);

            app.stage.hitArea = new PIXI.Rectangle(0, 0, w, h);

            let scale = Math.max(w / GAME_WIDTH, h / GAME_HEIGHT);
            gameContainer.scale.set(scale);

            gameContainer.y = (h - GAME_HEIGHT * scale) / 2;

            if (h > w) {
                 gameContainer.y = h - (GAME_HEIGHT * scale);
            }

            const cameraOffsetRatio = 0.35; 
            let targetX = (w * cameraOffsetRatio) - (amogusContainer.x * scale);
            const worldWidthScaled = GAME_WIDTH * scale;
            const minX = w - worldWidthScaled; 
            const maxX = 0;

            if (worldWidthScaled < w) {
                targetX = (w - worldWidthScaled) / 2;
            } else {
                targetX = Math.max(minX, Math.min(maxX, targetX));
            }
            gameContainer.x = targetX;
        }

        app.ticker.add((ticker) => {
            const scale = gameContainer.scale.x;
            const screenWidth = app.renderer.width; 

            const cameraOffsetRatio = 0.35; 
            let targetX = (screenWidth * cameraOffsetRatio) - (amogusContainer.x * scale);
            const worldWidthScaled = GAME_WIDTH * scale;
            const minX = screenWidth - worldWidthScaled; 
            const maxX = 0;

            if (worldWidthScaled < screenWidth) {
                targetX = (screenWidth - worldWidthScaled) / 2;
            } else {
                targetX = Math.max(minX, Math.min(maxX, targetX));
            }

            const smoothness = 0.1; 
            gameContainer.x += (targetX - gameContainer.x) * smoothness * ticker.deltaTime;
        });

        window.addEventListener('resize', resize);
        
        resize();
        
    } catch (e) {
        // Если Facebook все равно что-то заблокирует, вы увидите это окно с ошибкой
        alert("Playable Error: " + e.message);
        console.error(e);
    }
};

init();