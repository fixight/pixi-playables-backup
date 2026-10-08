import './style.css';
import * as PIXI from 'pixi.js';
import { Filter, GlProgram } from 'pixi.js';
import BGIMG from'./assets/background.jpg';
import lukIMG from'./assets/luk.png';
import goldLukIMG from'./assets/goldLuk.png';
import moneyIMG from'./assets/euro.webp';
import bareerIMG from'./assets/bareer.webp';
import yellowCarIMG from'./assets/yellowCar.png';
import playIMG from'./assets/playButton.png';
import logoImg from'./assets/logo.png';
import balanceImg from'./assets/balance.png';
import bonusIMG from './assets/Bonus.png';
import phoneIMG from './assets/Phone.webp';
import notifyIMG from './assets/Notify.png';
import endBGIMG from './assets/bgEnd.jpeg';
import chickenLogoIMG from './assets/ChickenLogo.webp';
import downloadButtonIMG from './assets/Download.webp';
import jump from './assets/jumpSound.wav';
import tormoz from './assets/tormoz.mp3';
import barSound from './assets/barSound.mp3';
import sms from './assets/sms.mp3';
import bgmMP3 from './assets/bgSound.mp3';
import handIMG from './assets/Hand.webp';
import pPoint from './assets/PlayerPointer.webp';

let isAudioUnlocked = false;

let isIronSoutce = false;

function unlockAudioOnFirstTouch() {
    if (isAudioUnlocked) return;

    // 1. Создаем пустой беззвучный звук
    const silentAudio = new Audio();
    silentAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"; // Пустой 0.1 сек звук в base64
    
    // 2. Пытаемся его проиграть. 
    // Если браузер разрешит - значит аудиосистема "разблокирована" для этой сессии
    silentAudio.play().then(() => {
        isAudioUnlocked = true;
        console.log("🔊 Аудиосистема разблокирована!");
        
        // 3. Запускаем фоновую музыку
        startBGM();

        // 4. Удаляем слушатели, они больше не нужны
        document.removeEventListener('touchstart', unlockAudioOnFirstTouch, true);
        document.removeEventListener('touchend', unlockAudioOnFirstTouch, true);
        document.removeEventListener('click', unlockAudioOnFirstTouch, true);
    }).catch(err => {
        // Если заблокировано (пользователь свайпнул, а не кликнул) - попробуем в следующий раз
        console.warn("Попытка разблокировки аудио отклонена", err);
    });
}

// Вешаем слушатели на весь HTML документ
document.addEventListener('touchstart', unlockAudioOnFirstTouch, { once: true, passive: true });
document.addEventListener('touchend', unlockAudioOnFirstTouch, { once: true, passive: true });
document.addEventListener('click', unlockAudioOnFirstTouch, { once: true, passive: true });




const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920; 

function openStore() {
    PIXI.Ticker.shared.stop(); 
    pauseGame();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    let finalUrl = null;
    if (typeof buildConfig !== "undefined") {
        finalUrl = isIOS ? buildConfig.appStoreUrl : buildConfig.googlePlayUrl;
        if (!finalUrl) finalUrl = buildConfig.googlePlayUrl || buildConfig.appStoreUrl;
    }

    console.log("openStore →", finalUrl);

    // Facebook — обязательно первым
    if (typeof window.FbPlayableAd !== 'undefined') {
        window.FbPlayableAd.onCTAClick();
        return;
    }

    // Unity
    if (typeof gameplayapi !== 'undefined') {
        gameplayapi.gameplayStop();
        gameplayapi.openStoreLink();
        return;
    }

    // MRAID (ironSource, Moloco)
    if (typeof mraid !== 'undefined') {
        mraid.open(finalUrl);
        return;
    }

    // Fallback
    window.open(finalUrl, "_blank");
}

const getAssetPath = (src) => (src && src.default) ? src.default : src;

const loadTextureDirectly = (src) => {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        // ВАЖНО: Удалили img.crossOrigin = 'anonymous'; !!!
        img.onload = () => resolve(PIXI.Texture.from(img));
        img.onerror = (err) => reject(new Error("Failed to load image"));
        img.src = getAssetPath(src);
    });
};



let isGameMuted = false;
const activeSounds = new Set();

let bgmAudio = null;
let isBgmStarted = false; // Флаг, чтобы не запускать музыку 100 раз при каждом клике

function playSound(soundUrl, volume = 1.0) {
    if (isGameMuted || !soundUrl) return; 

    const sfx = new Audio(soundUrl);
    sfx.volume = volume;
    activeSounds.add(sfx);

    sfx.onended = () => activeSounds.delete(sfx);
    sfx.onerror = () => activeSounds.delete(sfx);

    sfx.play().catch(e => {
        console.warn("Звук заблокирован автоплеем браузера", e);
        activeSounds.delete(sfx);
    });
}



function startBGM() {
    if (isGameMuted || isBgmStarted) return;
    
    isBgmStarted = true;
    bgmAudio = new Audio(bgmMP3); // Убедись, что у тебя есть импорт фоновой музыки
    bgmAudio.volume = 0.3;
    bgmAudio.loop = true;
    bgmAudio.play().catch(e => {
        console.warn("Фоновая музыка заблокирована", e);
        isBgmStarted = false; 
    });
}

function pauseGame() {
    isGameMuted = true;
    PIXI.Ticker.shared.stop(); 
    
    // Ставим на паузу все звуки
    activeSounds.forEach(sfx => sfx.pause());
    
    // Ставим на паузу BGM
    if (bgmAudio) bgmAudio.pause();
}

function resumeGame() {
    isGameMuted = false;
    PIXI.Ticker.shared.start(); 
    
    // Возобновляем звуки
    activeSounds.forEach(sfx => sfx.play().catch(() => {}));
    
    // Возобновляем BGM
    if (bgmAudio && isBgmStarted) bgmAudio.play().catch(() => {});
}
// Слушатели сворачивания игры
document.addEventListener("visibilitychange", () => document.hidden ? pauseGame() : resumeGame());
if (typeof mraid !== "undefined") {
    mraid.addEventListener("viewableChange", (isViewable) => isViewable ? resumeGame() : pauseGame());
}

function getT(key) {
    const defaultTranslations = { 
        "win": "WIN", 
        "install": "INSTALL NOW", 
        "disclaimer": "For illustrative purposes only",
        "claim": "CLAIM",
        "cashout": "CASH OUT",
        "welcome": "WELCOME BONUS",
        "play" : "PLAY",
        "you_won": "YOU WON!",
        "go": "GO",
        "download": "DOWNLOAD",
        "deposit_bonus": "DEPOSIT BONUS",
        "free_spins": "FREE SPINS"


    };

    if (typeof buildConfig !== "undefined" && buildConfig.translations) {
        const lang = buildConfig.language || "EN";
        if (buildConfig.translations[lang] && buildConfig.translations[lang][key]) {
            return buildConfig.translations[lang][key];
        }
    }
    return defaultTranslations[key] || key;
}

    const [
        backgroundTex, lukTex, goldLukTex, moneyTex, bareerTex, yellowCarTex,
        playButtonTex, logoTex, balanceTex, bonusTex, phoneTex, notifTex, bgEndTex, chickenLogoTex, downloadButtonTex,
        handTex , pPointerTex
    ] = await Promise.all([
        loadTextureDirectly(BGIMG), 
        loadTextureDirectly(lukIMG),
        loadTextureDirectly(goldLukIMG), 
        loadTextureDirectly(moneyIMG),
        loadTextureDirectly(bareerIMG), 
        loadTextureDirectly(yellowCarIMG),
        loadTextureDirectly(playIMG),         // playButtonTex (Кнопка GO)
        loadTextureDirectly(logoImg),         // logoTex
        loadTextureDirectly(balanceImg),      // balanceTex
        loadTextureDirectly(bonusIMG),
        loadTextureDirectly(phoneIMG),
        loadTextureDirectly(notifyIMG),
        loadTextureDirectly(endBGIMG),
        loadTextureDirectly(chickenLogoIMG),
        loadTextureDirectly(downloadButtonIMG),
        loadTextureDirectly(handIMG),
        loadTextureDirectly(pPoint) // betPanelTex
    ]);

    const car = new PIXI.Sprite({ texture: handTex});
    /**
 * Создает анимированный спрайт из папки с PNG
 * @param {Object} globObject - Объект импорта из папки (результат import.meta.glob)
 * @param {number} speed - Скорость анимации (по умолчанию 0.5)
 * @param {boolean} loop - Зациклить ли анимацию? (по умолчанию true)
 * @returns {Promise<PIXI.AnimatedSprite>} Готовый к использованию анимированный спрайт
 */
async function createAnimFromFolder(globObject, speed = 0.5, loop = true) {
    // 1. Сортируем ключи (имена файлов), чтобы кадры шли по порядку
    const sortedKeys = Object.keys(globObject).sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true });
    });

    const urls = sortedKeys.map(key => globObject[key]?.default || globObject[key]);

    // 3. Внутренняя функция безопасной загрузки (как твой loadTextureDirectly)
    const loadSafeTexture = (src) => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous'; // Помогает избежать проблем с CORS на этапе разработки
            
            img.onload = () => {
                // Превращаем нативную картинку в текстуру Pixi
                resolve(PIXI.Texture.from(img));
            };
            
            img.onerror = (err) => {
                console.error("Ошибка загрузки кадра анимации:", src);
                reject(new Error("Failed to load animation frame"));
            };
            
            img.src = src; 
        });
    };

    // 4. Ждем, пока ВСЕ кадры загрузятся через безопасный метод
    const textures = await Promise.all(urls.map(url => loadSafeTexture(url)));

    // 5. Создаем AnimatedSprite из массива готовых текстур
    const anim = new PIXI.AnimatedSprite(textures);
    anim.animationSpeed = speed;
    anim.loop = loop;
    anim.anchor.set(0.5); 

    return anim;
}


const init = async () => {
    try {
        await document.fonts.ready;

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

        app.stage.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);



    app.stage.on('pointerdown', (event) => {
        // Получаем глобальные координаты клика на экране
        const globalPos = event.global;

        startBGM(); 


        const gamePos = gameContainer.toLocal(globalPos);
        
        // 2. Координаты для UI (кнопки, тексты, туториал-рука)
        const uiPos = uiOverlayContainer.toLocal(globalPos);

        // Округляем до целых чисел для красоты
        const gX = Math.round(gamePos.x);
        const gY = Math.round(gamePos.y);
        const uX = Math.round(uiPos.x);
        const uY = Math.round(uiPos.y);

        // Выводим в консоль красиво и удобно для копипаста
        console.log('%c🎯 КЛИК ЗАРЕГИСТРИРОВАН!', 'background: #222; color: #bada55; font-size: 14px; font-weight: bold;');
        console.log(`%c🌍 Для gameContainer (Игровой мир): \n %c sprite.position.set(${gX}, ${gY});`, 'color: #ffaa00;', 'color: #ffffff; background: #333; padding: 2px; font-family: monospace;');
        console.log(`%c📱 Для uiOverlayContainer (Интерфейс): \n %c uiElement.position.set(${uX}, ${uY});`, 'color: #00aaff;', 'color: #ffffff; background: #333; padding: 2px; font-family: monospace;');
        console.log('-----------------------------------');
    });

        

        let cameraX = 0; 
        let cameraY = 0; 
        let cameraZoom = 1.0;


        let currentCameraTicker = null;

        const cameraLayers = [];
        function createLayer(parallaxFactor) {
            const layer = new PIXI.Container();
            layer.parallaxFactor = parallaxFactor; // Запоминаем коэффициент
            app.stage.addChild(layer);
            cameraLayers.push(layer);
            return layer;
        }

        const transMP3 = null; // Заглушка для звука перехода


        const gameContainer = createLayer(1.0);

        // 2. ДОБАВЛЯЕМ ДОРОГУ ВНУТРЬ МИРА
        const backgroundSprite = new PIXI.Sprite({ texture: backgroundTex });
        backgroundSprite.anchor.set(0.5);
        // Ставим дорогу в центр или в начальные координаты (например 0, 0)
        backgroundSprite.position.set(-3500, 0);
        backgroundSprite.scale.set(3);
        gameContainer.addChild(backgroundSprite);

        // 3. UI ПОВЕРХ ВСЕГО
        const uiOverlayContainer = new PIXI.Container();
        app.stage.addChild(uiOverlayContainer);

        const luksArray = [];
        const bareers = [];
        const monees = []
        const startX = -4350;
        const offset = 420;
        
        // Начальные суммы для люков (Индекс 1 - это бонус, там null)
        const initialAmounts = [60, null, 180, 540, 1620];

        // Красивый стиль для сумм на люках
        const amountStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen',
            fontSize: 68,
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: { color: '#000000', width: 6 },
            dropShadow: { color: '#000000', alpha: 0.8, distance: 3, blur: 4 },
            align: 'center'
        });

        for(let i = 0; i <= 4; i++) {
            // Создаем КОНТЕЙНЕР для люка (чтобы картинка и текст двигались вместе)
            const lukContainer = new PIXI.Container();
            lukContainer.position.set(i * offset + startX, 0);
            
            // Запоминаем текущую сумму в самом объекте (пригодится для умножения)
            lukContainer.currentAmount = initialAmounts[i] || 0;


                const lukSprite = new PIXI.Sprite({ texture: lukTex });
                lukSprite.anchor.set(0.5);
                lukSprite.scale.set(1.5);
                lukContainer.addChild(lukSprite);

                // Создаем ТЕКСТ с суммой
                const amountText = new PIXI.Text({
                    text: lukContainer.currentAmount + " €",
                    style: amountStyle
                });
                amountText.anchor.set(0.5);
                amountText.position.set(0, 0); // По центру люка
                lukContainer.addChild(amountText);

                // Сохраняем ссылки внутри контейнера, чтобы менять их потом
                lukContainer.textObj = amountText;
                lukContainer.lukSprite = lukSprite;
            

            const bareer1 = new PIXI.Sprite({ texture: bareerTex });
            bareer1.position.set(lukContainer.x - 150, lukContainer.y - 1070);
            gameContainer.addChild(bareer1);

            bareers.push(bareer1)
            
            
            gameContainer.addChild(lukContainer);
            luksArray.push(lukContainer);
        }

function multiplyLukAmount(lukObj, multiplier, duration = 0.5) {
    // Если это бонусный люк (без текста) - выходим
    if (!lukObj || !lukObj.textObj) return;

    // Считаем новую сумму
    const startAmount = lukObj.currentAmount;
    const targetAmount = startAmount * multiplier;
    lukObj.currentAmount = targetAmount; // Обновляем в памяти

    const newStyle = lukObj.textObj.style.clone();
    newStyle.fill = '#ffe602';
    
    // Присваиваем новый стиль объекту текста
    lukObj.textObj.style = newStyle;

    // Останавливаем старую анимацию, если она вдруг была
    if (lukObj._amountTicker) app.ticker.remove(lukObj._amountTicker);

    let progress = 0;
    
    // Эффект пружинки для текста: пульсируем от 1.0 до 1.4 и обратно
    const baseScale = 1.0;
    const maxScale = 1.5;

    lukObj._amountTicker = (ticker) => {
        if (lukObj.destroyed) return app.ticker.remove(lukObj._amountTicker);

        progress += ticker.deltaTime / (duration * 60);

        if (progress >= 1) {
            // КОНЕЦ АНИМАЦИИ
            lukObj.textObj.text = targetAmount + " €";
            lukObj.textObj.scale.set(baseScale); // Возвращаем обычный размер
            
            app.ticker.remove(lukObj._amountTicker);
            lukObj._amountTicker = null;
            
            console.log(`Сумма на люке увеличена до ${targetAmount}!`);
        } else {
            // 1. Прокрутка цифр (Ease-Out)
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentDisplayAmount = Math.floor(startAmount + (targetAmount - startAmount) * ease);
            lukObj.textObj.text = currentDisplayAmount + " €";

            // 2. Пульсация текста (Синус от 0 до PI)
            // progress = 0.5 -> sin(90 град) = 1 (максимальный размер)
            const pulse = Math.sin(progress * Math.PI); 
            lukObj.textObj.scale.set(baseScale + (maxScale - baseScale) * pulse);
        }
    };

    app.ticker.add(lukObj._amountTicker);
}

        // --- UI ЭЛЕМЕНТЫ ---
        const disclaimer = new PIXI.Text({
            text: "For illustrative purposes only",
            style: {
                fontFamily: 'Arial', // Замените на 'softhyphen'
                fontSize: 52,
                fill: '#ffffff',
                //stroke: { color: '#ffffff', width: 4 },
                align: 'center'
            }
        });
        disclaimer.alpha = 0.9;
        disclaimer.anchor.set(0.5, 1);
        disclaimer.scale.set(1.6);
        //disclaimer.position.set(0 , 1000);
        disclaimer.zIndex = 100;
        if(isIronSoutce)
            uiOverlayContainer.addChild(disclaimer);

        // --- ФУНКЦИИ АНИМАЦИИ ---
        const motionBlur = new PIXI.BlurFilter();
        motionBlur.strengthX = 0;
        motionBlur.strengthY = 0;


        const idleFrames = import.meta.glob('./assets/PlayerIdle/*.webp', { eager: true, import: 'default' });
        const jumpFrames = import.meta.glob('./assets/PlayerJump/*.webp', { eager: true, import: 'default' });
        const animIdle = await createAnimFromFolder(idleFrames, 0.4, true);
        const animJump = await createAnimFromFolder(jumpFrames, 0.4, true);


        

const player = new PIXI.Container();
        player.position.set(-4770, 10);
        player.scale.set(0.3);

        player.addChild(animIdle);
        player.addChild(animJump);

        const playerMoneyTag = new PIXI.Container();
        

        playerMoneyTag.position.set(0, 700); 
        
        // Изначально плашка полностью прозрачна (появится после первого прыжка)
        playerMoneyTag.alpha = 0; 
        player.addChild(playerMoneyTag);

        // --- Темный фон плашки (закругленный прямоугольник) ---
        const tagBg = new PIXI.Sprite({ texture: pPointerTex });
        tagBg.anchor.set(0.5);
        tagBg.scale = 0.7;
        playerMoneyTag.addChild(tagBg);


        // --- Текст с суммой ---
        const playerMoneyStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen', // Твой шрифт
            fontSize: 150,
            fontWeight: 'bold',
            fill: '#ffffff', // Зеленые цифры
            dropShadow: { color: '#00aa00', alpha: 0.8, distance: 0, blur: 5 },
            align: 'center'
        });
        
        const playerMoneyText = new PIXI.Text({ text: "0 €", style: playerMoneyStyle });
        playerMoneyText.anchor.set(0.5);
        playerMoneyText.position.set(0, 0); // По центру плашки
        playerMoneyTag.addChild(playerMoneyText);

        // Переменная для хранения текущей суммы курицы
        player.currentMoney = 0;

        gameContainer.sortableChildren = true;

        player.zIndex = 10;    // Курица всегда высоко


        gameContainer.addChild(player);

        // 5. НАСТРАИВАЕМ НАЧАЛЬНОЕ СОСТОЯНИЕ (Стоит)
        animIdle.visible = true;
        animIdle.play();

        animJump.visible = false;
        animJump.stop(); // Останавливаем, чтобы не жрала ресурсы процессора в фоне

        const lukCounter = 0;

        const headerContainer = new PIXI.Container();
        const footerContainer = new PIXI.Container();
        uiOverlayContainer.addChild(headerContainer, footerContainer);

        // 2. ФОНЫ (Рисуются кодом, будут перерисовываться при ресайзе)
        const headerBg = new PIXI.Graphics();
        headerContainer.addChild(headerBg);
        const footerBg = new PIXI.Graphics();
        footerContainer.addChild(footerBg);

        // Блокируем клики по фонам
        headerBg.eventMode = 'none';
        footerBg.eventMode = 'none';
        const logoSprite = new PIXI.Sprite({ texture: logoTex }); // Замени на свою текстуру
        logoSprite.anchor.set(0, 0.5); // Якорь слева по центру
        headerContainer.addChild(logoSprite);

        // Баланс (По центру/Справа)
        const balancePanel = new PIXI.Sprite({ texture: balanceTex }); 
        balancePanel.anchor.set(1, 0.5); // Якорь справа
        headerContainer.addChild(balancePanel);

        const balanceText = new PIXI.Text({
            text: "1500        EUR",
            style: { fontFamily: 'Arial', fontSize: 50, fill: '#ffffff', align: 'center' , fontWeight: 'bold', lineHeight: 100}
        });
        balanceText.anchor.set(0.5);
        balanceText.position.set(-320 , 0);
        balanceTex.zIndex = 20;

        balancePanel.addChild(balanceText);

        const goStyle = {
            fontFamily: 'Arial', // или 'softhyphen'
            fontSize: 110,
            fontWeight: 'bold',
            fill: '#ffffff', // Белый
            dropShadow: { color: '#000000', alpha: 0.3, distance: 2, blur: 2 }
        };

        let currentTutorialHand = null;

        // Кнопка GO (Правый нижний угол)
        const goButton = new PIXI.Sprite({ texture: playButtonTex });
        goButton.anchor.set(0.5);
        goButton.eventMode = 'static';
        footerContainer.addChild(goButton);



        const textObj = new PIXI.Text({ text: getT("go").toUpperCase() , style: goStyle });
        textObj.anchor.set(0.5); // Текст тоже строго по центру

        goButton.addChild(textObj);



        // Функция для умной паузы (заменяет setTimeout)
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Обертки для твоих функций анимации, чтобы можно было использовать await
        const jumpAsync = (obj, x, y, time) => new Promise(res => jumpToX(obj, x, y, time, res));
        const moveAsync = (obj, targetX, targetY, time) => new Promise(res => moveToLinear(obj, targetX, targetY, time, res));
        const trafficCar = new PIXI.Sprite({ texture: yellowCarTex });
        trafficCar.anchor.set(0.5);
        trafficCar.scale.set(1.35);
        trafficCar.visible = false;
        gameContainer.addChild(trafficCar);

        let isActionLocked = false;
        let isGameplayStarted = false;
        let hasFirstJumpPlayed = false;

        function animateLukUpgrade(lukObj, duration = 0.35) {
            return new Promise((resolve) => {
                if (!lukObj || !lukObj.lukSprite) {
                    resolve();
                    return;
                }

                const sprite = lukObj.lukSprite;
                const startScaleX = sprite.scale.x;
                const startScaleY = sprite.scale.y;
                const peakScale = startScaleX * 1.18;
                let progress = 0;

                sprite.texture = goldLukTex;

                const ticker = (tick) => {
                    progress += tick.deltaTime / (duration * 60);

                    if (progress >= 1) {
                        sprite.scale.set(startScaleX, startScaleY);
                        app.ticker.remove(ticker);
                        resolve();
                        return;
                    }

                    const pulse = Math.sin(progress * Math.PI);
                    const currentScale = startScaleX + (peakScale - startScaleX) * pulse;
                    sprite.scale.set(currentScale, currentScale);
                };

                app.ticker.add(ticker);
            });
        }

        function startTrafficLoop() {
            if (trafficCar.visible) return;

            const laneX = luksArray[1].x - 110;
            const startY = luksArray[1].y - 1970;
            const endY = luksArray[1].y + 650;

            trafficCar.visible = true;
            trafficCar.position.set(laneX, startY);

            const loopTicker = (ticker) => {
                if (trafficCar.destroyed) {
                    app.ticker.remove(loopTicker);
                    return;
                }

                trafficCar.y += ticker.deltaTime * 17;
                if (trafficCar.y > endY) {
                    trafficCar.y = startY;
                }
            };

            trafficCar._loopTicker = loopTicker;
            app.ticker.add(loopTicker);
        }

        async function playFirstJumpSequence() {
            hideTutorialHand();
            animIdle.visible = false;
            animIdle.stop();
            animJump.visible = true;
            animJump.animationSpeed = 0.38;
            animJump.gotoAndPlay(0);
            focusCameraOnPlayer(false);

            await wait(450);
            playSound(jump);
            await jumpAsync(player, player.x + 400, 100, 0.35);

            const targetLuk = luksArray[0];
            await animateLukUpgrade(targetLuk);
            playSound(barSound);
            await moveAsync(bareers[0], targetLuk.x - 150, targetLuk.y - 340, 0.25);

            await wait(250);
            animJump.visible = false;
            animIdle.visible = true;
            animIdle.gotoAndPlay(0);
        }

       // showTutorialHand(goButton);

        goButton.on('pointerdown', async () => {
            if (isActionLocked) return;

            pressButton(goButton);
            isActionLocked = true;

            if (!isGameplayStarted) {
                hideTutorialHand();
                isGameplayStarted = true;
                textObj.text = getT("go").toUpperCase();
                startTrafficLoop();
                await wait(250);
                showTutorialHand(goButton);
                isActionLocked = false;
                return;
            }

            if (hasFirstJumpPlayed) {
                isActionLocked = false;
                return;
            }

            await playFirstJumpSequence();
            hasFirstJumpPlayed = true;
            isActionLocked = false;
        });

        // --- ЦЕНТРАЛЬНЫЙ СТАРТОВЫЙ ЭКРАН С ЗАТЕМНЕНИЕМ ---
        const startOverlayContainer = new PIXI.Container();
        uiOverlayContainer.addChild(startOverlayContainer);

        const startDimmer = new PIXI.Graphics();
        startDimmer.rect(-5000, -5000, 10000, 10000); // Огромный размер, чтобы покрыть любой экран
        startDimmer.fill({ color: 0x000000, alpha: 0.7 });
        startDimmer.eventMode = 'static'; // Блокируем клики по игре внизу
        startOverlayContainer.addChild(startDimmer);

        const startTextStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen',
            fontSize: 180,
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: { color: '#000000', width: 8 },
            dropShadow: { color: '#000000', alpha: 0.8, distance: 5, blur: 5 },
            align: 'center'
        });

        const startTextObjCenter = new PIXI.Text({
            text: 'START',
            style: startTextStyle
        });
        startTextObjCenter.anchor.set(0.5);
        startTextObjCenter.position.set(0, 0); // По центру UI (0,0 относительно uiOverlayContainer)
        startOverlayContainer.addChild(startTextObjCenter);

        // Пульсация текста START
        const startPulseTicker = (ticker) => {
            if (startTextObjCenter.destroyed) return app.ticker.remove(startPulseTicker);
            const scale = 1 + Math.sin(ticker.lastTime * 0.005) * 0.05;
            startTextObjCenter.scale.set(scale);
        };
        app.ticker.add(startPulseTicker);

        startDimmer.cursor = 'pointer';
        
        // Обработка клика по затемнению (старт игры)
        startDimmer.on('pointerdown', async () => {
            if (isActionLocked) return;
            isActionLocked = true;

            app.ticker.remove(startPulseTicker);
            startDimmer.eventMode = 'none'; // Отключаем блокировщик
            hideTutorialHand();

            // Плавное исчезновение стартового экрана
            let alphaProgress = 0;
            const fadeTicker = (ticker) => {
                alphaProgress += ticker.deltaTime / (0.2 * 60);
                if (alphaProgress >= 1) {
                    app.ticker.remove(fadeTicker);
                    startOverlayContainer.destroy();
                } else {
                    startOverlayContainer.alpha = 1 - alphaProgress;
                }
            };
            app.ticker.add(fadeTicker);

            isGameplayStarted = true;
            startTrafficLoop();
            await wait(250);
            showTutorialHand(goButton); // Теперь рука указывает на кнопку GO
            isActionLocked = false;
        });

        // Изначально рука указывает на центральный текст START
        //showTutorialHand(startTextObjCenter);

        // Обновленная логика нижней кнопки (теперь сразу делает прыжок)
        goButton.on('pointerdown', async () => {
            if (isActionLocked || !isGameplayStarted) return;

            pressButton(goButton);
            isActionLocked = true;

            if (hasFirstJumpPlayed) {
                isActionLocked = false;
                return;
            }

            await playFirstJumpSequence();
            hasFirstJumpPlayed = true;
            isActionLocked = false;
        });




        /**
 * Плавно прячет текст на люке (когда игрок забирает деньги)
 * @param {PIXI.Container} lukObj - Объект люка из luksArray
 */
function hideLukText(lukObj) {
    if (!lukObj || !lukObj.textObj) return;

    let progress = 0;
    const duration = 0.3; // Исчезает быстро за 0.3 сек
    const startScale = lukObj.textObj.scale.x;

    const fadeTicker = (ticker) => {
        if (lukObj.textObj.destroyed) return app.ticker.remove(fadeTicker);

        progress += ticker.deltaTime / (duration * 60);

        if (progress >= 1) {
            lukObj.textObj.alpha = 0;
            lukObj.textObj.visible = false; // Отключаем рендер для экономии ресурсов
            app.ticker.remove(fadeTicker);
        } else {
            // Плавное затухание
            lukObj.textObj.alpha = 1 - progress;
            // Легкое уменьшение при исчезновении (как будто сдувается)
            lukObj.textObj.scale.set(startScale * (1 - progress * 0.5)); 
        }
    };

    app.ticker.add(fadeTicker);
}


function addMoneyToPlayer(amountToAdd, duration = 0.5) {
    const startAmount = player.currentMoney;
    const targetAmount = startAmount + amountToAdd;
    player.currentMoney = targetAmount;

    // Если плашка еще невидима - делаем её видимой!
    if (playerMoneyTag.alpha === 0) {
        // Плавное появление (Fade In)
        let alphaProgress = 0;
        const fadeTicker = (ticker) => {
            alphaProgress += ticker.deltaTime / (0.3 * 60); // 0.3 секунды на появление
            if (alphaProgress >= 1) {
                playerMoneyTag.alpha = 1;
                app.ticker.remove(fadeTicker);
            } else {
                playerMoneyTag.alpha = alphaProgress;
            }
        };
        app.ticker.add(fadeTicker);
    }

    // Если старая анимация цифр еще идет - отменяем её
    if (playerMoneyTag._amountTicker) app.ticker.remove(playerMoneyTag._amountTicker);

    let progress = 0;
    const baseScale = 1.0;
    const maxScale = 1.3; // Увеличивается на 30% во время зачисления

    playerMoneyTag._amountTicker = (ticker) => {
        progress += ticker.deltaTime / (duration * 60);

        if (progress >= 1) {
            // КОНЕЦ
            playerMoneyText.text = targetAmount.toLocaleString('ru-RU') + " €";
            playerMoneyTag.scale.set(baseScale);
            
            app.ticker.remove(playerMoneyTag._amountTicker);
            playerMoneyTag._amountTicker = null;
        } else {
            // 1. Прокрутка цифр
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentDisplayAmount = Math.floor(startAmount + (targetAmount - startAmount) * ease);
            
            playerMoneyText.text = currentDisplayAmount.toLocaleString('ru-RU') + " €";

            // 2. Пульсация всей плашки (Синус от 0 до PI)
            const pulse = Math.sin(progress * Math.PI); 
            playerMoneyTag.scale.set(baseScale + (maxScale - baseScale) * pulse);
        }
    };

    app.ticker.add(playerMoneyTag._amountTicker);
}



function focusCameraOnPlayer(instant = true) {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const isPortrait = sw < sh;


    const targetZoom = isPortrait ? 0.9 : 1.37; // Подбери цифры под свои картинки

    const cameraOffsetX = -470; 
    let targetX = player.x - cameraOffsetX; 
    
    // Координата Y обычно фиксированная (дорога), но можно привязать к игроку

    let targetY = 200;

    if(isPortrait){
        targetY = 200;
    }
    else{
        targetY = 0;
    }

    const scaleX = sw / GAME_WIDTH;
    const scaleY = sh / GAME_HEIGHT;
    const finalGameScale = Math.min(scaleX, scaleY) * targetZoom;
    
    const halfScreenWidthInWorld = (sw / 2) / finalGameScale;

    // Узнаем координаты левого и правого края фона (backgroundSprite стоит в 0,0, значит края это width/2)
    const bgLeftEdge = backgroundSprite.x - (backgroundSprite.width / 2);
    const bgRightEdge = backgroundSprite.x + (backgroundSprite.width / 2);

    // Ограничиваем targetX, чтобы камера не выехала за фон!
    // Камера не может быть левее, чем (ЛевыйКрай + ПоловинаЭкрана)
    if (targetX - halfScreenWidthInWorld < bgLeftEdge) {
        targetX = bgLeftEdge + halfScreenWidthInWorld;
    }
    // Камера не может быть правее, чем (ПравыйКрай - ПоловинаЭкрана)
    if (targetX + halfScreenWidthInWorld > bgRightEdge) {
        targetX = bgRightEdge - halfScreenWidthInWorld;
    }

    // ==========================================
    // 4. ПРИМЕНЕНИЕ
    // ==========================================
    if (instant) {
        cameraX = targetX;
        cameraY = targetY;
        cameraZoom = targetZoom;
        resize(); // Сразу применяем
    } else {
        animateCamera(targetX, targetY, targetZoom, 0.5); // Плавный наезд
    }
}


// Глобальная переменная для хранения пуша
let pushContainer = null;


function spawnPushNotification(amountText, yPos = -800) {
    // Если на экране уже висит старый пуш - удаляем его
    if (pushContainer && !pushContainer.destroyed) {
        pushContainer.destroy();
    }
    
    // 1. СОЗДАЕМ КОНТЕЙНЕР
    pushContainer = new PIXI.Container();
    pushContainer.position.set(0, yPos);
    // Изначальный масштаб для анимации, чтобы избежать ошибок
    pushContainer.targetScale = 1.0; 
    uiOverlayContainer.addChild(pushContainer);
    
    playSound(sms); // Твой звук уведомления

    // ==========================================
    // 2. ВСЯ ГРАФИКА РИСУЕТСЯ В БАЗОВОМ РАЗМЕРЕ
    // ==========================================
    const width = 980; 
    const height = 320;
    const radius = 50;

    // Плашка фона
    const bg = new PIXI.Graphics();
    bg.roundRect(-width / 2, -height / 2, width, height, radius);
    bg.fill({ color: 0x444444, alpha: 0.85 });
    bg.stroke({ color: 0xffffff, width: 2, alpha: 0.1 });
    pushContainer.addChild(bg);

    // Аватарка (кружок + буква R)
    const avatarContainer = new PIXI.Container();
    avatarContainer.position.set(-width / 2 + 80, 0);
    pushContainer.addChild(avatarContainer);

    const avatarBg = new PIXI.Graphics();
    avatarBg.circle(0, 0, 60);
    avatarBg.fill(0xffffff);
    avatarContainer.addChild(avatarBg);

    const logoText = new PIXI.Text({ 
        text: "R", 
        style: { fontFamily: 'Arial', fontSize: 80, fontWeight: 'bold', fill: '#000000' } 
    });
    logoText.anchor.set(0.5);
    avatarContainer.addChild(logoText);

    // Тексты (с увеличенным размером и отступами)
    const textX = -width / 2 + 200; 

    const titleStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 42, fontWeight: 'bold', fill: '#ffffff' });
    const timeStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 32, fill: '#aaaaaa' });
    const bodyStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 38, fill: '#ffffff' });
    const subStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 28, fill: '#aaaaaa' });

    const lineSpacing = 50; 
    const startY = -90; 

    // Заголовок
    const title = new PIXI.Text({ text: "Revolut", style: titleStyle });
    title.position.set(textX, startY);
    
    // Время
    const timeText = new PIXI.Text({ text: "now", style: timeStyle });
    timeText.anchor.set(1, 0); 
    timeText.position.set(width / 2 - 50, startY);
    pushContainer.addChild(title, timeText);

    // СРАЗУ ЗАДАЕМ ПОЛНЫЙ ТЕКСТ (без пустого "")
    const fullText1 = `CARD *6532. Transaction: +€${amountText}`;
    const fullText2 = `Current balance: €${amountText}`;
    const fullText3 = "Click here for more information.";

    // Строки (line1, line2, subText)
    const line1 = new PIXI.Text({ text: fullText1, style: bodyStyle });
    line1.position.set(textX, startY + lineSpacing);
    
    const line2 = new PIXI.Text({ text: fullText2, style: bodyStyle });
    line2.position.set(textX, startY + lineSpacing * 2);
    
    const subText = new PIXI.Text({ text: fullText3, style: subStyle });
    subText.position.set(textX, startY + lineSpacing * 3 + 10);
    
    pushContainer.addChild(line1, line2, subText);

    // Вызываем resize() принудительно, чтобы он сразу посчитал targetScale до начала анимации
    if (typeof resize === 'function') resize();

    // ==========================================
    // 3. АНИМАЦИОННЫЙ ЦИКЛ (Только появление и исчезновение всей плашки)
    // ==========================================
    pushContainer.scale.set(0); // Прячем всю плашку в 0 для стартового "вылета"

    let time = 0;

    const animTicker = (ticker) => {
        // Защита от краша, если пуш удалили снаружи
        if (!pushContainer || pushContainer.destroyed) {
            return app.ticker.remove(animTicker);
        }

        // Блокируем изменение масштаба ресайзом во время анимации появления
        pushContainer.isSpawning = true; 
        
        const dt = ticker.deltaTime / 60;
        time += dt;

        // --- ФАЗА 1: Вылет всей плашки сразу со всеми элементами (0.0 - 0.2 сек) ---
        if (time < 0.2) {
            const t = time / 0.2;
            const scaleEase = 1 - Math.pow(1 - t, 3); // Плавное торможение
            // Анимируем до идеального масштаба, который посчитал resize()
            pushContainer.scale.set(pushContainer.targetScale * scaleEase);
        } else {
            pushContainer.scale.set(pushContainer.targetScale);
            pushContainer.isSpawning = false; // Отдаем управление масштабом функции resize()
        }

        // --- ФАЗА 2: Удаление пуша (Через 5 секунд) ---
        if (time > 5.0 && time < 5.3) {
            const t = (time - 5.0) / 0.3;
            pushContainer.y = yPos - (t * 100); // Улетает вверх
            pushContainer.alpha = 1 - t; // Растворяется
        } else if (time >= 5.3) {
            app.ticker.remove(animTicker);
            pushContainer.destroy();
            pushContainer = null;
        }
    };

    app.ticker.add(animTicker);
}

/**
 * Показывает финальный экран (End Card) с анимациями
 */
async function showEndCard() {
    // 1. КОНТЕЙНЕР
    const endCardContainer = new PIXI.Container();
    app.stage.addChild(endCardContainer);

    // 2. ПЕРЕХОД
    await blurAsync(0.5, 0.5, 30);
    if (typeof gameContainer !== 'undefined') gameContainer.visible = false;
    if (typeof uiOverlayContainer !== 'undefined') uiOverlayContainer.visible = false;

    // 3. ФОН
    const endBg = new PIXI.Sprite({ texture: bgEndTex }); 
    endBg.anchor.set(0.5);
    endBg.position.set(0, 0); 
    endCardContainer.addChild(endBg);

    // 4. UI ЭЛЕМЕНТЫ
    const logo = new PIXI.Sprite({ texture: chickenLogoTex }); 
    logo.anchor.set(0.5);
    
    const bonusTextStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 100,
        fontWeight: 'bold',
        fill: '#ffe602',
        stroke: { color: '#000000', width: 10 },
        dropShadow: { color: '#000000', alpha: 0.8, distance: 5, blur: 5 },
        align: 'center',
        lineHeight: 110
    });

        const downloadTextStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 100,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 10 },
        dropShadow: { color: '#000000', alpha: 0.8, distance: 5, blur: 5 },
        align: 'center',
        lineHeight: 110
    });
    
    
    const bonusText = new PIXI.Text({
        text: `1500€ ${getT("deposit_bonus")}\n+ 250 ${getT("free_spins")}`.toUpperCase(),
        style: bonusTextStyle
    });
    bonusText.anchor.set(0.5);
    
    const downloadButton = new PIXI.Sprite({ texture: downloadButtonTex });
    downloadButton.anchor.set(0.5);
    downloadButton.eventMode = 'static';
    downloadButton.cursor = 'pointer';


    const baseBtnW = downloadButton.width;
    const baseBtnH = downloadButton.height;

    const down = new PIXI.Text({
        text: getT("download").toUpperCase(),
        style: downloadTextStyle
    });

    down.anchor.set(0.5);
    down.position.set(0 , -50);
    down.scale.set(1.35);

    downloadButton.addChild(down);
    
    endCardContainer.addChild(logo, bonusText, downloadButton);

    let currentBgScale = 1;

    // --- Блюр фона через 2 секунды ---
setTimeout(() => {
    const blurFilter = new PIXI.BlurFilter();
    blurFilter.blur = 0;
    endBg.filters = [blurFilter];

    let blurProgress = 0;
    const TARGET_BLUR = 22;
    const BLUR_DURATION = 0.8;

    const blurInTicker = (ticker) => {
        blurProgress += ticker.deltaTime / (BLUR_DURATION * 60);
        if (blurProgress >= 1) {
            blurFilter.blur = TARGET_BLUR;
            app.ticker.remove(blurInTicker);
        } else {
            const ease = 1 - Math.pow(1 - blurProgress, 3);
            blurFilter.blur = TARGET_BLUR * ease;
        }
    };
    app.ticker.add(blurInTicker);
}, 2500);


    const onEndCardResize = () => {
        const sw = window.innerWidth;
        const sh = window.innerHeight;
        const isPortrait = sw < sh; // Проверяем ориентацию экрана
        
        endCardContainer.position.set(sw / 2, sh / 2);

        // --- Адаптация ФОНА ---
        // Добавляем запас (+0.15), чтобы не было пустых краев при "прыжках" ресайза
        currentBgScale = Math.max(sw / (endBg.texture.width || 1), sh / (endBg.texture.height || 1)) + 0.15;
        endBg.scale.set(currentBgScale);

        // --- Адаптация UI ЭЛЕМЕНТОВ ---
        
        // 1. ЛОГОТИП (Верх)
        const logoMaxWidth = isPortrait ? sw * 1 : sw * 0.4;
        const logoMaxHeight = isPortrait ? sh * 0.4 : sh * 0.45;
        
        const logoScaleW = logoMaxWidth / (logo.texture.width || 1);
        const logoScaleH = logoMaxHeight / (logo.texture.height || 1);
        
        logo.targetScale = Math.min(logoScaleW, logoScaleH);
        logo.targetScale = Math.min(logo.targetScale, 2.0); // Защита от гигантского переразмера

        // 2. ТЕКСТ БОНУСА (Центр)
        const textMaxWidth = isPortrait ? sw * 0.75 : sw * 0.5;
        const textMaxHeight = isPortrait ? sh * 0.3 : sh * 0.35;
        
        // Берем реальный размер текста до скейла
        const baseTextWidth = bonusText.width / (bonusText.scale.x || 1);
        const baseTextHeight = bonusText.height / (bonusText.scale.y || 1);
        
        const textScaleW = textMaxWidth / (baseTextWidth || 1);
        const textScaleH = textMaxHeight / (baseTextHeight || 1);
        
        bonusText.targetScale = Math.min(textScaleW, textScaleH);
        bonusText.targetScale = Math.min(bonusText.targetScale, 1.5); 

        // 3. КНОПКА DOWNLOAD (Низ)
        // На телефоне даем 65% ширины, на ПК (ландшафт) - 30% ширины
// 3. КНОПКА DOWNLOAD
        const btnMaxWidth  = isPortrait ? sw * 0.8 : sw * 0.65; 
        const btnMaxHeight = isPortrait ? sh * 0.75 : sh * 0.7; 

        const btnScaleW = btnMaxWidth  / (baseBtnW || 1);
        const btnScaleH = btnMaxHeight / (baseBtnH || 1);

        downloadButton.targetScale = Math.max(0.1, Math.min(btnScaleW, btnScaleH, 1.6));

        if (!downloadButton.isSpawning) downloadButton.scale.set(downloadButton.targetScale);

        // --- РАССТАНОВКА ---
        const offsetTop = isPortrait ? sh * 0.3 : sh * 0.35; 
        const offsetBottom = isPortrait ? sh * 0.3 : sh * 0.35;

        logo.position.set(0, -offsetTop);
        bonusText.position.set(0, 0); // Текст всегда ровно по центру
        downloadButton.position.set(0, offsetBottom);

        // Применяем рассчитанный масштаб (если нет анимации спавна)
        if (!logo.isSpawning) logo.scale.set(logo.targetScale);
        if (!bonusText.isSpawning) bonusText.scale.set(bonusText.targetScale);
        if (!downloadButton.isSpawning) downloadButton.scale.set(downloadButton.targetScale);
    };

    // Запускаем слушатель
    window.addEventListener('resize', onEndCardResize);
    onEndCardResize();
    // ==========================================
    // 6. АНИМАЦИИ
    // ==========================================

    // --- Движение камеры (параллакс фона) ---
    // Максимальное смещение фона в пикселях (не выходим за края, т.к. фон приближен)
    const CAM_X_LANDSCAPE = 60; // лево-право в горизонтальной
    const CAM_X_PORTRAIT  = 80; // только влево в вертикальной (уходит и остаётся)
    const CAM_Y_BOTH      = 25; // вверх-вниз в обоих режимах

    // Скорости (в секундах на один цикл)
    const SPEED_X_LANDSCAPE = 6.0;
    const SPEED_X_PORTRAIT  = 14.0; // медленный дрейф влево
    const SPEED_Y           = 4.5;

    let camTime = 0;

    const cameraTicker = (ticker) => {
        camTime += ticker.deltaTime / 60;

        const isPortrait = window.innerWidth < window.innerHeight;

        let bgOffsetX = 0;
        let bgOffsetY = 0;

        if (isPortrait) {
            // Плавный дрейф влево: sin смещён так, что начинает с 0 и уходит в минус
            // sin(t) → от 0 плавно к -1, потом обратно — бесконечная петля
            bgOffsetX = -Math.abs(Math.sin(camTime / SPEED_X_PORTRAIT * Math.PI)) * CAM_X_PORTRAIT;
            // Небольшое покачивание вверх-вниз
            bgOffsetY = Math.sin(camTime / SPEED_Y * Math.PI * 2) * CAM_Y_BOTH;
        } else {
            // Плавное качание влево-вправо
            bgOffsetX = Math.sin(camTime / SPEED_X_LANDSCAPE * Math.PI * 2) * CAM_X_LANDSCAPE;
            // Небольшое покачивание вверх-вниз (немного сдвинуто по фазе)
            bgOffsetY = Math.sin(camTime / SPEED_Y * Math.PI * 2 + 1.0) * CAM_Y_BOTH;
        }

        endBg.position.set(bgOffsetX, bgOffsetY);
    };
    app.ticker.add(cameraTicker);

    // --- Пружинка (Bounce in) ---
    function springBounce(obj) {
        obj.isSpawning = true;
        let progress = 0;
        obj.scale.set(0);
        
        const tickFn = (ticker) => {
            progress += ticker.deltaTime / (0.5 * 60); 
            if (progress >= 1) {
                obj.scale.set(obj.targetScale);
                obj.isSpawning = false;
                app.ticker.remove(tickFn);
            } else {
                const t = progress - 1;
                const ease = (t * t * (3 * t + 2) + 1); 
                obj.scale.set(obj.targetScale * ease);
            }
        };
        app.ticker.add(tickFn);
    }
    
    logo.scale.set(0);
    bonusText.scale.set(0);
    downloadButton.scale.set(0);

    springBounce(logo); 
    await wait(300);
    springBounce(bonusText);
    await wait(300);
    springBounce(downloadButton);

    // --- Пульсация кнопки ---
    const pulseTicker = (ticker) => {
        if (downloadButton.isSpawning) return; 
        
        const pulseTime = ticker.lastTime * 0.005;
        const pulse = 1.0 + Math.sin(pulseTime) * 0.05; 
        downloadButton.scale.set(downloadButton.targetScale * pulse);
    };
    app.ticker.add(pulseTicker);

    // ==========================================
    // 7. КЛИКИ и ОЧИСТКА
    // ==========================================
    endCardContainer.eventMode = 'static';
    endCardContainer.cursor = 'pointer';
    endCardContainer.on('pointerdown', () => {
        app.ticker.remove(cameraTicker);
        app.ticker.remove(pulseTicker);
        window.removeEventListener('resize', onEndCardResize);
        
        openStore(); 
    });
}



function spawnFloatingText(textString, startX, startY, targetX, targetY, finalScale = 1.0, duration = 0.8) {
    // 1. Создаем красивый стиль текста (можешь поменять под свою игру)
    const textStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen', // Твой шрифт из шаблона
        fontSize: 120, // Сделай побольше, так как он будет скейлиться
        fontWeight: 'bold',
        fill: '#ffdd00', // Градиент от желтого к оранжевому
        stroke: { color: '#804611', width: 8 }, // Жирная темная обводка
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowDistance: 4,
        align: 'center'
    });

    // 2. Создаем сам объект текста
    const floatText = new PIXI.Text({ text: textString, style: textStyle });
    floatText.anchor.set(0.5); // Важно для масштабирования из центра
    
    // 3. Начальные настройки (ноль размера)
    floatText.position.set(startX, startY);
    floatText.scale.set(0);
    
    // Небольшой случайный наклон для динамики (от -15 до +15 градусов)
    const randomRotation = (Math.random() - 0.5) * 0.5;
    floatText.rotation = randomRotation;

    // Добавляем поверх всего игрового мира (можно в uiOverlayContainer, если это UI)
    gameContainer.addChild(floatText);

    // 4. Анимация (Используем ту же логику, что и в деньгах, но без веера)
    let progress = 0;

    const animTicker = (ticker) => {
        if (floatText.destroyed) return app.ticker.remove(animTicker);

        progress += ticker.deltaTime / (duration * 60);

        if (progress >= 1) {
            // КОНЕЦ АНИМАЦИИ
            floatText.position.set(targetX, targetY);
            floatText.scale.set(finalScale);
            floatText.rotation = 0; // Выравниваем текст ровно в конце
            app.ticker.remove(animTicker);
            


        } else {
            // В ПРОЦЕССЕ ПОЛЕТА (Плавное замедление - Ease-Out)
            const ease = 1 - Math.pow(1 - progress, 3);
            
            // Двигаем
            floatText.position.x = startX + (targetX - startX) * ease;
            floatText.position.y = startY + (targetY - startY) * ease;
            
            const t = progress - 1;
            const springEase = (t * t * (3 * t + 2) + 1); 
            floatText.scale.set(springEase * finalScale);
            
            // Плавно выравниваем вращение в 0
            floatText.rotation = randomRotation * (1 - ease);
        }
    };

    app.ticker.add(animTicker);

    return floatText; // Возвращаем, если захочешь его удалить позже
}


function showWinPlaque(winAmount) {
    const popupContainer = new PIXI.Container();
    
    // 1. ДИММЕР (Затемнение фона)
    const dimmer = new PIXI.Graphics();
    dimmer.eventMode = 'static'; // Блокирует клики по игре (но не по футеру!)
    popupContainer.addChild(dimmer);

    // 2. ГЛАВНЫЙ КОНТЕЙНЕР ПЛАШКИ
    const plaqueGroup = new PIXI.Container();
    popupContainer.addChild(plaqueGroup);


    const width = 1000; // Базовая ширина, которую мы будем масштабировать
    const height = 650;
    const radius = 24; 

    const glowOutline = new PIXI.Graphics();
    glowOutline.roundRect(-width/2 - 10, -height/2 - 10, width + 20, height + 20, radius + 5);
    glowOutline.stroke({ color: 0xffff00, width: 12 }); 
    const glowFilter = new PIXI.BlurFilter({ strength: 2, quality: 3 });
    glowOutline.filters = [glowFilter];

    const spinnerMask = new PIXI.Graphics();
    spinnerMask.rect(-1000, -200, 2000, 350); 
    spinnerMask.rect(-200, -1000, 350, 2000); 
    spinnerMask.fill(0xffffff);
    glowOutline.mask = spinnerMask;
    plaqueGroup.addChild(glowOutline, spinnerMask);

    const shadow = new PIXI.Graphics();
    shadow.roundRect(-width/2 + 5, -height/2 + 5, width, height, radius);
    shadow.fill({ color: 0x000000, alpha: 0.3 }); 
    plaqueGroup.addChild(shadow);

    const plaqueBg = new PIXI.Graphics();
    plaqueBg.roundRect(-width/2, -height/2, width, height, radius);
    plaqueBg.fill({ color: 0x3a3a3c });
    plaqueBg.stroke({ color: 0x111111, width: 6 });
    plaqueGroup.addChild(plaqueBg);

    const blackScreen = new PIXI.Graphics();
    blackScreen.roundRect(-250, -10, 500, 120, 10);
    blackScreen.fill({ color: 0x050505 });
    blackScreen.stroke({ color: 0x555555, width: 3, alignment: 1 });
    plaqueGroup.addChild(blackScreen);

    // ==========================================
    // 4. ТЕКСТЫ
    // ==========================================
    const titleStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 80, fontWeight: 'bold', fill: '#ffdd00', stroke: { color: '#000000', width: 8 }, dropShadow: { color: '#000000', alpha: 1, distance: 5, blur: 0 } });
    const title = new PIXI.Text({ text: getT("you_won").toUpperCase(), style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(0, -100);
    plaqueGroup.addChild(title);

    const balanceStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 90, fontWeight: 'bold', fill: '#00ff00', dropShadow: { color: '#00aa00', alpha: 0.8, distance: 0, blur: 10 } });
    const balanceText = new PIXI.Text({ text: "0 €", style: balanceStyle });
    balanceText.anchor.set(0.5);
    balanceText.position.set(0, 50);
    plaqueGroup.addChild(balanceText);

    let plaqueScale = 1.0; // Переменная для хранения текущего масштаба

    // ==========================================
    // 5. АДАПТИВ
    // ==========================================
    const onPlaqueResize = () => {
        const sw = window.innerWidth;
        const sh = window.innerHeight;
        
        popupContainer.position.set(0, -200); 
        
        // Растягиваем диммер на весь экран, компенсируя масштаб родителя
        dimmer.clear();
        dimmer.rect(-sw / 2 / uiOverlayContainer.scale.x, -sh / 2 / uiOverlayContainer.scale.y, sw / uiOverlayContainer.scale.x, sh / uiOverlayContainer.scale.y);
        dimmer.fill({ color: 0x000000, alpha: 0.7 });

        // Вычисляем идеальный масштаб, чтобы плашка занимала 90% ширины
        const targetWidth = GAME_WIDTH * 0.75;
        plaqueScale = Math.min(1.0, targetWidth / width);
        
        // Применяем масштаб, если сейчас не идет анимация появления или пульсации
        if (!plaqueGroup.isAnimating) {
            plaqueGroup.scale.set(plaqueScale);
        }
    };

    window.addEventListener('resize', onPlaqueResize);
    onPlaqueResize(); // Вызываем первый раз для установки размеров

    // ==========================================
    // 6. СЛОИ и АНИМАЦИИ
    // ==========================================
    let targetIndex = uiOverlayContainer.getChildIndex(footerContainer);
    if (targetIndex < 0) targetIndex = 0;
    uiOverlayContainer.addChildAt(popupContainer, targetIndex);

    plaqueGroup.scale.set(0); 
    
    let time = 0;
    let currentBalance = 0;
    const duration = 2.0; 

    const animTicker = (ticker) => {
        plaqueGroup.isAnimating = true; // Флаг, чтобы ресайз не мешал анимации
        const dt = ticker.deltaTime / 60;
        time += dt;
        spinnerMask.rotation += 2.5 * dt;

        // Анимация появления (пружинка)
        if (time < 0.5) {
            const t = time / 0.5;
            const ease = 1 - Math.pow(1 - t, 3);
            plaqueGroup.scale.set(plaqueScale * (ease * 1.1)); 
        } else if (time < 0.7) {
            const t = (time - 0.5) / 0.2;
            plaqueGroup.scale.set(plaqueScale * (1.1 - (0.1 * t))); 
        } else {
            // Фиксируем масштаб после пружинки, чтобы ресайз снова заработал
            plaqueGroup.isAnimating = false; 
        }

        // Счетчик денег
        if (time < duration) {
            const t = time / duration;
            const easeOut = 1 - Math.pow(1 - t, 3);
            currentBalance = Math.floor(winAmount * easeOut);
            balanceText.text = currentBalance.toLocaleString('ru-RU') + " €";
        } else {
            balanceText.text = winAmount.toLocaleString('ru-RU') + " €";
            plaqueGroup.isAnimating = true; // Включаем флаг для пульсации
            plaqueGroup.scale.set(plaqueScale * (1 + Math.sin(time * 10) * 0.02)); // Пульсация
        }
    };
    app.ticker.add(animTicker);

    // ==========================================
    // 7. ВОЗВРАЩАЕМ ФУНКЦИЮ ЗАКРЫТИЯ
    // ==========================================
    return function closePlaque() {
        window.removeEventListener('resize', onPlaqueResize); // Очищаем слушатель
        app.ticker.remove(animTicker);
        
        let closeProgress = 0;
        const closeTicker = (ticker) => {
            closeProgress += ticker.deltaTime / (0.2 * 60);
            if (closeProgress >= 1) {
                app.ticker.remove(closeTicker);
                popupContainer.destroy();
            } else {
                plaqueGroup.scale.set(plaqueScale * (1 - closeProgress));
                popupContainer.alpha = 1 - closeProgress;
            }
        };
        app.ticker.add(closeTicker);
    };
}

/**
 * Перемещает объект из текущей позиции в целевую с постоянной скоростью
 * @param {PIXI.DisplayObject} object - Объект
 * @param {number} targetX - Цель X
 * @param {number} targetY - Цель Y
 * @param {number} durationSeconds - Время в секундах
 * @param {Function} onComplete - Колбэк
 */
function moveToLinear(object, targetX, targetY, durationSeconds, onComplete) {
    // Останавливаем старый тикер, если он был
    if (object._moveTicker) app.ticker.remove(object._moveTicker);

    const startX = object.position.x;
    const startY = object.position.y;
    let progress = 0;

    object._moveTicker = (ticker) => {
        if (object.destroyed) return app.ticker.remove(object._moveTicker);

        progress += ticker.deltaTime / (durationSeconds * 60);

        if (progress >= 1) {
            object.position.set(targetX, targetY);
            app.ticker.remove(object._moveTicker);
            object._moveTicker = null;
            if (onComplete) onComplete();
        } else {
            // ЛИНЕЙНАЯ ФОРМУЛА:
            // Просто (цель - старт) * прогресс
            object.position.x = startX + (targetX - startX) * progress;
            object.position.y = startY + (targetY - startY) * progress;
        }
    };

    app.ticker.add(object._moveTicker);
}



function blurTransition(onPeak, durationIn = 0.3, durationOut = 0.5, maxBlur = 30) {
    // 1. Создаем фильтр размытия
    const blurFilter = new PIXI.BlurFilter();
    blurFilter.strengthX = 0;
    blurFilter.strengthY = 0; // Изначально размытия нет
    blurFilter.quality = 4; // Качество размытия (чем выше, тем красивее, но тяжелее для телефона)

    // Применяем фильтр ко ВСЕЙ сцене
    // Если на app.stage уже есть фильтры, добавляем к ним, иначе создаем новый массив
    app.stage.filters = (app.stage.filters || []).concat(blurFilter);

    // 2. БЛОКЕР КЛИКОВ (Невидимый щит)
    // Чтобы игрок не накликал лишнего, пока экран мыльный
    const clickBlocker = new PIXI.Graphics();
    clickBlocker.rect(-5000, -5000, 10000, 10000);
    // Альфа 0.001 делает его невидимым для глаза, но он всё равно ловит клики
    clickBlocker.fill({ color: 0x000000, alpha: 0.001 }); 
    clickBlocker.eventMode = 'static';
    app.stage.addChild(clickBlocker);

    let time = 0;
    let phase = 'in'; // 'in' - мылим, 'out' - фокусируем

    const blurTicker = (ticker) => {
        time += ticker.deltaTime / 60;

        if (phase === 'in') {
            // ФАЗА 1: Увеличиваем размытие
            let progress = time / durationIn;
            
            if (progress >= 1) {
                progress = 1;
                phase = 'out'; // Переключаем на выход
                time = 0;
                
                // ЭКРАН МАКСИМАЛЬНО РАЗМЫТ! МЕНЯЕМ СЦЕНУ!
                if (onPeak) onPeak();
            }
            
            // Плавное размытие
            const ease = progress * progress; // Quadratic ease-in
            blurFilter.strengthX  = maxBlur * ease;
            blurFilter.strengthy =  maxBlur * ease;

        } else if (phase === 'out') {
            // ФАЗА 2: Возвращаем фокус
            let progress = time / durationOut;
            
            if (progress >= 1) {
                // ЗАВЕРШЕНИЕ
                app.ticker.remove(blurTicker);
                clickBlocker.destroy(); // Убираем невидимый щит
                
                // Удаляем фильтр со сцены, чтобы не жрал батарею телефона
                app.stage.filters = app.stage.filters.filter(f => f !== blurFilter);
                if (app.stage.filters.length === 0) app.stage.filters = null;
                
            } else {
                // Плавная фокусировка (Ease-Out)
                const ease = 1 - Math.pow(1 - progress, 3);
                blurFilter.strength = maxBlur * (1 - ease);
            }
        }
    };

    app.ticker.add(blurTicker);
}


/**
 * Эффект ослепления (Flashbang) для смены сцены
 * @param {Function} onPeak - Функция, которая сработает в момент максимального ослепления (когда экран чисто белый)
 * @param {number} durationIn - Время вспышки (появления белого), в сек. (обычно очень быстро)
 * @param {number} durationOut - Время затухания (возвращения зрения), в сек. (обычно дольше)
 */
function flashTransition(onPeak, durationIn = 0.15, durationOut = 1.0 , duration = 0.2) {
    // 1. Создаем белый экран
    const flash = new PIXI.Graphics();
    
    // Рисуем гигантский квадрат, чтобы он гарантированно перекрыл всё, 
    // даже если камера сильно отдалена (zoom)
    flash.rect(-5000, -5000, 10000, 10000);
    flash.fill(0xFFFFFF); // Чисто белый цвет
    
    flash.alpha = 0;
    
    // БЛОКИРУЕМ КЛИКИ! 
    // Пока идет вспышка, игрок не должен случайно нажать на кнопки старой или новой сцены
    flash.eventMode = 'static'; 

    // Добавляем на сцену ПОВЕРХ ВСЕГО (в app.stage в самый конец)
    app.stage.addChild(flash);

    let time = 0;
    let phase = 'in'; // Две фазы: 'in' (ослепление) и 'out' (прозрение)

    const flashTicker = (ticker) => {
        time += ticker.deltaTime / 60;

        if (phase === 'in') {
            // ФАЗА 1: Резкая вспышка
            let progress = time / durationIn;
            
            if (progress >= 1) {
                progress = 1;

                phase = 'waite';

                setTimeout(()=>{
                    phase = 'out'; 
                    time = 0;      
                } , duration * 1000);

                
                // ЭКРАН ПОЛНОСТЬЮ БЕЛЫЙ! 
                // Вызываем код смены сцены, который ты передал
                if (onPeak) onPeak();
            }
            flash.alpha = progress;

        } else if (phase === 'out') {
            // ФАЗА 2: Плавное возвращение зрения
            let progress = time / durationOut;
            
            if (progress >= 1) {
                // Анимация закончена, убираем мусор
                app.ticker.remove(flashTicker);
                flash.destroy();
            } else {
                // Плавное затухание (Ease-Out) - глаз привыкает к свету
                const ease = 1 - Math.pow(1 - progress, 3);
                flash.alpha = 1 - ease;
            }
        }
    };

    app.ticker.add(flashTicker);
}


function jumpToX(object, targetX, jumpHeight, durationSeconds, onComplete) {
    // 1. Если объект уже прыгал/двигался этой функцией, останавливаем старый тикер
    if (object._jumpTicker) {
        app.ticker.remove(object._jumpTicker);
    }

    const startX = object.position.x;
    const startY = object.position.y; // Y начальный и конечный одинаковый
    let progress = 0;

    const jumpTicker = (ticker) => {
        // Защита: если объект удалили во время прыжка, прекращаем анимацию
        if (object.destroyed) {
            app.ticker.remove(jumpTicker);
            return;
        }

        progress += ticker.deltaTime / (durationSeconds * 60);

        if (progress >= 1) {
            // КОНЕЦ ПРЫЖКА
            object.position.set(targetX, startY); // Четко ставим в конечную точку
            app.ticker.remove(jumpTicker);
            object._jumpTicker = null;
            
            if (onComplete) onComplete();
        } else {

            const currentX = startX + (targetX - startX) * progress;

            const parabola = 4 * progress * (1 - progress);
            const currentY = startY - (jumpHeight * parabola);

            object.position.set(currentX, currentY);
        }
    };

    object._jumpTicker = jumpTicker;
    app.ticker.add(jumpTicker);
}


function showPhoneAnimation(onComplete) {
    const popupContainer = new PIXI.Container();
    
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.7 });
    dimmer.eventMode = 'static'; // Блокируем клики по игре
    popupContainer.addChild(dimmer);

    const phoneGroup = new PIXI.Container();
    phoneGroup.position.set(0, 1500); 
    popupContainer.addChild(phoneGroup);

    // 3. САМ ТЕЛЕФОН
    const phoneSprite = new PIXI.Sprite({ texture: phoneTex });
    phoneSprite.anchor.set(0.5);
    // Масштабируем, если картинка слишком большая
    phoneSprite.scale.set(1.4); 
    phoneGroup.addChild(phoneSprite);

    // ==========================================
    // 4. СЧЕТЧИК ДЕНЕГ (Под надписью Main)
    // ==========================================
    const moneyStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 70,
        fontWeight: 'bold',
        fill: '#ffffff', // Зеленый цвет денег
        dropShadow: { color: '#00aa00', alpha: 0.8, distance: 0, blur: 10 },
        align: 'center'
    });
    
    const moneyText = new PIXI.Text({ text: "0 €", style: moneyStyle });
    moneyText.anchor.set(0.5);
    // Подбери Y так, чтобы текст был ровно под словом Main на твоей картинке
    moneyText.position.set(0, -520); 
    phoneGroup.addChild(moneyText);

    // Логика бесконечного набора денег
    let currentMoney = 0;
    const moneyTicker = (ticker) => {
        // Капает по случайной сумме (от 10 до 50 евро за тик)
        currentMoney += (10 + Math.random() * 40) * (ticker.deltaTime / 60) * 60;
        moneyText.text = Math.floor(currentMoney).toLocaleString('ru-RU') + " €";
        
        // Легкая пульсация текста
        moneyText.scale.set(1 + Math.sin(currentMoney * 0.01) * 0.03);
    };
    app.ticker.add(moneyTicker);


    const notifContainer = new PIXI.Container();
    phoneGroup.addChild(notifContainer);

    const phoneScreenMask = new PIXI.Graphics();
    phoneScreenMask.roundRect(-450, -550, 1000, 950, 0); // Подгони размеры под экран твоего PNG
    phoneScreenMask.fill(0xffffff);
    phoneGroup.addChild(phoneScreenMask);
    notifContainer.mask = phoneScreenMask;

    let activeNotifs = [];
    const notifSpacing = 240; 
    const startNotifY = 60;   

    // Функция спавна одного уведомления
    function spawnNotification(isInitial = false) {
        const notif = new PIXI.Sprite({ texture: notifTex }); // Картинка уведомления
        notif.anchor.set(0.5);
        
        if (isInitial) {
            // Если это стартовые уведомления - ставим их сразу на нужные места
            notif.y = startNotifY + (activeNotifs.length * notifSpacing);
            notif.alpha = 1;
        } else {
            // Если это новое уведомление во время игры - оно вылетает сверху
            notif.y = startNotifY - 50; 
            notif.alpha = 0;
            notif.scale.set(2.5);
        }

        notifContainer.addChild(notif);

        activeNotifs.unshift(notif);

        let moveProgress = 0;
        const moveDuration = 1; // секунд на сдвиг

        // Запоминаем стартовые позиции ВСЕХ уведомлений перед началом сдвига
        const startPositions = activeNotifs.map(n => n.y);
        const startAlphas = activeNotifs.map(n => n.alpha);
        const startScales = activeNotifs.map(n => n.scale.x);

        const moveTicker = (ticker) => {
            if (notif.destroyed) return app.ticker.remove(moveTicker);

            moveProgress += ticker.deltaTime / (moveDuration * 60);

            if (moveProgress >= 1) {
                app.ticker.remove(moveTicker);
                
                // Проверяем: если уведомлений больше 4, удаляем самое нижнее
                if (activeNotifs.length > 4) {
                    const oldNotif = activeNotifs.pop(); // Берем последнее
                    oldNotif.destroy(); // Удаляем из памяти
                }
            } else {
                const ease = 1 - Math.pow(1 - moveProgress, 3); // Ease-out

                // Обновляем позиции ВСЕХ уведомлений в массиве
                activeNotifs.forEach((n, index) => {
                    const targetY = startNotifY + (index * notifSpacing);
                    

                    n.y = startPositions[index] + (targetY - startPositions[index]) * ease;
                    
                    // Если это НОВОЕ (index 0) - плавно показываем его
                    if (index === 0 && !isInitial) {
                        n.alpha = startAlphas[0] + (1 - startAlphas[0]) * ease;
                        n.scale.set(startScales[0] + (2 - startScales[0]) * ease);
                    }


                    if (index >= 3) {
                        n.alpha = 1 - ease;
                    }
                });
            }
        };
        
        if (!isInitial) {
            app.ticker.add(moveTicker);
        }
    }

    let notifTimer = setInterval(() => {
        spawnNotification(false);
        playSound(sms , 1);
    }, 1100);



    uiOverlayContainer.addChild(popupContainer);

    let appearProgress = 0;
    const startPhoneY = 1500;
    const targetPhoneY = 300; // Центр экрана

    const appearTicker = (ticker) => {
        appearProgress += ticker.deltaTime / (1.6 * 60); // Выезжает за 0.6 сек

        if (appearProgress >= 1) {
            phoneGroup.position.set(0, targetPhoneY);
            app.ticker.remove(appearTicker);
        } else {
            // Эффект пружинки при выезде
            const t = appearProgress - 1;
            const ease = (t * t * (3 * t + 2) + 1); 
            phoneGroup.position.y = startPhoneY + (targetPhoneY - startPhoneY) * ease;
        }
    };
    app.ticker.add(appearTicker);

    dimmer.cursor = 'pointer';
    setTimeout( () => {

        app.ticker.remove(moneyTicker);
        clearInterval(notifTimer);
        
        let closeProgress = 0;
        const closeTicker = (ticker) => {
            closeProgress += ticker.deltaTime / (0.3 * 60);
            if (closeProgress >= 1) {
                app.ticker.remove(closeTicker);
                popupContainer.destroy({ children: true });
                
                // ВЫЗЫВАЕМ КОЛЛБЭК, ЧТОБЫ ЗАВЕРШИТЬ PROMISE
                if (onComplete) onComplete(); 
                
            } else {
                popupContainer.alpha = 1 - closeProgress;
            }
        };
        app.ticker.add(closeTicker);
    } , 4300);
}

    function animateCamera(targetX, targetY, targetZoom, durationSeconds, onComplete) {
        // Если камера уже куда-то ехала, отменяем старую анимацию
        if (currentCameraTicker) {
            app.ticker.remove(currentCameraTicker);
        }

        const startX = cameraX;
        const startY = cameraY;
        const startZoom = cameraZoom;
        let progress = 0;

        currentCameraTicker = (ticker) => {
            progress += ticker.deltaTime / (durationSeconds * 60);

            if (progress >= 1) {
                // Анимация закончена
                cameraX = targetX;
                cameraY = targetY;
                cameraZoom = targetZoom;
                
                app.ticker.remove(currentCameraTicker);
                currentCameraTicker = null;
                resize(); // Применяем финальные значения
                
                if (onComplete) onComplete();
            } else {
                // Плавное торможение в конце (Cubic Ease-Out)
                const ease = 1 - Math.pow(1 - progress, 3);
                
                // Интерполируем (вычисляем промежуточные значения)
                cameraX = startX + (targetX - startX) * ease;
                cameraY = startY + (targetY - startY) * ease;
                cameraZoom = startZoom + (targetZoom - startZoom) * ease;
                
                resize(); // Вызываем ресайз каждый кадр, чтобы сдвинуть мир
            }
        };

        app.ticker.add(currentCameraTicker);
    }

function showTutorialHand(targetObject) {
    if (!targetObject) return;

    // Если рука уже есть на экране — удаляем старую
    if (currentTutorialHand) {
        if (currentTutorialHand._ticker) app.ticker.remove(currentTutorialHand._ticker);
        currentTutorialHand.destroy();
        currentTutorialHand = null;
    }

    const hand = new PIXI.Sprite({ texture: handTex }); 
    hand.rotation = -Math.PI / 6; 
    hand.eventMode = 'none'; 
    hand.anchor.set(0.3, 0.3); 

    const baseScale = 0.23; 
    hand.scale.set(baseScale);

    uiOverlayContainer.addChild(hand);

    let timer = 0;
    const moveDuration = 0.5;  

    const offsetX = 150;
    const offsetY = 150;

    const handTicker = (ticker) => {
        if (hand.destroyed || targetObject.destroyed) {
            return app.ticker.remove(handTicker);
        }

        timer += ticker.deltaTime / 60; 

        const globalPos = targetObject.getGlobalPosition();
        const localPos = uiOverlayContainer.toLocal(globalPos);

        const targetX = localPos.x;
        const targetY = localPos.y;

        if (timer < moveDuration) {
            const progress = timer / moveDuration;
            const ease = 1 - Math.pow(1 - progress, 3); 
            
            hand.position.set(
                targetX + offsetX * (1 - ease),
                targetY + offsetY * (1 - ease)
            );
        } else {
            // Бесконечная пульсация, пока игрок не кликнет
            hand.position.set(targetX, targetY); 
            const pulse = Math.sin((timer - moveDuration) * 15) * 0.05;
            hand.scale.set(baseScale + pulse);
        }
    };

    hand._ticker = handTicker;
    app.ticker.add(handTicker);
    
    currentTutorialHand = hand;
}


function hideTutorialHand() {
    if (currentTutorialHand) {
        if (currentTutorialHand._ticker) app.ticker.remove(currentTutorialHand._ticker);
        currentTutorialHand.destroy();
        currentTutorialHand = null;
    }
}

        function pressButton(object, callback) {
            if (object._pressTicker) return; // Защита от двойного клика

            const originalScale = object.scale.x;
            const pressedScale = originalScale * 0.9; 
            let progress = 0;
            
            const pressTicker = (ticker) => {
                if (object.destroyed) return app.ticker.remove(pressTicker);

                progress += ticker.deltaTime / (0.15 * 60);
                
                if (progress <= 0.5) {
                    const t = progress / 0.5;
                    object.scale.set(originalScale + (pressedScale - originalScale) * t);
                } else if (progress < 1) {
                    const t = (progress - 0.5) / 0.5;
                    object.scale.set(pressedScale + (originalScale - pressedScale) * t);
                } else {
                    object.scale.set(originalScale);
                    app.ticker.remove(pressTicker);
                    object._pressTicker = null;
                    if (callback) callback();
                }
            };

            object._pressTicker = pressTicker;
            app.ticker.add(pressTicker);
        }

function resize() {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            app.renderer.resize(sw, sh);

            const scaleX = sw / GAME_WIDTH;
            const scaleY = sh / GAME_HEIGHT;
            const baseZoom = Math.min(scaleX, scaleY);
            const finalGameScale = baseZoom * cameraZoom;

            // ОБЩАЯ ЛОГИКА ДЛЯ ВСЕХ СЛОЕВ
            cameraLayers.forEach(layer => {
                layer.scale.set(finalGameScale);
                layer.position.set(
                    sw / 2 - (cameraX * finalGameScale * layer.parallaxFactor),
                    sh / 2 - (cameraY * finalGameScale * layer.parallaxFactor)
                );
            });

            // --- АДАПТИВ UI КОНТЕЙНЕРА ---
            let uiScale = sh / GAME_HEIGHT;
            const aspectRatio = sw / sh;
            if (aspectRatio < 0.53) uiScale *= (aspectRatio / 0.53);

            uiOverlayContainer.scale.set(uiScale);
            uiOverlayContainer.position.set(sw / 2, sh / 2);

            const halfW = (sw / 2) / uiScale;
            const halfH = (sh / 2) / uiScale;
            const fullW = halfW * 2;

            const isPortrait = sw < sh; 

            headerContainer.position.set(0, -halfH);

            const headerHeight = 200; 

            headerBg.clear();
            headerBg.rect(-halfW, 0, fullW, headerHeight);
            headerBg.fill('#424242'); 

            // --- НАСТРОЙКИ ХЕДЕРА ---
            const paddingLeft = 40;  
            const paddingRight = 25;
            const paddingBetween = 40; 

            const logoHeightPercent = 0.7; 
            const balHeightPercent = 0.8;  

            // Вычисляем базовый масштаб
            let logoScl = (headerHeight * logoHeightPercent) / (logoSprite.texture.height || 100); 
            let balScl = (headerHeight * balHeightPercent) / (balancePanel.texture.height || 100);

            // ЗАЩИТА ОТ НАЛОЖЕНИЯ (Для очень узких экранов)
            const logoRealW = (logoSprite.texture.width || 100) * logoScl;
            const balRealW = (balancePanel.texture.width || 100) * balScl;
            const headerPadding = paddingLeft + paddingRight + paddingBetween; 
            
            // Если они шире экрана - уменьшаем их!
            if (logoRealW + balRealW + headerPadding > fullW) {
                const shrink = fullW / (logoRealW + balRealW + headerPadding);
                logoScl *= shrink;
                balScl *= shrink;
            }

            logoSprite.scale.set(logoScl);
            balancePanel.scale.set(balScl);

            // Расставляем по краям
            logoSprite.position.set(-halfW + paddingLeft, headerHeight / 2 - 10); 
            balancePanel.position.set(halfW - paddingRight, headerHeight / 2); 

            footerContainer.position.set(0, halfH);

            const footerHeight = isPortrait ? 650 : 380; 

            footerBg.clear();
            footerBg.rect(-halfW, -footerHeight, fullW, footerHeight);
            footerBg.fill('#343434'); 

            let btnScale = isPortrait ? 0.95 : 0.8;
            const buttonWidth = (goButton.texture.width || 100) * btnScale;

            if (buttonWidth > fullW - 80) {
                btnScale *= (fullW - 80) / buttonWidth;
            }

            goButton.scale.set(btnScale);
            goButton.position.set(0, -footerHeight / 2);
            
            if (typeof pushContainer !== 'undefined' && pushContainer && !pushContainer.destroyed) {
                const targetWidth = GAME_WIDTH * (isPortrait ? 0.9 : 0.8); 
                const pushScale = targetWidth / 980; 
                
                pushContainer.targetScale = pushScale;
                
                if (!pushContainer.isSpawning) {
                    pushContainer.scale.set(pushScale);
                }
            }

            if (disclaimer && disclaimer.parent) {
            disclaimer.position.set(0, halfH - 5);

            disclaimer.style.fontSize = (sw > sh) ? 21 : 28;
            }
        }
        window.addEventListener('resize', () => {
            focusCameraOnPlayer(true); 
        });

        focusCameraOnPlayer(true);

    } catch (e) {
        console.error("Playable Init Error:", e);
    }




};

function startApp() {
    init().catch(e => console.error(e));
}

if (typeof mraid !== "undefined") {
    if (mraid.getState() === "loading") {
        mraid.addEventListener("ready", startApp);
    } else {
        startApp();
    }
} else {
    startApp();
}
