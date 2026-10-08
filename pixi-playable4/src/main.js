import './style.css';
import * as PIXI from 'pixi.js';
import { Filter, GlProgram } from 'pixi.js';
import BGIMG from'./assets/background.webp';
import lukIMG from'./assets/luk.webp';
import goldLukIMG from'./assets/goldLuk.webp';
import bareerIMG from'./assets/bareer.webp';
import yellowCarIMG from'./assets/yellowCar.webp';
import playIMG from'./assets/playButton.png';
import betPanelImg from'./assets/panel.png';
import logoImg from'./assets/logo.webp';
import balanceImg from'./assets/balance.png';
import yellowButtonImg from './assets/yellowButton.png';
import bonusIMG from './assets/Bonus.png';
import endBGIMG from './assets/bgEnd.webp';
import chickenLogoIMG from './assets/ChickenLogo.webp';
import downloadButtonIMG from './assets/Download.webp';
import iceCarImg from './assets/Caricecream.webp';
import skullImg from './assets/skull.webp';
import jump from './assets/jumpSound.mp3';
import wheel from './assets/wheel.mp3';
import tormoz from './assets/tormoz.mp3';
import barSound from './assets/barSound.mp3';
import sms from './assets/sms.mp3';
import bgmMP3 from './assets/bgSound.mp3';
import handIMG from './assets/Hand.webp';
import pPoint from './assets/PlayerPointer.webp';
import greenCarIMG from './assets/GreenCar.png';
import hellMaskImg from './assets/HellMask.webp';
import hellBareerIMG from './assets/BarierHellTomb.webp';
import hellStreetIMG from './assets/hellStreet.webp';
import hellTextImg from './assets/hellText.webp';
import hellLukIMG from './assets/hellLuk.webp';
import carPoliceIMG from './assets/policeCar.png';
import iceCarHellIMG from './assets/carIceHell.webp';
import yellowCarHellIMG from './assets/yellowCarHell.webp';
import policeCarHellIMG from './assets/carPoliceHell.webp';
import trackCarHellIMG from './assets/carTrackHell.webp';
import phoneInnerIMG from './assets/bank.webp';
import phoneFrameIMG from './assets/smartphone.webp';




// ==========================================
// ГЛОБАЛЬНАЯ РАЗБЛОКИРОВКА АУДИО (iOS / Android)
// ==========================================
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

        // ✅ Сливаем очередь накопившихся звуков
        pendingSounds.forEach(({ soundUrl, volume }) => _playNow(soundUrl, volume));
        pendingSounds.length = 0;

        document.removeEventListener('touchstart', unlockAudioOnFirstTouch, true);
        document.removeEventListener('touchend',   unlockAudioOnFirstTouch, true);
        document.removeEventListener('click',       unlockAudioOnFirstTouch, true);
    }).catch(err => {
        console.warn("Попытка разблокировки аудио отклонена", err);
    });
}

// Вешаем слушатели на весь HTML документ
document.addEventListener('touchstart', unlockAudioOnFirstTouch, { once: true, passive: true });
document.addEventListener('touchend', unlockAudioOnFirstTouch, { once: true, passive: true });
document.addEventListener('click', unlockAudioOnFirstTouch, { once: true, passive: true });



// ==========================================
// 1. КОНФИГ И УТИЛИТЫ ПЛАТФОРМ
// ==========================================
//const STORE_URL = "https://play.google.com/store/apps/details?id=com.your.game"; 
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
    bgmAudio.volume = 0.6;
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

// ==========================================
// 3. ЛОКАЛИЗАЦИЯ
// ==========================================
function getT(key) {
    const defaultTranslations = { 
        "win": "WIN", 
        "install": "INSTALL NOW", 
        "disclaimer": "For illustrative purposes only",
        "claim": "CLAIM",
        "cashout": "CASH OUT",
        "welcome": "WELCOME BONUS",
        "play" : "PLAY",
        // ДОБАВЛЕННЫЕ СЛОВА ДЛЯ ФОЛЛБЭКА:
        "big_win": "BIG WIN",
        "download": "DOWNLOAD",
        "withdraw": "WITHDRAW",
        "go": "GO"
    };

    if (typeof buildConfig !== "undefined" && buildConfig.translations) {
        const lang = buildConfig.language || "EN";
        if (buildConfig.translations[lang] && buildConfig.translations[lang][key]) {
            return buildConfig.translations[lang][key];
        }
    }
    
    // Возвращаем перевод по умолчанию, или сам ключ, если перевода вообще нет
    return defaultTranslations[key] || key;
}


// Убрали footerTex и headerTex, так как мы рисуем их графикой!
    // Ровно 13 переменных и 13 загрузок
    const [
        backgroundTex, lukTex, goldLukTex, bareerTex, yellowCarTex,
        playButtonTex, logoTex, balanceTex, cashOutBtnTex, 
        betPanelTex , bonusTex , bgEndTex , chickenLogoTex, downloadButtonTex , iceCarTex,
        skullTex , handTex , pPointerTex , greenCarTex , cracksTex , hellBareerTex , hellStreetTex , hellTextTex,
        hellLukTex, policeCarTex , iceCarHellTex , policeCarHellTex , yellowCarHellTex , trackCarHellTex , phoneFrameTex , phoneInnerTex 
    ] = await Promise.all([
        loadTextureDirectly(BGIMG), 
        loadTextureDirectly(lukIMG),
        loadTextureDirectly(goldLukIMG), 
        loadTextureDirectly(bareerIMG), 
        loadTextureDirectly(yellowCarIMG),
        loadTextureDirectly(playIMG),         // playButtonTex (Кнопка GO)
        loadTextureDirectly(logoImg),         // logoTex
        loadTextureDirectly(balanceImg),      // balanceTex
        loadTextureDirectly(yellowButtonImg), // cashOutBtnTex
        loadTextureDirectly(betPanelImg),
        loadTextureDirectly(bonusIMG),
        loadTextureDirectly(endBGIMG),
        loadTextureDirectly(chickenLogoIMG),
        loadTextureDirectly(downloadButtonIMG),
        loadTextureDirectly(iceCarImg),
        loadTextureDirectly(skullImg),
        loadTextureDirectly(handIMG),
        loadTextureDirectly(pPoint),
        loadTextureDirectly(greenCarIMG),
        loadTextureDirectly(hellMaskImg),
        loadTextureDirectly(hellBareerIMG),
        loadTextureDirectly(hellStreetIMG),
        loadTextureDirectly(hellTextImg),
        loadTextureDirectly(hellLukIMG),
        loadTextureDirectly(carPoliceIMG),
        loadTextureDirectly(iceCarHellIMG),
        loadTextureDirectly(policeCarHellIMG),
        loadTextureDirectly(yellowCarHellIMG),
        loadTextureDirectly(trackCarHellIMG),
        loadTextureDirectly(phoneFrameIMG),
        loadTextureDirectly(phoneInnerIMG)
        // betPanelTex
    ]);

    let normalCars = [];
    let hellCars = [];


    // Заполняем массивы загруженными текстурами
    normalCars = [yellowCarTex, iceCarTex, greenCarTex, policeCarTex];
    hellCars = [yellowCarHellTex, iceCarHellTex, trackCarHellTex, policeCarHellTex];

    const car = new PIXI.Sprite({ texture: handTex});




    // --- СПРАВОЧНИК МАСШТАБОВ ДЛЯ МАШИН ---
// Здесь мы прописываем, во сколько раз нужно увеличить каждую конкретную картинку,
// чтобы они все смотрелись одинаково большими на дороге.
// (Подбери эти цифры экспериментально: если полиция маленькая - ставь 2.0 или 2.5)
const carScaleMap = new Map();

// Эту функцию мы вызовем ВНУТРИ init() после Promise.all
function setupCarScales() {
    // Обычные машины
    carScaleMap.set(yellowCarTex, 1.85); // Стандартный размер
    carScaleMap.set(iceCarTex, 1.5);    // Фургон мороженого
    carScaleMap.set(greenCarTex, 2.5);  // Зеленая
    carScaleMap.set(policeCarTex, 2.2); // Полиция была маленькой -> увеличиваем!

    // Адские машины
    carScaleMap.set(yellowCarHellTex, 2); // Адские чуть больше обычных
    carScaleMap.set(iceCarHellTex, 1.6);
    carScaleMap.set(trackCarHellTex, 2.0);  // Грузовик должен быть гигантским!
    carScaleMap.set(policeCarHellTex, 2.15); // Адская полиция
}

    setupCarScales();


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

    // 2. Получаем массив URL (в собранном билде это будут Base64 строки)
    // Если globObject возвращает модули (eager: true), возможно нужно брать .default, 
    // но если там сразу строки, оставляем как есть.
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
            
            // Если у тебя есть функция getAssetPath, можешь обернуть src в неё:
            // img.src = getAssetPath(src);
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

        //startBGM(); 


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

        
        // Глобальные переменные камеры

        
// Глобальные переменные камеры (теперь они будут считаться динамически!)
        let cameraX = 0; 
        let cameraY = 0; 
        let cameraZoom = 1.0;

        // Переменная для хранения текущей анимации камеры (чтобы отменять ее, если запустили новую)
        let currentCameraTicker = null;

        const cameraLayers = [];

/**
 * Хелпер для создания слоя с нужным параллаксом
        * @param {number} parallaxFactor 0 = стоит на месте, 1 = обычный мир
        */
        function createLayer(parallaxFactor) {
            const layer = new PIXI.Container();
            layer.parallaxFactor = parallaxFactor; // Запоминаем коэффициент
            app.stage.addChild(layer);
            cameraLayers.push(layer);
            return layer;
        }

        const transMP3 = null; // Заглушка для звука перехода

        // --- СЛОИ ИГРЫ ---

        const gameContainer = createLayer(1.0);


        

        // 2. ДОБАВЛЯЕМ ДОРОГУ ВНУТРЬ МИРА
        const backgroundSprite = new PIXI.Sprite({ texture: backgroundTex });
        backgroundSprite.anchor.set(0.5);

        // Ставим дорогу в центр или в начальные координаты (например 0, 0)
        backgroundSprite.position.set(-3500, 0);
        backgroundSprite.scale.set(3);
        gameContainer.addChild(backgroundSprite);

        
        const hellStreetSprite = new PIXI.Sprite({ texture: hellStreetTex});
        hellStreetSprite.anchor.set(0.5);
        hellStreetSprite.position.set(1105 , 30);
        hellStreetSprite.scale.set(0.46);
        backgroundSprite.addChild(hellStreetSprite);



        // Добавляем трещины в ту же группу
        const cracks = new PIXI.Sprite({ texture: cracksTex });
        cracks.scale.set(0.5);
        cracks.position.set(-300 , 0);
        cracks.anchor.set(0.5);
        cracks.blendMode = 'multiply';
        cracks.alpha = 0.6
        cracks.visible = false;
        backgroundSprite.addChild(cracks);

// Теперь в resize() тебе нужно будет масштабировать и двигать ТОЛЬКО roadGroup

        // 3. UI ПОВЕРХ ВСЕГО
        const uiOverlayContainer = new PIXI.Container();
        app.stage.addChild(uiOverlayContainer);

        const luksArray = [];
        const bareers = [];
        const monees = []
        const startX = -4770;
        const offset = 420;
        
        // Начальные суммы для люков (Индекс 1 - это бонус, там null)
        const initialAmounts = [1.3 , 1.7, 2, null, 2.3 , 3 , 3.2 , 3.5 , 4 , 4.2 , 4.5 , 4.7];

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

        for(let i = 0; i <= 8; i++) {
            // Создаем КОНТЕЙНЕР для люка (чтобы картинка и текст двигались вместе)
            const lukContainer = new PIXI.Container();
            lukContainer.position.set(i * offset + startX, 0);
            
            // Запоминаем текущую сумму в самом объекте (пригодится для умножения)
            lukContainer.currentAmount = initialAmounts[i] || 0;

            if (i === 3) {
                // адский люк
                const lukSprite = new PIXI.Sprite({ texture: hellLukTex }); // Убедись, что texture: bonusTex загружена!
                lukSprite.anchor.set(0.5);
                lukSprite.scale.set(1.4);
                
                lukContainer.addChild(lukSprite);

                
                // Текста тут нет
                lukContainer.textObj = null; 
                lukContainer.lukSprite = lukSprite; // Сохраняем ссылку на картинку
                
            } else {
                // ОБЫЧНЫЙ ЛЮК
                const lukSprite = new PIXI.Sprite({ texture: lukTex });
                lukSprite.anchor.set(0.5);
                lukSprite.scale.set(1.5);
                lukContainer.addChild(lukSprite);

                // Создаем ТЕКСТ с суммой
                const amountText = new PIXI.Text({
                    text: "x " + lukContainer.currentAmount,
                    style: amountStyle
                });
                amountText.anchor.set(0.5);
                amountText.position.set(0, 0); // По центру люка
                lukContainer.addChild(amountText);

                // Сохраняем ссылки внутри контейнера, чтобы менять их потом
                lukContainer.textObj = amountText;
                lukContainer.lukSprite = lukSprite;
            }

            const bareer1 = new PIXI.Sprite({ texture: bareerTex });
            bareer1.position.set(lukContainer.x - 150, lukContainer.y - 1070);
            bareer1.zIndex = 3;
            gameContainer.addChild(bareer1);

            bareers.push(bareer1)
            
            
            gameContainer.addChild(lukContainer);
            luksArray.push(lukContainer);
        }


        
        
        



        /**
 * Плавно умножает сумму на конкретном люке
 * @param {PIXI.Container} lukObj - Объект люка из массива (например, luksArray[0])
 * @param {number} multiplier - На сколько умножить (например, 5)
 * @param {number} duration - Длительность анимации прокрутки цифр (в секундах)
 */
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
            text: getT("disclaimer"),
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
        const hellIdleFrames = import.meta.glob('./assets/HellIdle/*.webp', { eager: true, import: 'default' });
        const hellDushFrames = import.meta.glob('./assets/HellDush/*.webp', { eager: true, import: 'default' });
        const hellJumpFrames = import.meta.glob('./assets/HellJump/*.webp', { eager: true, import: 'default' });
        const burnFrames = import.meta.glob('./assets/VFX/Burn/*.webp', { eager: true, import: 'default' });
        const winFrames = import.meta.glob('./assets/VFX/Win/*.webp', { eager: true, import: 'default' });
        

        const animIdle = await createAnimFromFolder(idleFrames, 0.4, true);
        const animJump = await createAnimFromFolder(jumpFrames, 0.4, true);
        const animBurn = await createAnimFromFolder(burnFrames, 0.4, true);
        const animHellIdle = await createAnimFromFolder(hellIdleFrames, 0.4, true);
        const animTransition = await createAnimFromFolder(burnFrames, 0.4, true);
        const animDush = await createAnimFromFolder(hellDushFrames, 0.4, true);
        const animHellJump = await createAnimFromFolder(hellJumpFrames, 0.4, true);
        const animWin = await createAnimFromFolder(winFrames, 0.4, true);
        //const animDushBurn = await createAnimFromFolder(burnFrames, 0.4, true);

        animJump.loop = false;
        animTransition.loop = false;
        animIdle.animationSpeed = 0.25;
        animJump.animationSpeed = 0.15;


        

const player = new PIXI.Container();
        player.position.set(-5170, -140);
        player.scale.set(1.35);

        player.addChild(animIdle);
        player.addChild(animJump);
        player.addChild(animBurn);
        player.addChild(animHellIdle);
        player.addChild(animDush);
        player.addChild(animHellJump);
        

        // ==========================================
        // 1. ПЛАШКА С ДЕНЬГАМИ ПОД КУРИЦЕЙ
        // ==========================================
        const playerMoneyTag = new PIXI.Container();
        
        // Смещаем плашку ВНИЗ под курицу (подбери Y под свои картинки)
        // Так как масштаб игрока 0.3, координаты внутри него нужно делать большими (например 400)
        playerMoneyTag.position.set(0, 200); 
        
        // Изначально плашка полностью прозрачна (появится после первого прыжка)
        playerMoneyTag.alpha = 0; 
        player.addChild(playerMoneyTag);

        // --- Темный фон плашки (закругленный прямоугольник) ---
        const tagBg = new PIXI.Sprite({ texture: pPointerTex });
        tagBg.anchor.set(0.5);
        tagBg.scale.set(0.25,  0.2);

        tagBg.tint = '#a876bc'; // Аметистовый фиолетовый

        
        playerMoneyTag.addChild(tagBg);


        // --- Текст с суммой ---
        const playerMoneyStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen', // Твой шрифт
            fontSize: 35,
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

// 2. Установи zIndex (чем выше число, тем ближе к игроку)
        player.zIndex = 10;    // Курица всегда высоко
        // Для барьеров:
        //bareer1.zIndex = 5;    // Барьер ниже курицы

        gameContainer.addChild(player);

        // 5. НАСТРАИВАЕМ НАЧАЛЬНОЕ СОСТОЯНИЕ (Стоит)
        animIdle.visible = true;
        animIdle.play();

        animBurn.visible = false;
        animBurn.stop();

        animHellIdle.visible = false;
        animHellIdle.stop();

        animHellJump.visible = false;
        animHellJump.stop();

        animDush.visible = false;
        animDush.stop();

        animBurn.position.set(0 , -200);

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
        const blueStripBg = new PIXI.Graphics();
        
        const stripShine = new PIXI.Graphics();
        //stripShine.blendMode = 'add'; // Сделает блик ярким и светящимся
        stripShine.eventMode = 'none';
        

        // Добавляем в футер (самым последним, чтобы он был поверх полосы)
        //footerContainer.addChild(stripShine);// Голубая полоска бонуса
        
        // НОВЫЙ ОБЪЕКТ ДЛЯ СВЕЧЕНИЯ
        const blueStripGlow = new PIXI.Graphics(); 

        const glowBg = new PIXI.Graphics();
        //footerContainer.addChild(glowBg);
        
        const shineEffect = new PIXI.Graphics();
        footerContainer.addChild(shineEffect);
        shineEffect.zIndex = 10; // добавь ПОСЛЕ blueStripBg// добавить ДО blueStripBg, чтобы полоса рисовалась поверх
        
        // Настраиваем свечение один раз
        const stripBlur = new PIXI.BlurFilter({ strength: 12, quality: 3 });
        blueStripGlow.filters = [stripBlur];
        blueStripGlow.blendMode = 'add'; // Магия: заставляет цвет светиться как неон

        // Добавляем glow ПОВЕРХ blueStripBg
        footerContainer.addChild(footerBg);

        // Блокируем клики по фонам
        headerBg.eventMode = 'none';
        footerBg.eventMode = 'none';
        blueStripGlow.eventMode = 'none';


        const logoSprite = new PIXI.Sprite({ texture: logoTex }); // Замени на свою текстуру
        logoSprite.anchor.set(0, 0.5); // Якорь слева по центру
        headerContainer.addChild(logoSprite);

        // Баланс (По центру/Справа)
        const balancePanel = new PIXI.Sprite({ texture: balanceTex }); 
        balancePanel.anchor.set(1, 0.5); // Якорь справа
        headerContainer.addChild(balancePanel);

        const balanceText = new PIXI.Text({
            text: "0.00       EUR",
            style: { fontFamily: 'Arial', fontSize: 50, fill: '#ffffff', align: 'center' , fontWeight: 'bold', lineHeight: 100}
        });
        balanceText.anchor.set(0.5);
        balanceText.position.set(-320 , 0);
        balanceTex.zIndex = 20;

        balancePanel.addChild(balanceText);

        // --- ФУТЕР ---
        // Текст на голубой полоске
        const bonusText = new PIXI.Text({
            text: "1500€ DEPOSIT BONUS + 250 FREE SPINS",
            style: {
                fontFamily: 'Arial',
                fontSize: 28,
                fill: '#ffffff',
                align: 'center',
                fontWeight: 'bold',
                dropShadow: {
                    color: '#003d55',
                    alpha: 0.8,
                    angle: Math.PI / 2,  // тень строго вниз
                    distance: 4,
                    blur: 6
                }
            }
        });
        bonusText.anchor.set(0.5);
        //footerContainer.addChild(bonusText);

        // После создания bonusText — добавь счётчик времени
        let bonusBreathTime = 0;

        // В игровом тике (app.ticker.add или где у тебя главный loop):
        app.ticker.add((delta) => {
            bonusBreathTime += delta.deltaTime * 0.03; // 0.03 = скорость дыхания
            
            const breathScale = 1 + Math.sin(bonusBreathTime) * 0.04; // 0.04 = амплитуда ±4%
            bonusText.scale.set(breathScale);
        });

        const goStyle = {
            fontFamily: 'Arial', // Совет: 'Arial Black' еще жирнее сам по себе
            fontSize: 110,
            fontWeight: '900', // 900 — это максимально возможная жирность (Black)
            fill: '#ffffff',
            
            // МАГИЯ ЖИРНОСТИ:
            stroke: { color: '#ffffff', width: 2 }, // Обводка в цвет текста
            lineJoin: 'round', // Скругляем углы, чтобы буквы не были "колючими"
            
            dropShadow: { color: '#000000', alpha: 0.4, distance: 4, blur: 4 }
        };

        const cashOutStyle = {
            fontFamily: 'Arial',
            fontSize: 65,
            fontWeight: '900', // Максимальная жирность
            fill: '#000000',
            align: 'center',
            lineHeight: 80, // Немного уменьшил, чтобы при жирности строки не разлетались
            
            // МАГИЯ ЖИРНОСТИ:
            stroke: { color: '#000000', width: 2 }, // Обводка в цвет текста
            lineJoin: 'round'
        };

        let currentTutorialHand = null;

        // Кнопка GO (Правый нижний угол)
        const goButton = new PIXI.Sprite({ texture: playButtonTex });
        goButton.anchor.set(0.5);
        goButton.eventMode = 'static';
        footerContainer.addChild(goButton);

        // Кнопка CASH OUT (Левый нижний угол)
        const cashOutButton = new PIXI.Sprite({ texture: cashOutBtnTex });
        cashOutButton.scale.set(1 , 1.3);
        cashOutButton.anchor.set(0.5);
        footerContainer.addChild(cashOutButton);

        const textObj = new PIXI.Text({ text: getT("go").toUpperCase(), style: goStyle });
        textObj.anchor.set(0.5); // Текст тоже строго по центру

        goButton.addChild(textObj);

        let currentCashOutAmount = 0;
        
        // Форматируем текст в 3 строки: CASH OUT \n Сумма \n EUR
        const cashOutText = `${getT("cashout")}\n${currentCashOutAmount.toFixed(2)}\nEUR`;
        

        const cashText = new PIXI.Text({ text: cashOutText , style: cashOutStyle });
        cashText.scale.set(1 , 1.3);
        cashText.anchor.set(0.5); // Текст тоже строго по центру
        cashOutButton.addChild(cashText);

        // В конце секции blueStrip — запомни параметры для анимации


        let shineX = 0; // текущая позиция блика

        /*
        app.ticker.add((delta) => {
            // --- ДЫХАНИЕ ТЕКСТА ---
            bonusBreathTime += delta.deltaTime * 0.03;
            const s = Math.sin(bonusBreathTime);
            bonusText.scale.set(1 + s * 0.04);
            //bonusText.alpha = 0.85 + s * 0.15;

            // --- БЕГУЩИЙ БЛИК ---
            if (!shineEffect.stripY) return;

            const { stripY, stripHeight, halfW, fullW } = shineEffect;
            const shineWidth = fullW * 0.65; // ширина блика — 25% от полосы

            // Двигаем справа налево
// Двигаем слева направо
            shineX += delta.deltaTime * 30;

            // Когда блик ушёл за правый край — перезапускаем слева
            if (shineX > halfW + shineWidth) {
                shineX = -halfW - shineWidth - 3000;
            }

            // Рисуем блик
            shineEffect.clear();

            const shineGradient = new PIXI.FillGradient({
                type: 'linear',
                start: { x: 0, y: 0 },
                end:   { x: 1, y: 0 }, // горизонтальный градиент
                colorStops: [
                    { offset: 0,    color: '#ffffff00'},
                    { offset: 0.25,    color: '#ffffff30'},
                    { offset: 0.5,  color: '#ffffff90' }, // центр — самый яркий
                    { offset: 0.75,    color: '#ffffff30'},
                    { offset: 1,    color: '#ffffff00' },
                ]
            });

            shineEffect.rect(shineX - shineWidth / 2, stripY, shineWidth, stripHeight);
            shineEffect.fill(shineGradient);
        });

        */







        // Ряд с монетками (Группируем в контейнер для удобства)


        // Панель MIN / 10 / MAX
        const betPanel = new PIXI.Sprite({ texture: betPanelTex });
        betPanel.anchor.set(0.5);
        footerContainer.addChild(betPanel);

        // ==========================================
        // 4. ПАНЕЛЬ ЭНЕРГИИ / ЯРОСТИ (Progress Bar Area)
        // ==========================================
        const topBarContainer = new PIXI.Container();
        footerContainer.addChild(topBarContainer);

        const barWidth = 900;
        const barHeight = 60;
        const barRadius = 30;

        // --- Заголовок (RAGE / ENERGY) ---
        const modeTitleStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen', fontSize: 48, fontWeight: 'bold', fill: '#ffffff',
            dropShadow: { color: '#000000', alpha: 0.5, distance: 2, blur: 2 }
        });
        const modeTitle = new PIXI.Text({ text: "ENERGY", style: modeTitleStyle });
        modeTitle.anchor.set(0, 0.5);
        modeTitle.position.set(-barWidth / 2 + 10, -60);
        topBarContainer.addChild(modeTitle);

        // --- Темный фон (трек) прогресс-бара ---
        const barTrack = new PIXI.Graphics();
        barTrack.roundRect(-barWidth / 2, 0, barWidth, barHeight, barRadius);
        barTrack.fill({ color: '#66666c' }); // Очень темный сине-серый
        // Эффект вдавленности (тень внутри)
        barTrack.stroke({ color: 0x111111, width: 4, alignment: 1 });
        topBarContainer.addChild(barTrack);

        // --- Цветная заливка бара (Сам прогресс) ---
        const barFill = new PIXI.Graphics();
        topBarContainer.addChild(barFill);

        // --- Маска для заливки (чтобы углы были круглыми при любом % заполнения) ---
        const barMask = new PIXI.Graphics();
        topBarContainer.addChild(barMask);
        barFill.mask = barMask;

        // --- Три маленькие кнопки статусов ---
        const subButtons = [];
        const subBtnsContainer = new PIXI.Container();
        subBtnsContainer.position.set(barWidth / 2, -60); // Привязываем к правому краю бара
        topBarContainer.addChild(subBtnsContainer);

        // Функция создания одной маленькой кнопки
        function createSubButton() {
            const btn = new PIXI.Container();
            const bg = new PIXI.Graphics();
            btn.addChild(bg);

            const txt = new PIXI.Text({ text: "", style: { fontFamily: 'Arial', fontSize: 28, fontWeight: 'bold', fill: '#ffffff' }});
            txt.anchor.set(0.5);
            btn.addChild(txt);

            btn.bg = bg;
            btn.txt = txt;
            return btn;
        }

        // Создаем 3 кнопки и расставляем их справа налево
        let currentSubBtnX = 0;
        for (let i = 2; i >= 0; i--) {
            const btn = createSubButton();
            subButtons[i] = btn;
            subBtnsContainer.addChild(btn);
        }

        // ==========================================
        // 5. МЕТОДЫ УПРАВЛЕНИЯ ПАНЕЛЬЮ
        // ==========================================
        let isHellMode = false;
        let currentBarValue = 1.0; // От 0.0 до 1.0

        // Градиенты для двух режимов
        const energyGradient = new PIXI.FillGradient({
            type: 'linear', start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, textureSpace: 'local',
            colorStops: [{ offset: 0, color: '#4CAF50' }, { offset: 1, color: '#8BC34A' }] // Зеленый
        });
        const rageGradient = new PIXI.FillGradient({
            type: 'linear', start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, textureSpace: 'local',
            colorStops: [{ offset: 0, color: '#ff0000' }, { offset: 1, color: '#ff8800' }] // Красно-оранжевый
        });

        // 1. Метод ПЕРЕКЛЮЧЕНИЯ РЕЖИМА (Обычный / Адский)
        function setBarMode(hellMode) {
            isHellMode = hellMode;
            modeTitle.text = isHellMode ? "RAGE" : "ENERGY";

            const labels = isHellMode ? ["DASH", "SMASH", "RAGE GUARD"] : ["WALK", "RUN", "JUMP"];
            
            // Обновляем тексты и ширину маленьких кнопок
            currentSubBtnX = 0;
            for (let i = 2; i >= 0; i--) {
                const btn = subButtons[i];
                btn.txt.text = labels[i];
                const w = btn.txt.width + 110; // Ширина текста + отступы
                
                // Рисуем базовый темный фон кнопки
                btn.bg.clear();
                btn.bg.roundRect(-w/2, -70, w, 40, 10);
                btn.bg.fill({ color:'#66666c' }); // Темно-серый по умолчанию
                
                // Сдвигаем кнопку влево
                currentSubBtnX -= (w / 2);
                btn.position.set(currentSubBtnX, 0);
                currentSubBtnX -= (w / 2 + 15); // Отступ между кнопками
            }

            // Перерисовываем саму полосу с нужным градиентом
            barFill.clear();
            barFill.rect(-barWidth / 2, 0, barWidth, barHeight);
            barFill.fill(isHellMode ? rageGradient : energyGradient);
            
            // Внутреннее свечение полосы (Highlight)
            barFill.rect(-barWidth / 2, 0, barWidth, 6);
            barFill.fill({ color: 0xffffff, alpha: 0.3 });

            // Сбрасываем подсветку кнопок при смене режима
            setSubButtonActive(0, false);
            setSubButtonActive(1, false);
            setSubButtonActive(2, false);
        }

        // 2. Метод ПОДСВЕТКИ КНОПОК (0, 1 или 2)
        window.setSubButtonActive = function(index, isActive) {
            const btn = subButtons[index];
            if (!btn) return;

            const w = btn.txt.width + 95;
            btn.bg.clear();
            btn.bg.roundRect(-w/2, -30, w, 60, 10);

            if (isActive) {
                // Если активно - красим в красный (Ярость) или зеленый (Энергия)
                btn.bg.fill(isHellMode ? '#d32f2f' : '#4CAF50'); // Темно-красный или Зеленый
            } else {
                btn.bg.fill({ color: '#5d5b70'}); // Возвращаем серый
            }
        };

        // 3. Метод ИЗМЕНЕНИЯ ЗНАЧЕНИЯ ПОЛОСЫ (с анимацией)
        window.setBarValue = function(targetValue, durationSec = 0.5) {
            // Ограничиваем от 0 до 1
            targetValue = Math.max(0, Math.min(1, targetValue)); 
            
            if (topBarContainer._barTicker) app.ticker.remove(topBarContainer._barTicker);

            const startValue = currentBarValue;
            let progress = 0;

            topBarContainer._barTicker = (ticker) => {
                progress += ticker.deltaTime / (durationSec * 60);

                let val = targetValue;
                if (progress < 1) {
                    const ease = 1 - Math.pow(1 - progress, 3);
                    val = startValue + (targetValue - startValue) * ease;
                } else {
                    app.ticker.remove(topBarContainer._barTicker);
                    currentBarValue = targetValue;
                }

                // Перерисовываем маску (обрезаем полосу)
                barMask.clear();
                // Ширина маски зависит от значения val (0...1)
                barMask.roundRect(-barWidth / 2, 0, barWidth * val, barHeight, barRadius);
                barMask.fill(0xffffff);
            };
            app.ticker.add(topBarContainer._barTicker);
        };

        // --- ИНИЦИАЛИЗАЦИЯ ПРИ СТАРТЕ ---
        setBarMode(false); // Включаем "ENERGY"
        setBarValue(1.0, 0.1); // Заполняем на 100%


        


        // Функция для умной паузы (заменяет setTimeout)
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Обертки для твоих функций анимации, чтобы можно было использовать await
        const jumpAsync = (obj, x, y, time) => new Promise(res => jumpToX(obj, x, y, time, res));
        const moveAsync = (obj, targetX, targetY, time) => new Promise(res => moveToLinear(obj, targetX, targetY, time, res));
        const flashAsync = (timeIn, timeOut) => new Promise(res => flashTransition(res, timeIn, timeOut));
        const blurAsync = (timeIn, timeOut, blur) => new Promise(res => blurTransition(res, timeIn, timeOut, blur));
        const wheelAsync = () => new Promise(res => showWheelOfFortune(res));
        const twistAsync = (duration) => new Promise(res => twistTransition(res, duration));
        const phoneAsync = () => new Promise(res => showPhoneAnimation(res)); // <--- Вот так правильно!


        const car = new PIXI.Sprite({ texture: iceCarTex });
        car.scale.set(1.5);
        car.position.set(luksArray[1].x - 110, luksArray[1].y - 1670);
        gameContainer.addChild(car);

        const Icecar = new PIXI.Sprite({ texture: iceCarTex });
        Icecar.scale.set(1.5);
        Icecar.position.set(luksArray[4].x - 110, luksArray[4].y - 1670);
        gameContainer.addChild(Icecar);


        // Вызываем руку, чтобы она показала на кнопку GO


        showTutorialHand(goButton);

        

        
                

        moveAsync(car, luksArray[1].x - 110, luksArray[1].y + 650, 1.3);
        



        // ==========================================
        // ЛОГИКА ПРЫЖКА
        // ==========================================
// 1. Создаем блокировщик, чтобы игрок не сломал игру, нажав кнопку 5 раз подряд во время прыжка
        let isActionLocked = false;

        // 2. Счетчик текущего шага (какой по счету прыжок сейчас будет)
        let currentJumpStep = 0;

        // 3. МАССИВ ШАГОВ (Здесь живет вся логика. Хочешь 3-й прыжок? Просто добавь еще одну функцию сюда!)
const gameSteps = [
            
            // ==========================================
            // ШАГ 0: ПЕРВЫЙ ПРЫЖОК (КАМЕРА СТОИТ)
            // ==========================================
            async function() {
                hideTutorialHand();
                animIdle.visible = false;
                animIdle.stop();
                animJump.visible = true;
                startCarTraffic();
                currentChickenLane = 1; // Теперь курица на 1-й дорожке
                animJump.animationSpeed = 0.35;
                //spawnPushNotification("18017.3", -800); 
                animJump.gotoAndPlay(0);
                focusCameraOnPlayer(false);

                animJump.onComplete = () => {
                    console.log("Анимация прыжка завершена!");
                    // Здесь можно вернуть персонажа в Idle или запустить следующую логику
                    animJump.visible = false;
                    animIdle.visible = true;
                animIdle.play();
                }

                //showWinPlaque(11760);
                //showWinPlaque(18017.3 , 5);

                

                //showEndCard();

                //showPhoneAnimation(10015.23);



                

                await wait(500); 
                
                playSound(jump);
                // Прыгаем, но камеру не двигаем!
                await jumpAsync(player, player.x + 400, 100, 0.3); 


                


                setSubButtonActive(2, true);
                setBarValue(0.9)

                setMoneyToPlayer(6, 0.5); 
                
                const targetLuk = luksArray[0];
                flipLukTexture(targetLuk, goldLukTex, 0.4);


                cashText.text = `${getT("cashout")}\n${6.00.toFixed(2)}\nEUR`;
                // Использование .toFixed(2) гарантирует, что всегда будет 6.00, а не 6
                balanceText.text = `${(6.00).toFixed(2)}        EUR`;
                
                
                moveAsync(bareers[0], targetLuk.x - 150, targetLuk.y - 340, 0.2);
                playSound(barSound);

                const car = new PIXI.Sprite({ texture: iceCarTex });
                car.scale.set(1.5);
                car.position.set(targetLuk.x - 110, targetLuk.y - 1970);
                gameContainer.addChild(car);

                await moveAsync(car, targetLuk.x - 110, targetLuk.y - 750, 0.3);

                await wait(1000); 
                



                
                animIdle.gotoAndPlay(4);
                showTutorialHand(goButton);
            },

            // ==========================================
            // ШАГ 1: ВТОРОЙ ПРЫЖОК (КАМЕРА ЕДЕТ)
            // ==========================================
            async function() {
                animIdle.visible = false;
                animJump.visible = true;
                animJump.gotoAndPlay(0);
                hideTutorialHand();

                currentChickenLane = 2;

                


                await wait(500); 
                
                playSound(jump);
                // СИНХРОННАЯ КАМЕРА: Запускаем камеру на ту же точку и то же время (0.5 сек)
                //animateCamera(player.x + 400, cameraY, cameraZoom, 0.5);
                focusCameraOnPlayer(false);
                await jumpAsync(player, player.x + 400, 100, 0.3);


                cashText.text = `${getT("cashout")}\n${10.20.toFixed(2)}\nEUR`;

                setMoneyToPlayer(10.20 , 0.5); 

                // Использование .toFixed(2) гарантирует, что всегда будет 6.00, а не 6
                balanceText.text = `${(10.20).toFixed(2)}        EUR`;
            
                



                
                const targetLuk = luksArray[1];
                flipLukTexture(targetLuk, goldLukTex, 0.4);

                moveAsync(bareers[1], targetLuk.x - 150, targetLuk.y - 340, 0.2);
                playSound(barSound);



                const car = new PIXI.Sprite({ texture: yellowCarTex });
                car.scale.set(1.5);
                car.position.set(targetLuk.x - 110, targetLuk.y - 1970);
                gameContainer.addChild(car);
                
                playSound(tormoz);
                await moveAsync(car, targetLuk.x - 110, targetLuk.y - 650, 0.3);

                

                await wait(400);

                //await flashAsync(0.1, 0.1);  
                //await wheelAsync();          
                //await blurAsync(0.6, 0.8, 10); 

                await wait(1000); 
                setBarValue(0.8)

                animIdle.gotoAndPlay(4);
                showTutorialHand(goButton);
            },

            // ==========================================
            // ШАГ 2: ТРЕТИЙ ПРЫЖОК (КАМЕРА ЕДЕТ)
            // ==========================================
            async function() {
                hideTutorialHand();
                currentChickenLane = 3;
                animIdle.visible = false;
                animJump.visible = true;
                animJump.gotoAndPlay(0);

                

                await wait(500); 
                
                playSound(jump);
                // СИНХРОННАЯ КАМЕРА
                //animateCamera(player.x + 450, cameraY, cameraZoom, 0.5);
                focusCameraOnPlayer(false);
                await jumpAsync(player, player.x + 450, 100, 0.3);

                setMoneyToPlayer(20.40 , 0.5); 
                cashText.text = `${getT("cashout")}\n${20.40.toFixed(2)}\nEUR`;
                balanceText.text = `${20.40}        EUR`;


                
                const targetLuk = luksArray[2];
                flipLukTexture(targetLuk, goldLukTex, 0.4);

                hideLukText(targetLuk); 

                const car = new PIXI.Sprite({ texture: greenCarTex });
                car.scale.set(2.5);
                car.position.set(targetLuk.x - 110, targetLuk.y - 1970);
                gameContainer.addChild(car);

                
                
                moveAsync(bareers[2], targetLuk.x - 150, targetLuk.y - 340, 0.2);
                playSound(barSound);

                await moveAsync(car, targetLuk.x - 110, targetLuk.y - 750, 0.3);


                await wait(1000); 

                setBarValue(0.7)
                
                animJump.visible = false;
                animIdle.visible = true;
                animIdle.gotoAndPlay(4);
                showTutorialHand(goButton);
            },

            // ==========================================
            // ШАГ 3: ЧЕТВЕРТЫЙ ПРЫЖОК (КАМЕРА ЕДЕТ)
            // ==========================================
            async function() {
                currentChickenLane = 4;
                hellJumpFrames
                //carSpawnDistance = 1; 
                hideTutorialHand();
                animIdle.visible = false;
                animJump.visible = true;
                animJump.gotoAndPlay(0);

                

                await wait(500); 
                
                playSound(jump);
                // СИНХРОННАЯ КАМЕРА
                //animateCamera(player.x + 450, cameraY, cameraZoom, 0.5);
                focusCameraOnPlayer(false);
                await jumpAsync(player, player.x + 450, 100, 0.5);


                playNetherTransition();
                setBarValue(1)
                isHellTraffic = true;

                


                

                
                
                const targetLuk = luksArray[3];

                //hideLukText(targetLuk);

                
                moveAsync(bareers[3], targetLuk.x - 150, targetLuk.y - 340, 0.2);
                playSound(barSound);


                const car = new PIXI.Sprite({ texture: policeCarTex });
                car.scale.set(2.5);
                car.position.set(targetLuk.x - 110, targetLuk.y - 1970);
                gameContainer.addChild(car);

                await moveAsync(car, targetLuk.x - 110, targetLuk.y - 750, 0.3);

                multiplyLukAmount(luksArray[4], 5, 1);


                // Я УДАЛИЛ ОТСЮДА СТАРЫЙ ВЫЗОВ animateCamera, ОН ТЕПЕРЬ НЕ НУЖЕН

                await wait(1000); 

                showTutorialHand(goButton);

                
                animIdle.visible = false;
                animJump.visible = false;
            },

            // ==========================================
            // ШАГ 4: ПЯТЫЙ ПРЫЖОК (КАМЕРА ЕДЕТ) мини дэш
            // ==========================================
            async function() {
                hideTutorialHand();
                currentChickenLane = 5;
                

                

                animHellIdle.visible = false;
                animDush.visible = true;
                animDush.gotoAndPlay(0);
                animBurn.angle = -90; // Повернуть ровно на 90 градусов
                animBurn.position.set(-185 , 0);
                animBurn.gotoAndPlay(0);
                animDush.loop = false;

                animDush.onComplete = () => {
                    console.log("Анимация прыжка завершена!");
                    // Здесь можно вернуть персонажа в Idle или запустить следующую логику
                    animDush.visible = false;
                    animHellIdle.visible = true;
                    animHellIdle.play();
                    animBurn.visible = false;
                }


                

                await wait(500); 
                
                playSound(jump);

                focusCameraOnPlayer(false);
                // СИНХРОННАЯ КАМЕРА
                //animateCamera(player.x + 450, cameraY, cameraZoom, 0.5);

                await jumpAsync(player, player.x + 365, 0, 0.5);
                setBarValue(0.8)

                setMoneyToPlayer(717.28 , 3.5); 
                cashText.text = `${getT("cashout")}\n${717.28}\nEUR`;
                // Использование .toFixed(2) гарантирует, что всегда будет 6.00, а не 6
                balanceText.text = `${(717.28).toFixed(2)}        EUR`;

                

                
                Icecar.scale.set(1.5);
                Icecar.position.set(luksArray[4].x - 110, luksArray[4].y - 1670);
                //gameContainer.addChild(Icecar);
                
                const targetLuk = luksArray[4];

                flipLukTexture(targetLuk, goldLukTex, 0.4);
                targetLuk.lukSprite.texture = goldLukTex;
                hideLukText(targetLuk);
                 // Исправлено на lukSprite.texture
                
                
                moveAsync(bareers[4], targetLuk.x - 150 + 30, targetLuk.y - 440, 0.2);
                playSound(barSound);

                playSound(tormoz);
                await moveAsync(Icecar, luksArray[4].x - 110, luksArray[4].y - 750, 0.7);


                await wait(1000); 
                

                setSubButtonActive(0, true);
                
                showTutorialHand(goButton);
            },


            async function() {
                animHellIdle.visible = false;
                animHellJump.visible = true;
                animHellJump.gotoAndPlay(0);
                animBurn.visible = true;
                animBurn.gotoAndPlay(0);
                currentChickenLane = 6;

                animBurn.onComplete = () => {
                    animBurn.visible = false;

                }

                //playerMoneyTag.visible = false;

                await wait(500); 
                playSound(jump);
                focusCameraOnPlayer(false);
                
                // Прыгаем, но камеру НЕ ДВИГАЕМ
                await jumpAsync(player, player.x + 430, 100, 0.5);


                setBarValue(0.8)

                setSubButtonActive(1, true);
                setSubButtonActive(0, false);

                const targetLuk = luksArray[5];
                flipLukTexture(targetLuk, goldLukTex, 0.4);


                animHellIdle.visible = true;
                animHellJump.visible = false;

                moveAsync(bareers[5], targetLuk.x - 150 + 30, targetLuk.y - 440, 0.2);
                playSound(barSound);

                // --- 2. ЖДЕМ КЛИКА ПО CASH OUT ---
                await wait(1000); // Даем время насладиться суммой

                
                console.log("Игра завершена!");
            },


// ==========================================
            // ШАГ 4: ГИГАНТСКИЙ ДЕШ И ТОРМОЖЕНИЕ АДСКИХ МАШИН
            // ==========================================
            async function() {
                hideTutorialHand();
                currentChickenLane = 12; // Отключаем фоновый трафик

                animHellIdle.visible = false;
                animDush.visible = true;
                animDush.gotoAndPlay(0);
                animDush.loop = false;
                animBurn.visible = true;
                animBurn.gotoAndPlay(0);

                animDush.onComplete = () => {
                    animDush.visible = false;
                    animHellIdle.visible = true;
                    animHellIdle.play();
                    animBurn.visible = false;
                }

                await wait(500); 
                playSound(jump);

                const nextPlayerX = player.x + 1270;

                // 1. ЗАПУСКАЕМ КАМЕРУ
                focusCameraOnPlayer(false, nextPlayerX - 600);
                
                // 2. ДЭШ И ПАДЕНИЕ БАРЬЕРОВ ДОМИНО
                jumpAsync(player, nextPlayerX, 0, 0.5);

                setMoneyToPlayer(18017.28 , 1.5); 
                cashText.text = `${getT("cashout")}\n${18017.28}\nEUR`;
                balanceText.text = `${18017.28}        EUR`;

                
                setBarValue(0.25)

                setSubButtonActive(2, true);
                setSubButtonActive(1, false);

                const barriersToBreak = [6, 7, 8, 9]; 

                barriersToBreak.forEach((barrierIndex, i) => {
                    const barrier = bareers[barrierIndex];
                    
                    if (!barrier) return;
                    barrier.zIndex = 4;
                    const targetLuk = luksArray[barrierIndex];

                    setTimeout(() => {
                        moveAsync(barrier, targetLuk.x - 150 + 30, targetLuk.y - 440, 0.2);
                        playSound(barSound); 
                        hideLukText(targetLuk);
                        flipLukTexture(targetLuk, goldLukTex, 0.4);
                    }, i * 100); 
                });

                // Ждем пока курица долетит
                await wait(500); 

               
                
                const targetLuk = luksArray[6];
                flipLukTexture(targetLuk, goldLukTex, 0.4);// Оставляем для спавна денег
                
                // ==========================================
                // --- МАГИЯ: СИНХРОННЫЙ ПРИЕЗД АДСКИХ МАШИН ---
                // ==========================================
                
                // Указываем индексы дорожек, куда должны приехать машины
                // Допустим, мы снесли барьеры 6,7,8,9, и машины приезжают прямо к ним!
                const lanesForCars = [6, 7, 8, 9]; 
                
                // Запускаем и ЖДЕМ, пока все они с визгом затормозят
                await spawnAndBrakeHellCars(lanesForCars);

                // ==========================================
                

                await wait(1000); 
                
                showTutorialHand(goButton);
            },

            async function() {
                animHellIdle.visible = false;
                animDush.visible = true;
                animDush.gotoAndPlay(0);
                //animBurn.gotoAndPlay(0);
                currentChickenLane = 12;

                playerMoneyTag.visible = false;

                await wait(500); 
                playSound(jump);
                focusCameraOnPlayer(false);
                
                // Прыгаем, но камеру НЕ ДВИГАЕМ
                await jumpAsync(player, player.x + 330, 0, 0.5);



                //const targetLuk = luksArray[5];

                showWinPlaque(18017.3 , 5);

                await wait(1700);




                spawnPushNotification("18017.3", -800); 
                await wait(1500); // Теперь игра реально подождет 3.5 секунды!
                showPhoneAnimation(18017.3);


                animHellIdle.visible = true;
                animDush.visible = false;



                // --- 2. ЖДЕМ КЛИКА ПО CASH OUT ---
                await wait(3000);
                showEndCard();
                
                // Даем время насладиться суммой

                
                console.log("Игра завершена!");
            },

        ];

        

        // 4. КНОПКА (Всегда слушает клики, но запускает шаги по очереди)
        // Теперь мы используем .on вместо .once, чтобы кнопка работала всегда
        goButton.on('pointerdown', async () => {

            //pressButton(goButton);
            
            // Защита: Если анимация уже идет ИЛИ шаги закончились - ничего не делаем
            if (isActionLocked || currentJumpStep >= gameSteps.length) return;

            

            // Блокируем кнопку
            isActionLocked = true;
            
            // Запускаем текущий шаг (с await, чтобы дождаться конца всех его анимаций)
            await gameSteps[currentJumpStep]();
            
            // Увеличиваем счетчик (в следующий клик запустится следующий шаг)
            currentJumpStep++;
            
            // Разблокируем кнопку для следующего клика
            isActionLocked = false;
        });


        /**
 * Эффект 3D-переворота люка с подменой текстуры на золотую
 * @param {PIXI.Container} lukObj - Контейнер люка из luksArray
 * @param {PIXI.Texture} newTexture - Новая текстура (например, goldLukTex)
 * @param {number} duration - Время всего переворота в секундах (обычно 0.3 - 0.5)
 */
function flipLukTexture(lukObj, newTexture, duration = 0.4) {
    if (!lukObj || !lukObj.lukSprite) return;

    // Останавливаем старую анимацию, если люк уже крутится
    if (lukObj._flipTicker) app.ticker.remove(lukObj._flipTicker);

    // Запоминаем исходный X-масштаб люка (он у тебя был 1.5)
    const initialScaleX = Math.abs(lukObj.scale.x); 
    
    let progress = 0;
    let textureSwapped = false;

    lukObj._flipTicker = (ticker) => {
        if (lukObj.destroyed) return app.ticker.remove(lukObj._flipTicker);

        progress += ticker.deltaTime / (duration * 60);

        if (progress >= 1) {
            // --- КОНЕЦ АНИМАЦИИ ---
            lukObj.scale.x = initialScaleX;
            app.ticker.remove(lukObj._flipTicker);
            lukObj._flipTicker = null;
            
            // Если нужно, спавним искры или партиклы после переворота!
        } else {
            // --- МАГИЯ ИЛЛЮЗИИ 3D ---
            // Math.cos(progress * Math.PI) дает плавный график от 1 до -1.
            // На 50% прогресса он равен 0 (люк повернут к нам ребром, его ширина 0).
            const cosValue = Math.cos(progress * Math.PI);
            
            // Math.abs убирает минус, чтобы картинка не отзеркалилась после переворота
            lukObj.scale.x = initialScaleX * Math.abs(cosValue);

            // Как только мы прошли середину (прогресс > 0.5) и люк начал открываться обратно:
            if (progress >= 0.5 && !textureSwapped) {
                // Подменяем текстуру, пока люк невидимый (сплющен в ноль)!
                lukObj.lukSprite.texture = newTexture;
                textureSwapped = true;
                
                // Прячем текст с суммой евро, так как люк стал золотым
                if (lukObj.textObj) {
                    lukObj.textObj.visible = false;
                }
            }
        }
    };

    app.ticker.add(lukObj._flipTicker);
}



// --- ЛОГИКА ТРАФИКА МАШИН ---
// --- ЛОГИКА ТРАФИКА МАШИН ---
let currentChickenLane = 0;  
let isTrafficActive = true;  
let isHellTraffic = false; // Флаг: обычные машины или адские?

// Массивы текстур для случайного выбора


// (ОБЯЗАТЕЛЬНО заполни эти массивы ВНУТРИ функции init(), 
// ПОСЛЕ того как загрузятся все текстуры через Promise.all)


/**
 * Спавнит адские машины на указанных дорожках и заставляет их синхронно тормозить перед барьерами.
 * @param {number[]} laneIndexes - Массив индексов люков (например [5, 6, 7, 8])
 * @returns {Promise} - Разрешается, когда все машины закончат торможение
 */
function spawnAndBrakeHellCars(laneIndexes) {
    const brakePromises = []; // Массив промисов для синхронного ожидания
    playSound(tormoz); // Общий звук тормозов на всех

    laneIndexes.forEach(index => {
        const targetLuk = luksArray[index];
        if (!targetLuk) return;

        // 1. ВЫБИРАЕМ АДСКУЮ МАШИНУ
        const randomTex = hellCars[Math.floor(Math.random() * hellCars.length)];
        const car = new PIXI.Sprite({ texture: randomTex });
        car.zIndex = 2;
        car.anchor.set(0.5);

        // Применяем правильный масштаб из нашего словаря!
        const idealScale = carScaleMap.get(randomTex) || 1.5;
        car.scale.set(idealScale);

        // 2. СТАВИМ ДАЛЕКО СВЕРХУ
        car.position.set(targetLuk.x, targetLuk.y - 2500); 
        
        // Добавляем ПОД барьеры (индекс 1 - над дорогой)
        gameContainer.addChild(car); 

        // 3. ВЫЧИСЛЯЕМ ТОЧКУ ТОРМОЖЕНИЯ
        // Барьеры стоят на -340 (когда упали) или -670 (когда стоят). 
        // Машина должна остановиться ВЫШЕ барьера. -850 - идеальное расстояние.
        const brakeY = targetLuk.y - 570; 

        // 4. ЗАПУСКАЕМ АНИМАЦИЮ ТОРМОЖЕНИЯ
        // Все машины едут 0.7 секунд. Добавляем промис в массив.
        const brakePromise = moveAsync(car, targetLuk.x , brakeY, 0.7);
        brakePromises.push(brakePromise);
    });

    // Возвращаем Promise, который сработает, когда ВСЕ машины остановятся
    return Promise.all(brakePromises);
}

/**
 * Бесконечно спавнит проносящиеся сверху вниз машины перед игроком
 */
/**
 * Бесконечно спавнит проносящиеся сверху вниз машины перед игроком.
 * Создает плотный трафик на нескольких полосах впереди.
 */
function startCarTraffic() {
    if (!isTrafficActive) return;

    // Выбираем нужный массив текстур в зависимости от состояния мира
    const currentCarSet = isHellTraffic ? hellCars : normalCars;

    // --- ПЛОТНЫЙ ТРАФИК ---
    // Мы хотим, чтобы машины ездили на 1, 2 и 3 дорожках ПЕРЕД курицей
    let lanesAhead = []; 

    if(isHellTraffic){
        lanesAhead = [1, 2, 3]; 
    }
    else{
        lanesAhead = [2, 3, 4]; 
    }
        

    // Проходимся по каждой из этих полос
    lanesAhead.forEach(offset => {
        // Добавляем немного случайности: не на каждой полосе машина появляется каждую секунду
        // (Например, 60% шанс спавна машины на этой полосе в этот "тик")
        if (Math.random() > 0.6) return;

        const targetLaneIndex = currentChickenLane + offset - 1;

        // Проверяем, существует ли такая дорожка вообще
        if (luksArray[targetLaneIndex]) {
            const targetLuk = luksArray[targetLaneIndex];

            // 1. ВЫБОР ТЕКСТУРЫ
            // Берем случайную текстуру из массива
// 1. ВЫБОР ТЕКСТУРЫ И МАСШТАБА
            // Берем случайную текстуру из текущего набора
            const randomTex = currentCarSet[Math.floor(Math.random() * currentCarSet.length)];
            const car = new PIXI.Sprite({ texture: randomTex });
            car.anchor.set(0); // Центрируем
            
            // МАГИЯ: Получаем идеальный масштаб именно для ЭТОЙ картинки из словаря!
            // Если текстуры почему-то нет в словаре, используем дефолтный 1.5
            const idealScale = carScaleMap.get(randomTex) || 1.5;
            
            // Применяем масштаб
            car.scale.set(idealScale);
            
            // 2. ПОЗИЦИОНИРОВАНИЕ
            // Спавним далеко за верхним краем экрана
            const startY = targetLuk.y - 3000;
            // Уезжает далеко за нижний край
            const endY = targetLuk.y + 1500;
            
            // Центрируем по X (подгони смещение -110 под свои картинки машин)
            car.position.set(targetLuk.x - 110, startY);
            
            // Добавляем в самый низ игрового мира (чтобы не перекрывало барьеры и люки)
            gameContainer.addChild(car); 

            // 3. АНИМАЦИЯ И СКОРОСТЬ
            // Адские машины ездят быстрее (0.6 - 1.0 сек), обычные медленнее (1.0 - 1.5 сек)
            const speed = isHellTraffic 
                ? 2  
                : 2;

            // Запускаем движение
            moveAsync(car, targetLuk.x - 110, endY, speed).then(() => {
                car.destroy(); // Удаляем из памяти, когда уедет
            });
        }
    });

    // --- РЕКУРСИВНЫЙ ТАЙМЕР ---
    // Следующий "тик" трафика произойдет через случайное время (от 0.5 до 1.5 секунд)
    // В аду трафик плотнее (от 0.3 до 1.0 секунды)
    const nextSpawnTime = isHellTraffic 
        ? 300 + Math.random() * 700 
        : 500 + Math.random() * 1000;
    
    setTimeout(() => {
        startCarTraffic();
    }, nextSpawnTime);
}


function becomeAngry(){
    animIdle.visible = false;
    animJump.visible = false;
    animHellIdle.visible = true;
    animHellIdle.play();
    animHellIdle.loop = true;
}

function playNetherTransition() {
    // 1. ЭТО ПРОИСХОДИТ МГНОВЕННО (Запуск эффекта перехода)
    animBurn.visible = true;
    animBurn.loop = false;
    animBurn.play();

    startBGM(); 
    
    uiOverlayContainer.addChild(animTransition);
    animTransition.anchor.set(0.5);
    animTransition.position.set(0, -600);
    animTransition.scale.y = -8;
    animTransition.scale.x = 12;
    animTransition.play();
    animTransition.eventMode = 'none';

    // 2. ОТЛОЖЕННЫЕ ИЗМЕНЕНИЯ (Магия подстройки под кадр)
    // Подбери время (в миллисекундах), когда огонь максимально закрывает экран
    // Например, 400 мс (почти полсекунды)
    const delayMs = 600; 

    setTimeout(() => {
        // --- Всё, что внутри этого блока, появится только через delayMs ---

        becomeAngry();

        setBarMode("HELL");

        // Показываем трещины на земле
        cracks.visible = true;

        // Показываем адский текст
        const hellTextSprite = new PIXI.Sprite({ texture: hellTextTex });
        hellTextSprite.scale.set(0.4);
        hellTextSprite.position.set(0, 100);
        hellTextSprite.anchor.set(0.5);
        uiOverlayContainer.addChild(hellTextSprite);

        setTimeout(() => {hellTextSprite.visible = false} , 1300);
        


        // Превращаем обычные барьеры в адские
        bareers.forEach(element => {
            element.texture = hellBareerTex;
            element.position.set(element.position.x + 30 , element.position.y - 100);
            element.scale.set(1.3);
        });

        // Если тебе нужно поменять еще что-то (например, цвет неба или дорогу),
        // добавляй код прямо сюда!
        // backgroundSprite.tint = 0xff5555; // (Пример: сделать дорогу красноватой)

    }, delayMs);

    // 3. ОЧИСТКА МУСОРА (Удаление анимации перехода)
    // Когда анимация огня закончится, убираем её с экрана, чтобы не жрала память
    animTransition.onComplete = () => {
        animTransition.visible = false;
        uiOverlayContainer.removeChild(animTransition);
        // Не забудь сбросить обработчик, чтобы он не сработал дважды
        animTransition.onComplete = null; 
    };
}
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


        /**
 * Плавно добавляет деньги на плашку под курицей
 * @param {number} amountToAdd - Сколько евро добавить
 * @param {number} duration - Время анимации в секундах
 */
/**
 * Устанавливает новую сумму денег на плашке курицы с плавной анимацией прокрутки
 * @param {number} targetAmount - Итоговая сумма, которая должна стать (например, 11760)
 * @param {number} duration - Время анимации в секундах
 */
function setMoneyToPlayer(targetAmount, duration = 0.5) {
    const startAmount = player.currentMoney;
    
    // Если пытаемся установить ту же самую сумму - игнорируем
    if (startAmount === targetAmount) return;

    player.currentMoney = targetAmount;

    // Если плашка еще невидима - делаем её видимой
    if (playerMoneyTag.alpha === 0) {
        let alphaProgress = 0;
        const fadeTicker = (ticker) => {
            alphaProgress += ticker.deltaTime / (0.3 * 60); 
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
    // Делаем пульсацию чуть мягче (20%), чтобы не дергало глаза при частых зачислениях
    const maxScale = 1.2; 

    playerMoneyTag._amountTicker = (ticker) => {
        progress += ticker.deltaTime / (duration * 60);

        if (progress >= 1) {
            // --- КОНЕЦ АНИМАЦИИ ---
            playerMoneyText.text = targetAmount.toLocaleString('ru-RU', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            }) + " €";
            playerMoneyTag.scale.set(baseScale);
            
            app.ticker.remove(playerMoneyTag._amountTicker);
            playerMoneyTag._amountTicker = null;
        } else {
            // --- ПРОЦЕСС АНИМАЦИИ ---
            // Плавное замедление прокрутки цифр (Cubic Ease-Out)
            const ease = 1 - Math.pow(1 - progress, 3);
            
            // Вычисляем промежуточное число
            const currentDisplayAmount = Math.floor(startAmount + (targetAmount - startAmount) * ease);
            
            playerMoneyText.text = currentDisplayAmount.toLocaleString('ru-RU', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            }) + " €";

            // Пульсация плашки
            const pulse = Math.sin(progress * Math.PI); 
            playerMoneyTag.scale.set(baseScale + (maxScale - baseScale) * pulse);
        }
    };

    app.ticker.add(playerMoneyTag._amountTicker);
}


        /**
/**
 * @param {boolean} instant - Мгновенно или плавно
 * @param {number|null} predictedX - Будущая координата X (если хотим навестись заранее)
 */
function focusCameraOnPlayer(instant = true, predictedX = null) {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const isPortrait = sw < sh;

    const targetZoom = isPortrait ? 0.9: 1.37; //0.9 //1.37
    const cameraOffsetX = -470; 
    
    // МАГИЯ ЗДЕСЬ: Если передали futureX, используем его, иначе берем текущий player.x
    const currentTargetX = predictedX !== null ? predictedX : player.x;
    let targetX = currentTargetX - cameraOffsetX; 
    
    let targetY = isPortrait ? 200 : 0;

    // --- ЗАЩИТА ОТ КРАЕВ ---
    const scaleX = sw / GAME_WIDTH;
    const scaleY = sh / GAME_HEIGHT;
    const finalGameScale = Math.min(scaleX, scaleY) * targetZoom;
    const halfScreenWidthInWorld = (sw / 2) / finalGameScale;

    // Узнаем края фона
    const bgLeftEdge = backgroundSprite.x - (backgroundSprite.width / 2);
    const bgRightEdge = backgroundSprite.x + (backgroundSprite.width / 2) + 1500;

    if (targetX - halfScreenWidthInWorld < bgLeftEdge) {
        targetX = bgLeftEdge + halfScreenWidthInWorld;
    }
    if (targetX + halfScreenWidthInWorld > bgRightEdge) {
        targetX = bgRightEdge - halfScreenWidthInWorld;
    }

    if (instant) {
        cameraX = targetX;
        cameraY = targetY;
        cameraZoom = targetZoom;
        resize(); 
    } else {
        animateCamera(targetX, targetY, targetZoom, 0.5); 
    }
}

/**
 * Спавнит нативный Push (iOS style) с пословной анимацией текста
 * @param {string} amountText - Сумма (например "11,760.00")
 * @param {number} yPos - Позиция по Y на экране
 */
/**
 * Спавнит нативный Push (iOS style) с пословной анимацией текста
 * @param {string} amountText - Сумма (например "11,760.00")
 * @param {number} yPos - Позиция по Y (относительно ЦЕНТРА экрана, например -800 для верха)
 */

// Глобальная переменная для хранения пуша
let pushContainer = null;

/**
 * Спавнит нативный Push (iOS style) с пословной анимацией текста.
 * Размер автоматически управляется функцией resize().
 * @param {string} amountText - Сумма (например "11,760.00")
 * @param {number} yPos - Позиция по Y (относительно ЦЕНТРА экрана, например -800)
 */
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
    pushContainer.zIndex = 10;
    
    playSound(sms); // Твой звук уведомления

    // ==========================================
    // 2. ВСЯ ГРАФИКА РИСУЕТСЯ В БАЗОВОМ РАЗМЕРЕ
    // ==========================================
    const width = 980; 
    const height = 290;
    const radius = 50;

    // Плашка фона
    const bg = new PIXI.Graphics();
    bg.roundRect(-width / 2, -height / 2, width, height, radius);
    bg.fill({ color: '#ebebeb', alpha: 1 });
    bg.stroke({ color: '#ffffff', width: 2, alpha: 1 });
    pushContainer.addChild(bg);

    // Аватарка (кружок + буква R)
    const avatarContainer = new PIXI.Container();
    avatarContainer.position.set(-width / 2 + 80, 0);
    pushContainer.addChild(avatarContainer);

    const avatarBg = new PIXI.Graphics();
    avatarBg.circle(0, 0, 60);
    avatarBg.fill('#ffffff');
    avatarContainer.addChild(avatarBg);

    const logoText = new PIXI.Text({ 
        text: "R", 
        style: { fontFamily: 'Arial', fontSize: 80, fontWeight: 'bold', fill: '#000000' } 
    });
    logoText.anchor.set(0.5);
    avatarContainer.addChild(logoText);

    // Тексты (с увеличенным размером и отступами)
    const textX = -width / 2 + 200; 

    const titleStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 42, fontWeight: 'bold', fill: '#000000' });
    const timeStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 32, fill: '#000000' });
    const bodyStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 38, fill: '#000000' });
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
        if (time > 1.4 && time < 1.6) {
            const t = (time - 1.4) / 0.3;
            pushContainer.y = yPos - (t * 100); // Улетает вверх
            pushContainer.alpha = 1 - t; // Растворяется
        } else if (time >= 1.8) {
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

    // Прячем игровой мир и старый UI, чтобы освободить память
    if (typeof gameContainer !== 'undefined') gameContainer.visible = false;
    if (typeof uiOverlayContainer !== 'undefined') uiOverlayContainer.visible = false;

    // 2. ФОН (Статичный)
    const endBg = new PIXI.Sprite({ texture: bgEndTex }); 
    endBg.anchor.set(0.5);
    endBg.position.set(0, 0); 
    endCardContainer.addChild(endBg);

    // 3. UI ЭЛЕМЕНТЫ
    const logo = new PIXI.Sprite({ texture: chickenLogoTex }); 
    logo.anchor.set(0.5);
    
    // --- Добавляем анимацию Петуха в центр ---
    // Так как animHellIdle был создан глобально, мы можем просто использовать его здесь,
    // но лучше создать новый объект или вытащить его из родителя, чтобы не сломать игру.
    // Если animHellIdle свободен, просто добавляем его:
    animHellIdle.visible = true;
    animHellIdle.anchor.set(0.5);
    animHellIdle.position.set(0, 0); // По центру
    animHellIdle.play();
    
    const downloadButton = new PIXI.Sprite({ texture: downloadButtonTex });
    downloadButton.anchor.set(0.5);
    downloadButton.eventMode = 'static';
    downloadButton.cursor = 'pointer';
    

// ==========================================
    // 3.5 СТЕНА ОГНЯ ВНИЗУ (Из старых кадров)
    // ==========================================
    const fireContainer = new PIXI.Container();
    endCardContainer.addChild(fireContainer);
    
    // ВАЖНО: Добавляй огонь ПЕРЕД кнопкой Download, 
    // чтобы огонь был за кнопкой (или после, если хочешь, чтобы огонь перекрывал её).

    // Функция создания одного "язычка" пламени
    function createFireElement(offsetX, offsetY) {
        // Мы НЕ загружаем файлы заново! Мы берем ГОТОВЫЕ текстуры из уже созданной анимации (animBurn).
        // Это занимает 0 байт памяти!
        const fire = new PIXI.AnimatedSprite(animBurn.textures);
        fire.anchor.set(0.5, 1.0); // Якорь ВНИЗУ по центру, чтобы огонь рос вверх
        
        // 1. РАЗНЫЙ СТАРТОВЫЙ КАДР (чтобы они не мерцали синхронно)
        // Берем случайный кадр от 0 до общего количества кадров
        const randomFrame = Math.floor(Math.random() * fire.totalFrames);
        fire.gotoAndPlay(randomFrame);
        
        // 2. РАЗНАЯ СКОРОСТЬ (от 0.3 до 0.6)
        fire.animationSpeed = 0.3 + Math.random() * 0.3;
        fire.loop = true;
        
        // 3. РАЗНЫЙ РАЗМЕР И НАКЛОН
        // Ширина от 0.8 до 1.5, Высота от 1.0 до 2.0 (языки пламени вытягиваются)
        const scaleX = 0.8 + Math.random() * 0.7;
        const scaleY = 1.0 + Math.random() * 1.0;
        
        // Случайно отзеркаливаем некоторые языки по горизонтали (Math.random() > 0.5 ? 1 : -1)
        fire.scale.set(scaleX * (Math.random() > 0.5 ? 1 : -1), scaleY);
        
        // Легкий наклон влево/вправо (от -15 до +15 градусов)
        fire.rotation = (Math.random() - 0.5) * 0.5;
        
        // 4. ЯРКОСТЬ И СВЕЧЕНИЕ
        fire.blendMode = 'add'; // Убирает черный фон и заставляет огонь светиться!
        fire.alpha = 0.7 + Math.random() * 0.3; // Прозрачность от 0.7 до 1.0

        // 5. ПОЗИЦИЯ
        fire.position.set(offsetX, offsetY);
        
        fireContainer.addChild(fire);
        return fire;
    }

    // Создаем "Стену огня" (Например, 6 языков пламени внизу)
    // Координаты X расставляем от -400 до +400 (центр = 0)
// Создаем "Стену огня" 
    // Первый аргумент: X (от центра экрана влево/вправо)
    // Второй аргумент: Y (от низа экрана ВВЕРХ! Должен быть минус)
    createFireElement(-400, -50);  // Чуть приподнят над дном
    createFireElement(-250, 0);    // Ровно на нижней кромке
    createFireElement(-100, -80);  // Поднят повыше (ближе к кнопке)
    createFireElement(100, 20);    // Слегка опущен за край
    createFireElement(250, -60);   
    createFireElement(400, -20);


    const downloadTextStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 130,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 0 },
        dropShadow: { color: '#000000', alpha: 0.8, distance: 5, blur: 5 },
        align: 'center'
    });

    const down = new PIXI.Text({
        text: getT("download").toUpperCase(), style: downloadTextStyle,
        style: downloadTextStyle
    });
    down.anchor.set(0.5);
    down.position.set(0 , -50);
    down.scale.set(1.15);

    downloadButton.addChild(down);
    
    endCardContainer.addChild(logo, animHellIdle, downloadButton);

    const baseBtnW = downloadButton.width;
    const baseBtnH = downloadButton.height;

    // ==========================================
    // 4. ГЛАВНАЯ ФУНКЦИЯ АДАПТИВА (resize)
    // ==========================================
    const onEndCardResize = () => {
        const sw = window.innerWidth;
        const sh = window.innerHeight;
        const isPortrait = sw < sh; 
        
        endCardContainer.position.set(sw / 2, sh / 2);

        // --- Адаптация ФОНА ---
        // Растягиваем на весь экран без лишних запасов, так как он не двигается
        const currentBgScale = Math.max(sw / (endBg.texture.width || 1), sh / (endBg.texture.height || 1));
        endBg.scale.set(currentBgScale);

        // --- Адаптация UI ЭЛЕМЕНТОВ ---
        
        // 1. ЛОГОТИП (Верх)
        const logoMaxWidth = isPortrait ? sw * 0.7 : sw * 0.25;
        const logoMaxHeight = isPortrait ? sh * 0.2 : sh * 0.25;
        
        const logoScaleW = logoMaxWidth / (logo.texture.width || 1);
        const logoScaleH = logoMaxHeight / (logo.texture.height || 1);
        
        logo.targetScale = Math.min(logoScaleW, logoScaleH, 2.0);

        // 2. АНИМАЦИЯ ПЕТУХА (Центр)
        const animMaxWidth = isPortrait ? sw * 1.4 : sw * 0.85;
        const animMaxHeight = isPortrait ? sh * 0.7 : sh * 0.8;
        
        // У AnimatedSprite width/height считаются динамически, берем базовый размер кадра
        const baseAnimW = animHellIdle.texture.width || 100;
        const baseAnimH = animHellIdle.texture.height || 100;
        
        const animScaleW = animMaxWidth / baseAnimW;
        const animScaleH = animMaxHeight / baseAnimH;
        
        animHellIdle.targetScale = Math.min(animScaleW, animScaleH, 2.0);

        // 3. КНОПКА DOWNLOAD (Низ)
        const btnMaxWidth  = isPortrait ? sw * 0.8 : sw * 0.65; 
        const btnMaxHeight = isPortrait ? sh * 0.25 : sh * 0.3; 

        const btnScaleW = btnMaxWidth  / (baseBtnW || 1);
        const btnScaleH = btnMaxHeight / (baseBtnH || 1);

        downloadButton.targetScale = Math.max(0.1, Math.min(btnScaleW, btnScaleH, 1.6));

        // --- РАССТАНОВКА ---
        // В ландшафте элементы стоят ближе к центру по вертикали
// --- РАССТАНОВКА ---
        // В ландшафте элементы стоят ближе к центру по вертикали
        const offsetTop = isPortrait ? sh * 0.35 : sh * 0.3; 
        const offsetBottom = isPortrait ? sh * 0.45 : sh * 0.4;

        logo.position.set(0, -offsetTop * 1.1);
        downloadButton.position.set(0, offsetBottom);

        // ==========================================
        // МАГИЯ ДЛЯ КУРИЦЫ (Сохранение перспективы)
        // ==========================================
        // Базовый сдвиг от центра. Поиграйся с этой цифрой!
        // Положительное число опустит её НИЖЕ (ближе к дороге). 
        // Например: 0, 50, 100.
        const chickenBaseOffsetY = isPortrait ? -100 : 40; 
        
        // Умножаем на currentBgScale. Теперь, если фон сжимается, 
        // курица тоже "притягивается" к центру пропорционально фону!
        animHellIdle.position.set(0, chickenBaseOffsetY * currentBgScale); 
        
        // ==========================================
        // АДАПТИВ ДЛЯ ОГНЯ
        // ==========================================
        // Опускаем контейнер с огнем на самый нижний край экрана (sh / 2)
        fireContainer.position.set(0, sh / 1.5);
        
        // Немного скейлим огонь, чтобы он не был мелким на больших экранах
        const fireScale = isPortrait ? (sw / GAME_WIDTH) : (sh / GAME_HEIGHT);
        fireContainer.scale.set(Math.max(fireScale, 0.6));

        // Применяем вычисленный масштаб (если нет анимации спавна)
        if (!logo.isSpawning) logo.scale.set(logo.targetScale);
        if (!animHellIdle.isSpawning) animHellIdle.scale.set(animHellIdle.targetScale);
        if (!downloadButton.isSpawning) downloadButton.scale.set(downloadButton.targetScale);
    };

    window.addEventListener('resize', onEndCardResize);
    onEndCardResize();

    // ==========================================
    // 5. АНИМАЦИИ ПОЯВЛЕНИЯ
    // ==========================================
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
    animHellIdle.scale.set(0);
    downloadButton.scale.set(0);

    // Запускаем появление по очереди
    springBounce(logo); 
    await wait(300);
    springBounce(animHellIdle);
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
    // 6. КЛИКИ и ОЧИСТКА
    // ==========================================
    endCardContainer.eventMode = 'static';
    endCardContainer.cursor = 'pointer';
    endCardContainer.on('pointerdown', () => {
        app.ticker.remove(pulseTicker);
        window.removeEventListener('resize', onEndCardResize);
        
        openStore(); 
    });
}



/**
 * Показывает Колесо Фортуны в центре экрана
 * @param {Function} onWin - Колбэк, который сработает после прокрутки
 */
function showWheelOfFortune(onWin) {
    const popupContainer = new PIXI.Container();

    animShok.position.set(0 , 0);
    animShok.anchor.set(0.5);
    animShok.scale.set(0.11);
    animShok.animationSpeed = 0.17;
    animShok.zIndex = 2;
    popupContainer.addChild(animShok);
    
    // 1. ЗАТЕМНЕНИЕ
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.7 });
    dimmer.eventMode = 'static'; 
    popupContainer.addChild(dimmer);

    // 2. ВНЕШНЯЯ РАМКА КОЛЕСА (Статичная)
    const wheelFrame = new PIXI.Sprite({ texture: wheelTex });
    wheelFrame.eventMode = 'none';
    wheelFrame.anchor.set(0.5);
    popupContainer.addChild(wheelFrame);

    // ==========================================
    // 3. ВНУТРЕННЕЕ КОЛЕСО С ЭЛЕМЕНТАМИ (Вращается)
    // ==========================================
    const wheelInContainer = new PIXI.Container();
    popupContainer.addChild(wheelInContainer);

    // Сама картинка внутренних цветных секторов
    const wheelInBg = new PIXI.Sprite({ texture: wheelInTex });
    wheelInBg.anchor.set(0.5);
    wheelInContainer.addChild(wheelInBg);

    // Данные секторов (8 штук, как на картинке, по часовой стрелке)
    // Мы ставим x5 первым (на 12 часов), чтобы легко было на нем остановиться
    const sectionsData = [
        { type: 'text', val: 'x5' },
        { type: 'skull' },
        { type: 'text', val: 'x2' },
        { type: 'text', val: 'x10' },
        { type: 'skull' },
        { type: 'text', val: 'x7' },
        { type: 'text', val: 'x12' },
        { type: 'skull' }
    ];

    const radius = 170; // Радиус от центра колеса, где будут стоять элементы (подбери под свой PNG)
    
    const textStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 60,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 8 },
        dropShadow: { color: '#000000', alpha: 0.5, blur: 4, distance: 3 }
    });

    // Расставляем элементы по кругу
    sectionsData.forEach((sec, i) => {
        // Вычисляем угол: 360 / 8 = 45 градусов (PI / 4)
        // Вычитаем PI / 2 (90 градусов), чтобы первый элемент (x5) встал ровно сверху (на 12 часов)
        const angle = (i * Math.PI / 4) - (Math.PI / 2);

        let item;
        if (sec.type === 'skull') {
            item = new PIXI.Sprite({ texture: skullTex }); // Картинка черепа
            item.scale.set(0.3);
            item.eventMode = 'none'; // Подгони размер
        } else {
            item = new PIXI.Text({ text: sec.val, style: textStyle }); // Текст множителя
        }

        item.anchor.set(0.5);
        // Ставим элемент по координатам окружности (X = cos, Y = sin)
        item.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius);
        
        // Поворачиваем элемент, чтобы его низ смотрел в центр колеса
        item.rotation = angle + Math.PI / 2;
        
        wheelInContainer.addChild(item);
    });

    // Добавляем эффект размытия (Изначально 0)
    const spinBlur = new PIXI.BlurFilter({ strength: 0, quality: 2 });
    wheelInContainer.filters = [spinBlur];

    // ==========================================
    // 4. УКАЗАТЕЛЬ (Стрелка сверху)
    // ==========================================
    const pointer = new PIXI.Sprite({ texture: pointerTex }); // Треугольник
    // Якорь по X центр, по Y ВЕРХ (чтобы она качалась как маятник)
    pointer.anchor.set(0.5, 0); 
    // Ставим на самый верх рамки колеса
    pointer.position.set(0, -500); // Подгони под размер рамки
    popupContainer.addChild(pointer);

    // Добавляем попап в сцену
    uiOverlayContainer.addChild(popupContainer);

    // 5. АНИМАЦИЯ ПОЯВЛЕНИЯ
    popupContainer.scale.set(0);
    let appearProgress = 0;
    
    const appearTicker = (ticker) => {
        appearProgress += ticker.deltaTime / (0.6 * 60); 
        if (appearProgress >= 1) {
            popupContainer.scale.set(1);
            app.ticker.remove(appearTicker);
            startWheelLogic();
        } else {
            const t = appearProgress - 1;
            const ease = (t * t * (3 * t + 2) + 1); 
            popupContainer.scale.set(ease);
        }
    };
    app.ticker.add(appearTicker);

    // ==========================================
    // 6. ЛОГИКА ВРАЩЕНИЯ И ФИЗИКИ
    // ==========================================
    function startWheelLogic() {
        wheelInContainer.eventMode = 'static';
        wheelInContainer.cursor = 'pointer';



        // Пульсация всего контейнера (Подсказка "нажми")
        springBounceText(wheelInContainer); 

        setTimeout(() => {
            console.log("Start");
            if (wheelInContainer._springTicker) app.ticker.remove(wheelInContainer._springTicker);

            playSound(wheel);
            
            // ЦЕЛЕВОЙ УГОЛ (Выпадет ровно x5)
            // Так как x5 стоит на нулевом индексе (сверху), нам нужно просто
            // сделать целое количество оборотов (например, 4 оборота = 8 PI)
            const targetRotation = Math.PI * 2 * 4; 
            
            let spinProgress = 0;
            const spinDuration = 3.5; // Колесо крутится 3.5 секунды

            setTimeout(()=>{
                animShok.loop = false;
                animShok.play();
            } , 2700)

      


            const spinTicker = (ticker) => {
                spinProgress += ticker.deltaTime / (spinDuration * 60); 

        if (spinProgress >= 1) {
                    
                    // ОСТАНОВКА КОЛЕСА
                    wheelInContainer.rotation = targetRotation;
                    spinBlur.strength = 0;
                    pointer.rotation = 0; 
                    app.ticker.remove(spinTicker);
                    
                    console.log("Выиграл x5!");
                    
                    // ==========================================
                    // НОВАЯ ИНТЕРАКТИВНАЯ АНИМАЦИЯ ТЕКСТА "WIN x5!"
                    // ==========================================
                    
                    // 1. Создаем текст прямо внутри popupContainer (ПОВЕРХ диммера)
                    const winStyle = new PIXI.TextStyle({
                        fontFamily: 'softhyphen',
                        fontSize: 100,
                        fontWeight: 'bold',
                        fill: '#ffffff',
                        stroke: { color: '#000000', width: 8 },
                        dropShadow: { color: '#000000', alpha: 0.8, distance: 4, blur: 4 }
                    });
                    
                    const winText = new PIXI.Text({ text: "X5", style: winStyle });
                    winText.anchor.set(0.5);
                    
                    // Ставим туда, где находится надпись x5 (чуть выше центра)
                    winText.position.set(0, -170);
                    winText.scale.set(0);
                    winText.zIndex = 15; // Прячем
                    popupContainer.addChild(winText);

                    let flyTime = 0;
                    const flyTicker = (ticker) => {
                        const dt = ticker.deltaTime / 60;
                        flyTime += dt;

                        if (flyTime < 0.6) {
                            // --- ЭТАП 1: Выпрыгивает из сектора x5 и спускается в центр (0.4 сек) ---
                            const t = flyTime / 0.8;
                            const t2 = t - 1;
                            const easeOut = (t2 * t2 * (3 * t2 + 2) + 1); // Пружинка

                            winText.scale.set(easeOut * 2.5); // Увеличивается до 1.5
                            winText.y = -170 + (170 * easeOut); // Спускается с -170 в 0 (центр)

                        } else if (flyTime < 1.2) {
                            // --- ЭТАП 2: Висит в центре и пульсирует (0.8 сек) ---
                            winText.scale.set(2.5 + Math.sin(flyTime * 15) * 0.05);

                        } else if (flyTime < 1.8) {
                            // --- ЭТАП 3: Летит к кнопке Cash Out (0.6 сек) ---
                            const t = (flyTime - 1.2) / 0.45;
                            const easeIn = t * t * t; // Плавно разгоняется (Cubic Ease-In)

                            // МАГИЯ: Узнаем, где находится кнопка Cash Out прямо сейчас
                            // (Она может быть где угодно из-за адаптива)
                            const globalBtnPos = goButton.getGlobalPosition();
                            
                            // Переводим ее координаты внутрь нашего попапа рулетки
                            const localBtnPos = popupContainer.toLocal(globalBtnPos);

                            // Двигаем текст от центра (0,0) к кнопке
                            winText.x = 0 + (localBtnPos.x - 0) * easeIn;
                            winText.y = 0 + (localBtnPos.y - 0) * easeIn;

                            // В полете текст уменьшается и исчезает
                            winText.scale.set(2.5 * (1 - easeIn));
                            winText.alpha = 1 - easeIn;

                        } else {
                            // --- ЭТАП 4: КОНЕЦ АНИМАЦИИ ---
                            app.ticker.remove(flyTicker);
                            winText.destroy();

                            // ВАЖНО: В этот момент текст влетел в кнопку.
                            // Давай физически увеличим сумму на кнопке CashOut! 
                            // (Передай свою текущую функцию добавления денег)
                            // addMoneyToCashOut(cashOutButton, 3600, 0.5); 

                            // Запускаем закрытие рулетки и переход сцены
                            blurTransition(()=>{ 
                                closePopup(); 
                            }, 0.4, 0.4, 20);
                        }
                    };
                    
                    // Запускаем анимацию полета текста
                    app.ticker.add(flyTicker);
                    
                } else {
                    // ... здесь остался твой старый код (ПЛАВНОЕ ТОРМОЖЕНИЕ) ... else {
                    // ПЛАВНОЕ ТОРМОЖЕНИЕ (Cubic Ease Out)
                    const ease = 1 - Math.pow(1 - spinProgress, 3);
                    wheelInContainer.rotation = targetRotation * ease;

                    // --- ФИЗИКА РАЗМЫТИЯ ---
                    // Скорость вращения максимальна в начале и падает к нулю.
                    // Производная от нашей функции ease: 3 * (1-p)^2
                    const speed = 3 * Math.pow(1 - spinProgress, 2);
                    

                    // --- ФИЗИКА СТРЕЛКИ ---
                    // Вычисляем, сколько секторов мы проехали
                    // Колесо разделено на 8 секторов (PI / 4)
                    const sectionsPassed = wheelInContainer.rotation / (Math.PI / 4);
                    
                    // Бьем стрелку каждый раз, когда меняется сектор (используем sin)
                    // Math.abs(sin) делает так, что стрелка отскакивает только в одну сторону
                    pointer.rotation = -Math.abs(Math.sin(-sectionsPassed * Math.PI)) * 0.2;
                }
            };
            app.ticker.add(spinTicker);
        } , 800);
    }

function springBounceText(textObj) {
        if (textObj._springTicker) app.ticker.remove(textObj._springTicker);

        const baseScale = 1.0;
        
        // НАЧИНАЕМ С 1.0 (чтобы не было резкого скачка)
        let current = textObj.scale.x || baseScale; 
        
        // Даем начальный импульс на расширение (плавный рывок вверх)
        let velocity = 0.05; 
        
        // Настройки физики (сделал чуть мягче, чтобы выглядело естественно)
        const stiffness = 0.05; // Жесткость пружины (тяга к 1.0)
        const damping = 0.6;    // Затухание (сопротивление)

        const springTicker = (ticker) => {
            if (textObj.destroyed) return app.ticker.remove(springTicker); // Безопасность

            // Вычисляем физику
            const force = (baseScale - current) * stiffness;
            velocity = (velocity + force) * damping;
            current += velocity;

            textObj.scale.set(current);

            // Остановка, когда пружина успокоилась
            if (Math.abs(velocity) < 0.001 && Math.abs(current - baseScale) < 0.001) {
                textObj.scale.set(baseScale);
                app.ticker.remove(springTicker);
                textObj._springTicker = null;
            }
        };

        textObj._springTicker = springTicker;
        app.ticker.add(springTicker);
    }

    // 7. ЗАКРЫТИЕ И УДАЛЕНИЕ
    function closePopup() {
        
        playSound(reward);
        let closeProgress = 0;
        const closeTicker = (ticker) => {
            closeProgress += ticker.deltaTime / (0.3 * 60);
            if (closeProgress >= 1) {
                app.ticker.remove(closeTicker);
                popupContainer.destroy();
                if (onWin) onWin(); 
            } else {
                popupContainer.scale.set(1 - closeProgress);
                popupContainer.alpha = 1 - closeProgress;
            }
        };
        app.ticker.add(closeTicker);
    }
}



        /**
 * Спавнит стопку денег в точке (startX, startY)
 * и отправляет их в (targetX, targetY)
 */
function spawnMoneyStack(startX, startY, targetX, targetY, count = 10) {
    const moneyStack = [];

    for (let i = 0; i < count; i++) {
        const bill = new PIXI.Sprite({ texture: moneyTex });
        bill.anchor.set(0.5);
        
        // 1. Начальное состояние: нулевой размер в точке старта
        bill.position.set(startX, startY);
        bill.scale.set(0); 
        
        // 2. Случайный небольшой поворот для эффекта стопки
        const randomRotation = (Math.random() - 0.5) * 0.5; // от -0.25 до 0.25 радиана
        bill.rotation = randomRotation;

        gameContainer.addChild(bill);
        moneyStack.push(bill);

        // 3. Анимация движения
        // Используем встроенный тикер для плавности
        let progress = 0;
        const duration = 0.8; // секунд
        const delay = i * 0.05; // каждая следующая купюра чуть позже (эффект веера)
        const r = Math.random();
        const animTicker = (ticker) => {
            progress += ticker.deltaTime / (duration * 60);

            if (progress >= 1) {
                bill.position.set(targetX, targetY);
                bill.scale.set(0.26); // Конечный размер
                app.ticker.remove(animTicker);
            } else {
                // Если еще не дождались начала (для эффекта веера)
                if (progress * duration < delay) return;

                const t = (progress * duration - delay) / (duration - delay);
                if (t < 0) return;

                // Ease-out движение
                const ease = 1 - Math.pow(1 - t, 3);
                
                bill.position.x = startX + (targetX - startX) * ease;
                bill.position.y = startY + (targetY - startY) * ease;
                
                // Растем от 0 до 0.3
                bill.scale.set(t * 0.26);
                
                // Вращение: купюра докручивается до 0 (выравнивается в стопку)
                bill.rotation = randomRotation * ((1 - r) - t);
            }
        };
        app.ticker.add(animTicker);
    }
}

/**
 * Создает вылетающий из нуля текст (например: "x5", "+100", "Combo!")
 * @param {string} textString - Сам текст (например "x5")
 * @param {number} startX - Точка появления X
 * @param {number} startY - Точка появления Y
 * @param {number} targetX - Куда летит текст X
 * @param {number} targetY - Куда летит текст Y
 * @param {number} finalScale - Итоговый размер текста (по умолчанию 1.0)
 * @param {number} duration - Время полета в секундах (по умолчанию 0.8)
 */
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
            
            // Опционально: Если текст должен исчезнуть через секунду после прилета
            /*
            setTimeout(() => {
                floatText.destroy(); // Удаляем из памяти
            }, 1000);
            */

        } else {
            // В ПРОЦЕССЕ ПОЛЕТА (Плавное замедление - Ease-Out)
            const ease = 1 - Math.pow(1 - progress, 3);
            
            // Двигаем
            floatText.position.x = startX + (targetX - startX) * ease;
            floatText.position.y = startY + (targetY - startY) * ease;
            
            // Увеличиваем (эффект пружинки Overshoot для сочности)
            // Текст выпрыгнет чуть больше нужного и вернется обратно
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


/**
 * Показывает плашку победы с бегающим неоном и счетчиком денег
 * @param {number} winAmount - Сумма выигрыша (например, 11760)
 * @param {Function} onComplete - Колбэк, когда анимация закончится
 */
/**
 * Показывает плашку победы и возвращает функцию для её закрытия
 * @param {number} winAmount - Сумма выигрыша
 * @returns {Function} - Вызови эту функцию, чтобы плашка исчезла
 */
/**
 * Показывает адаптивную плашку победы и возвращает функцию для её закрытия.
 * Плашка автоматически масштабируется, чтобы занимать 90% ширины экрана.
 * @param {number} winAmount - Сумма выигрыша (например, 11760)
 * @returns {Function} - Вызови эту функцию, чтобы плашка плавно исчезла
 */
/**
 * Показывает плашку победы с анимированной рамкой
 * @param {number} winAmount - Сумма выигрыша (например, 11760)
 * @param {number} multiplier - Множитель (например, 5), чтобы показать "x 5"
 */
function showWinPlaque(winAmount, multiplier = 5) {
    const popupContainer = new PIXI.Container();
    
    // 1. ДИММЕР (Затемнение фона)
    const dimmer = new PIXI.Graphics();
    dimmer.eventMode = 'static'; 
    popupContainer.addChild(dimmer);

    // 2. ГЛАВНЫЙ КОНТЕЙНЕР ПЛАШКИ
    const plaqueGroup = new PIXI.Container();
    popupContainer.addChild(plaqueGroup);

    // Немного увеличим высоту, чтобы кнопка влезла комфортно
    const width = 700; 
    const height = 550; 
    const radius = 40; 

    // ==========================================
    // 3. АНИМИРОВАННАЯ РАМКА (Огонь / Энергия)
    // ==========================================
    const fireBorder = new PIXI.AnimatedSprite(animWin.textures);
    fireBorder.anchor.set(0.5);
    // scale.set(3) убран, так как ниже мы жестко задаем width/height
    fireBorder.animationSpeed = 0.2;
    fireBorder.loop = true;
    
    fireBorder.width = width + 260; 
    fireBorder.height = height + 320;
    
    fireBorder.blendMode = 'add'; 
    fireBorder.play();
    plaqueGroup.addChild(fireBorder);

    // ==========================================
    // 4. ФОН ПЛАШКИ (Темно-красный)
    // ==========================================
    const shadow = new PIXI.Graphics();
    shadow.roundRect(-width/2 + 10, -height/2 + 10, width, height, radius);
    shadow.fill({ color: 0x000000, alpha: 0.5 }); 
    plaqueGroup.addChild(shadow);

    const plaqueBg = new PIXI.Graphics();
    plaqueBg.roundRect(-width/2, -height/2, width, height, radius);
    plaqueBg.fill({ color: 0x5a0a0a }); 
    plaqueBg.stroke({ color: 0xffa0a0, width: 2, alpha: 0.5 });
    plaqueGroup.addChild(plaqueBg);

    // ==========================================
    // 5. ТЕКСТЫ И КНОПКА
    // ==========================================
    const titleStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen', fontSize: 110, fontWeight: 'bold', fill: '#ffffff',
        dropShadow: { color: '#000000', alpha: 0.8, distance: 4, blur: 4 }
    });
    const title = new PIXI.Text({ text: getT("big_win").toUpperCase(), style: titleStyle });
    title.scale.set(0.7);
    title.anchor.set(0.5);
    title.position.set(0, -160);
    plaqueGroup.addChild(title);

    const multStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen', fontSize: 60, fontWeight: 'bold', fill: '#00ff00',
        dropShadow: { color: '#000000', alpha: 0.8, distance: 3, blur: 3 }
    });
    const multText = new PIXI.Text({ text: `x ${multiplier}`, style: multStyle });
    multText.anchor.set(0.5);
    multText.position.set(0, -50);
    plaqueGroup.addChild(multText);

    const balanceStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen', fontSize: 90, fontWeight: 'bold', fill: '#ffdd00',
        stroke: { color: '#4a2400', width: 6 }, 
        dropShadow: { color: '#000000', alpha: 0.8, distance: 5, blur: 4 } 
    });
    const balanceText = new PIXI.Text({ text: "+ 0 €", style: balanceStyle });
    balanceText.anchor.set(0.5);
    balanceText.position.set(0, 60); 
    plaqueGroup.addChild(balanceText);

    // --- НОВАЯ КНОПКА WITHDRAW ---
    const withdrawButton = new PIXI.Container();
    // Ставим кнопку в самый низ плашки, она будет немного "вылезать" за края, как на скрине
    withdrawButton.position.set(0, height / 2 + 10); 
    plaqueGroup.addChild(withdrawButton);

    const btnWidth = 450;
    const btnHeight = 100;
    const btnRadius = 25;

    const btnBg = new PIXI.Graphics();
    btnBg.roundRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, btnRadius);
    btnBg.fill({ color: 0xffdd00 }); // Ярко-желтый
    btnBg.stroke({ color: 0x000000, width: 6 }); // Темная обводка
    withdrawButton.addChild(btnBg);

    const btnStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen', fontSize: 50, fontWeight: 'bold', fill: '#000000'
    });
    
    // Замени "WITHDRAW" на getT("cashout") или getT("claim"), если используешь локализацию!
    const btnText = new PIXI.Text({ text: getT("withdraw").toUpperCase(), style: btnStyle });
    btnText.anchor.set(0.5);
    btnText.position.set(0, 0);
    withdrawButton.addChild(btnText);

    // ==========================================
    // 6. АДАПТИВ
    // ==========================================
    let plaqueScale = 1.0; 

    const onPlaqueResize = () => {
        const sw = window.innerWidth;
        const sh = window.innerHeight;
        
        popupContainer.position.set(0, -200); 
        
        dimmer.clear();
        dimmer.rect(-sw / 2 / uiOverlayContainer.scale.x, -sh / 2 / uiOverlayContainer.scale.y, sw / uiOverlayContainer.scale.x, sh / uiOverlayContainer.scale.y);
        dimmer.fill({ color: 0x000000, alpha: 0.7 });

        const targetWidth = GAME_WIDTH * 0.75;
        plaqueScale = Math.min(1.0, targetWidth / width);
        
        if (!plaqueGroup.isAnimating) {
            plaqueGroup.scale.set(plaqueScale);
        }
    };

    window.addEventListener('resize', onPlaqueResize);
    onPlaqueResize(); 

    // ==========================================
    // 7. СЛОИ и АНИМАЦИИ
    // ==========================================
    let targetIndex = uiOverlayContainer.getChildIndex(footerContainer);
    if (targetIndex < 0) targetIndex = 0;
    uiOverlayContainer.addChildAt(popupContainer, targetIndex);

    plaqueGroup.scale.set(0); 
    
    let time = 0;
    let currentBalance = 0;
    const duration = 2.0; 

    const animTicker = (ticker) => {
        plaqueGroup.isAnimating = true; 
        const dt = ticker.deltaTime / 60;
        time += dt;

        // Пружинка для появления всей плашки
        if (time < 0.5) {
            const t = time / 0.5;
            const ease = 1 - Math.pow(1 - t, 3);
            plaqueGroup.scale.set(plaqueScale * (ease * 1.1)); 
        } else if (time < 0.7) {
            const t = (time - 0.5) / 0.2;
            plaqueGroup.scale.set(plaqueScale * (1.1 - (0.1 * t))); 
        } else {
            plaqueGroup.isAnimating = false; 
        }

        // Крутим счетчик
        if (time < duration) {
            const t = time / duration;
            const easeOut = 1 - Math.pow(1 - t, 3);
            currentBalance = Math.floor(winAmount * easeOut);
            balanceText.text = "+ " + currentBalance.toLocaleString('ru-RU') + " €";
        } else {
            balanceText.text = "+ " + winAmount.toLocaleString('ru-RU') + " €";
            plaqueGroup.isAnimating = true; 
            
            // Легкая пульсация всей плашки
            plaqueGroup.scale.set(plaqueScale * (1 + Math.sin(time * 10) * 0.01)); 
            
            // ВАЖНО: Дополнительная пульсация кнопки WITHDRAW для привлечения внимания!
            withdrawButton.scale.set(1 + Math.sin(time * 15) * 0.03);
        }
    };
    app.ticker.add(animTicker);

    // ==========================================
    // 8. ЗАКРЫТИЕ
    // ==========================================
    return function closePlaque() {
        window.removeEventListener('resize', onPlaqueResize); 
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


/**
 * Эффект кинематографичного размытия для смены сцены
 * @param {Function} onPeak - Функция, которая сработает в момент максимального размытия
 * @param {number} durationIn - Время замыливания (в секундах)
 * @param {number} durationOut - Время фокусировки обратно (в секундах)
 * @param {number} maxBlur - Сила размытия (20-30 обычно достаточно, чтобы скрыть смену объектов)
 */
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



        /**
 * Прыжок объекта по параболе (начальная и конечная Y совпадают)
 * @param {PIXI.DisplayObject} object - Объект, который прыгает
 * @param {number} targetX - Конечная точка по X
 * @param {number} jumpHeight - Максимальная высота прыжка в пикселях (на сколько подлетит вверх)
 * @param {number} durationSeconds - Время прыжка в секундах
 * @param {Function} onComplete - Колбэк по завершении
 */
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
            // В ПРОЦЕССЕ ПРЫЖКА
            
            // X меняется равномерно от startX до targetX
            const currentX = startX + (targetX - startX) * progress;
            
            // Y вычисляется по формуле параболы
            // Отнимаем, потому что в PixiJS ось Y направлена ВНИЗ (вверх = минус)
            const parabola = 4 * progress * (1 - progress);
            const currentY = startY - (jumpHeight * parabola);

            object.position.set(currentX, currentY);
        }
    };

    object._jumpTicker = jumpTicker;
    app.ticker.add(jumpTicker);
}

/**
 * Вызывает анимацию телефона со счетчиком и пуш-уведомлениями
 */
function showPhoneAnimation(targetAmount, onComplete) {
    const popupContainer = new PIXI.Container();
    
    // 1. Диммер
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.7 });
    dimmer.eventMode = 'static'; 
    popupContainer.addChild(dimmer);

    // 2. КОНТЕЙНЕР ТЕЛЕФОНА
    const phoneGroup = new PIXI.Container();
    phoneGroup.position.set(0, 1500); 
    popupContainer.addChild(phoneGroup);

    // ==========================================
    // 3. СБОРКА ТЕЛЕФОНА
    // ==========================================
    const phoneScale = 2; 

    // Контейнер экрана (он будет ездить ВНИЗ и ВВЕРХ)
    const screenContainer = new PIXI.Container();
    phoneGroup.addChild(screenContainer);

    // Внутренности
    const phoneInner = new PIXI.Sprite({ texture: phoneInnerTex });
    phoneInner.anchor.set(0.5);
    phoneInner.position.set(0 , -95);
    phoneInner.scale.set(phoneScale * 0.35); 
    screenContainer.addChild(phoneInner); 

    // Счетчик денег
    const moneyStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 70,
        fontWeight: 'bold',
        fill: '#ffffff',
        dropShadow: { color: '#00aa00', alpha: 0.8, distance: 0, blur: 10 },
        align: 'center'
    });
    
    // Изначальный баланс (маленький)
    let currentMoney = 5.50;
    const moneyText = new PIXI.Text({ text: currentMoney.toFixed(2) + " €", style: moneyStyle });
    moneyText.anchor.set(0.5);
    moneyText.position.set(0, -320); 
    screenContainer.addChild(moneyText); 

    // --- МАСКА ЭКРАНА ---
    const phoneScreenMask = new PIXI.Graphics();
    const maskW = 350 * phoneScale; 
    const maskH = 780 * phoneScale;
    const maskRadius = 40 * phoneScale;
    phoneScreenMask.roundRect(-maskW / 2, -maskH / 2, maskW, maskH, maskRadius);
    phoneScreenMask.fill(0xffffff);
    phoneGroup.addChild(phoneScreenMask);
    screenContainer.mask = phoneScreenMask;

    // Внешняя рамка (Корпус)
    const phoneFrame = new PIXI.Sprite({ texture: phoneFrameTex });
    phoneFrame.anchor.set(0.5);
    phoneFrame.scale.set(phoneScale); 
    phoneGroup.addChild(phoneFrame);

    // Добавляем лоадер (Крутилка обновления), спрятанный под экраном
    // В реальном iOS он появляется сверху, когда мы тянем экран вниз
    const loader = new PIXI.Graphics();
    loader.circle(0, 0, 20);
    loader.stroke({ color: 0x888888, width: 4 });
    loader.position.set(0, -maskH / 2 + 50); // В самом верху маски
    loader.alpha = 0; // Спрятан
    // Добавляем его в маску, но НЕ в screenContainer, чтобы он стоял на месте, пока экран едет вниз
    phoneGroup.addChildAt(loader, phoneGroup.getChildIndex(phoneScreenMask)); 

    uiOverlayContainer.addChild(popupContainer);

    // ==========================================
    // 4. ТАЙМЛАЙН АНИМАЦИИ (Выезд -> Свайп вниз -> Крутим деньги -> Отпускаем)
    // ==========================================
    let globalTime = 0;
    
    // Переменные для анимации экрана
    const startScreenY = 0;
    const swipeScreenY = 160; // На сколько пикселей экран съедет вниз
    
    // Звуки (Опционально)
    // playSound(whoosh); // Звук выезда телефона

    const masterTicker = (ticker) => {
        const dt = ticker.deltaTime / 60; // В секундах
        globalTime += dt;

        // --- ФАЗА 1: Выезд телефона (0.0 - 0.6 сек) ---
        if (globalTime < 0.6) {
            const progress = globalTime / 0.6;
            const t = progress - 1;
            const ease = (t * t * (3 * t + 2) + 1); // Пружинка
            phoneGroup.position.y = 1500 + (300 - 1500) * ease;
        } 
        else if (globalTime < 0.8) {
            phoneGroup.position.y = 300; // Фиксируем в центре
        }

        // --- ФАЗА 2: Pull to Refresh (Свайп вниз) (0.8 - 1.4 сек) ---
        else if (globalTime < 1.4) {
            const progress = (globalTime - 0.8) / 0.6;
            
            // Экран едет вниз
            const easeDown = 1 - Math.pow(1 - progress, 3); 
            screenContainer.y = startScreenY + (swipeScreenY * easeDown);
            
            // Лоадер появляется и начинает крутиться
            loader.alpha = easeDown;
            loader.rotation += 0.1;
        }

        // --- ФАЗА 3: Загрузка + Быстрый набор денег (1.4 - 2.8 сек) ---
        else if (globalTime < 2.8) {
            screenContainer.y = swipeScreenY; // Экран висит внизу
            loader.rotation += 0.2; // Крутится быстрее

            // Крутим цифры (Быстро набираем от currentMoney до targetAmount)
            const progress = (globalTime - 1.4) / 1.4;
            const easeMoney = progress * progress; // Сначала медленно, потом быстро (Ease-In)
            
            // Чтобы эффектно смотрелось, добавим небольшую пульсацию
            moneyText.scale.set(1 + Math.sin(progress * Math.PI * 8) * 0.05);
            
            const displayMoney = currentMoney + (targetAmount - currentMoney) * easeMoney;
            moneyText.text = Math.floor(displayMoney).toLocaleString('ru-RU') + " €";
        }

        // --- ФАЗА 4: Возврат экрана наверх (2.8 - 3.2 сек) ---
        else if (globalTime < 3.2) {
            moneyText.text = Math.floor(targetAmount).toLocaleString('ru-RU') + " €"; // Фиксируем сумму
            moneyText.scale.set(1); // Возвращаем размер
            
            const progress = (globalTime - 2.8) / 0.4;
            // Экран отпружинивает обратно вверх
            const t = progress - 1;
            const easeUp = (t * t * (3 * t + 2) + 1); 
            
            screenContainer.y = swipeScreenY + (startScreenY - swipeScreenY) * easeUp;
            
            // Прячем лоадер
            loader.alpha = 1 - progress;
            loader.rotation += 0.1;
        }

        // --- ФАЗА 5: Закрытие телефона (Через 5.0 секунд) ---
        else if (globalTime > 4.2) {
            // Плавное затухание всего попапа
            const progress = (globalTime - 4.2) / 0.2; // 0.3 сек на исчезновение
            
            if (progress >= 1) {
                app.ticker.remove(masterTicker);
                popupContainer.destroy({ children: true });
                if (onComplete) onComplete(); 
            } else {
                popupContainer.alpha = 1 - progress;
            }
        }
    };

    // Запускаем весь сценарий
    app.ticker.add(masterTicker);
}

/**
 * Эффект "Искажение времени и пространства" (Twist + Chromatic Aberration)
 * Экран скручивается в воронку, цвета разъезжаются, 
 * и на пике искажения происходит смена сцены.
 * 
 * @param {Function} onPeak - Колбэк, когда экран максимально искажен (Тут меняем картинки)
 * @param {number} duration - Общее время эффекта (в секундах)
 */


/**
 * Запускает эффект "скручивания" на всей сцене.
 * @param {PIXI.Application} app - Экземпляр приложения Pixi.
 * @param {function} onPeak - Функция, которая будет вызвана в середине анимации.
 * @param {number} duration - Длительность анимации в секундах.
 */

    /**
     * Плавно перемещает и масштабирует камеру
     * @param {number} targetX - Целевая точка X в мире
     * @param {number} targetY - Целевая точка Y в мире
     * @param {number} targetZoom - Целевой зум
     * @param {number} durationSeconds - Время в секундах
     * @param {Function} onComplete - Колбэк по завершении
     */
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

// Глобальная переменная для хранения текущей руки на экране


/**
 * Надежная туториал-рука (Глобальное позиционирование)
 * @param {PIXI.DisplayObject} targetObject - Кнопка, на которую нужно указать
 */
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
    
    currentTutorialHand = hand; // Запоминаем текущую руку
}

/**
 * Функция для мгновенного скрытия руки
 */
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






        // --- RESIZE И АДАПТИВНОСТЬ ---
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

            // ==========================================
            // 1. ХЕДЕР (Настраиваемый отступ и высота)
            // ==========================================
            headerContainer.position.set(0, -halfH);

            const headerHeight = 200; 

            headerBg.clear();
            headerBg.rect(-halfW, 0, fullW, headerHeight);
            headerBg.fill('#424242'); 

            // --- НАСТРОЙКИ ХЕДЕРА ---
            const paddingLeft = 40;  // Отступ логотипа от левого края
            const paddingRight = 25; // Отступ баланса от правого края (СДЕЛАЛ БЛИЖЕ К КРАЮ!)
            const paddingBetween = 40; // Защитный пробел между ними

            const logoHeightPercent = 0.7; // Лого занимает 70% высоты хедера
            const balHeightPercent = 0.8;  // Баланс занимает 90% высоты хедера (СДЕЛАЛ БОЛЬШЕ!)

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

            // ==========================================
            // 2. ФУТЕР И ПОЛОСКА БОНУСА
            // ==========================================
// ==========================================
            // 2. ФУТЕР И ПОЛОСКА БОНУСА (С эффектом свечения)
            // ==========================================
// ==========================================
            // 2. ФУТЕР И ПОЛОСКА БОНУСА (С РЕАЛЬНЫМ СВЕЧЕНИЕМ)
            // ==========================================
// ==========================================
// 2. ФУТЕР И ПОЛОСКА БОНУСА (СВЕЧЕНИЕ НАД ПОЛОСОЙ)
// ==========================================
// ==========================================
            // 2. ФУТЕР И ПОЛОСКА БОНУСА (СО СВЕЧЕНИЕМ СВЕРХУ)
            // ==========================================
// ==========================================
            // 2. ФУТЕР И ПОЛОСКА БОНУСА (С ГРАДИЕНТОМ v8.5+)
            // ==========================================
// ==========================================
            // 2. ФУТЕР И ПОЛОСКА БОНУСА (С ГРАДИЕНТОМ v8.5+)
            // ==========================================
            footerContainer.position.set(0, halfH);

            const footerHeight = isPortrait ? 730 : 420; 
            const blueStripHeight = isPortrait ? 150 : 160; 
            const stripY = -footerHeight - blueStripHeight; 

            // 1. Темный фон футера
// 1. ВНЕШНИЙ Темный фон футера
            footerBg.clear();
            footerBg.rect(-halfW, -footerHeight, fullW, footerHeight);
            footerBg.fill('#2a2c38'); // Темно-синий/серый цвет (как основной фон)

            // 2. ВНУТРЕННИЙ Светлый фон футера (Рамка)
            const padding = 20; // Отступ от краев экрана
            const innerHeight = footerHeight - padding - 40; // Чуть меньше по высоте
            
            // Рисуем закругленный прямоугольник внутри
            footerBg.roundRect(-halfW + padding, -footerHeight + padding, fullW - (padding * 2), innerHeight, 20);
            footerBg.fill('#3a3b46'); // Чуть светлее, чем внешний фон

            // Очищаем графику полосы
            blueStripBg.clear();

            // 2. СВЕЧЕНИЕ НАД ПОЛОСОЙ (Градиент)
            const glowHeight = isPortrait ? 70 : 100;
            const glowY = stripY - glowHeight + 10;

            // НОВЫЙ СИНТАКСИС PIXIJS v8.5+ (Локальные координаты 0-1)
            const glowGradient = new PIXI.FillGradient({
                type: 'linear',
                start: { x: 0, y: 0 }, // 0 = Самый верх прямоугольника
                end: { x: 0, y: 1 },   // 1 = Самый низ прямоугольника
                colorStops: [
                    { offset: 0, color: '#aeefff00', alpha: 0 },   // Верх - прозрачный
                    { offset: 1, color: '#64e0ff', alpha: 0.5 }  // Низ - полупрозрачный голубой
                ]
            });

            glowGradient.zIndex = 10;

            // Рисуем область свечения и заливаем градиентом
            blueStripBg.rect(-halfW, glowY, fullW, glowHeight);
            blueStripBg.fill(glowGradient);

            // 3. ОСНОВНАЯ ГОЛУБАЯ ПОЛОСА (рисуется ПОСЛЕ — поверх нижней части градиента)
            blueStripBg.rect(-halfW, stripY, fullW, blueStripHeight);
            blueStripBg.fill('#42b8d4');

            // 4. ТОНКАЯ БЕЛАЯ КРОМКА (Для объема и эффекта стекла)
            blueStripBg.rect(-halfW, stripY, fullW, 2);
            blueStripBg.fill({ color: 0xffffff, alpha: 0.5 });

            // 5. ТЕКСТ БОНУСА
            bonusText.style.fontSize = isPortrait ? 46 : 68;
            //bonusText.style.dropShadow = { color: '#004c66', alpha: 0.5, distance: 3, blur: 2 }; 
            bonusText.position.set(0, -footerHeight - (blueStripHeight / 2));

            // ==========================================
            // 3. УМНЫЕ КНОПКИ
            // ==========================================
            

// ==========================================
            // 3. УМНЫЕ КНОПКИ И ПАНЕЛЬ ЭНЕРГИИ (Расчет позиций)
            // ==========================================
            
            // Базовые размеры
            let btnScale = isPortrait ? 0.9 : 0.75;
            let panelScale = isPortrait ? 0.8 : 0.55;

            if (isPortrait) {
                // ===============================================
                // ПОРТРЕТ (Телефон)
                // ===============================================
                topBarContainer.visible = true;
                
                // --- ЗАЩИТА ОТ НАЛОЖЕНИЯ КНОПОК ---
                const buttonsTotalWidth = (goButton.texture.width * btnScale * 2) + 40;
                if (buttonsTotalWidth > fullW) {
                    btnScale *= (fullW / buttonsTotalWidth) * 0.9; 
                }

                const panelWidth = betPanel.texture.width * panelScale;
                if (panelWidth > fullW) {
                    panelScale *= (fullW / panelWidth) * 0.9;
                }

                goButton.scale.set(btnScale , btnScale * 0.7);
                cashOutButton.scale.set(btnScale , btnScale * 0.7);
                betPanel.scale.set(panelScale);

                // --- РАССТАНОВКА ---
                const btnOffset = (goButton.texture.width * btnScale) / 2 + 45; 
                
                // Нижний ряд (Кнопки)
                goButton.position.set(btnOffset, -180); 
                cashOutButton.position.set(-btnOffset, -180); 
                
                // Средний ряд (Панель ставок)
                betPanel.position.set(0, -420); 
                
                // Верхний ряд (НОВАЯ ПАНЕЛЬ ЭНЕРГИИ)
                // Ставим её высоко над панелью ставок
                topBarContainer.position.set(0, -580); 
                
                // Если экран очень узкий, панель энергии тоже нужно уменьшить, 
                // чтобы её закругленные края не обрезались (базовая ширина бара = 800)
                let energyScale = 1.0;
                if (800 > fullW - 40) {
                    energyScale = (fullW - 40) / 800;
                }
                topBarContainer.scale.set(energyScale);

                } 
                 else {
                // ===============================================
                // ЛАНДШАФТ (Планшет / ПК)
                // ===============================================
                let l_btnScale = 0.95;
                const spacing = 20; // Пробел между кнопками и центральной панелью

                // 1. Считаем реальную ширину боковых кнопок (с учетом их вытягивания по X)
                const wCash = (cashOutButton.texture.width || 100) * (l_btnScale * 1.2);
                const wGo   = (goButton.texture.width || 100) * (l_btnScale * 1.2);

                // Применяем масштаб к боковым кнопкам
                goButton.scale.set(l_btnScale * 1.25, l_btnScale);
                cashOutButton.scale.set(l_btnScale * 1.25, l_btnScale);

                // 2. ВЫЧИСЛЯЕМ ДОСТУПНОЕ МЕСТО ДЛЯ ЦЕНТРА
                // Из ширины экрана вычитаем ширину кнопок, два пробела и 80px (отступы от краев экрана)
                const availableCenterWidth = fullW - wCash - wGo - (spacing * 2) - 80;

                // Защита: Если экран настолько узкий, что центра не осталось (очень маловероятно для ландшафта)
                const centerW = Math.max(availableCenterWidth, 300);

                // 3. ПОЗИЦИОНИРУЕМ ЦЕНТР И КНОПКИ
                const centerY = (-footerHeight / 2);
                
                // Ставим кнопки по краям от центрального блока
                cashOutButton.position.set(-centerW / 2 - spacing - (wCash / 2), centerY);
                goButton.position.set(centerW / 2 + spacing + (wGo / 2), centerY);

                // 4. НАСТРАИВАЕМ ЦЕНТРАЛЬНУЮ ПАНЕЛЬ
                if (isHellTraffic) {
                    // ЦЕНТР — topBarContainer (RAGE/ENERGY)
                    betPanel.visible = false;
                    topBarContainer.visible = true;

                    // Базовая ширина бара (800) + запас на заголовок слева и кнопки справа (примерно 250)
                    const topBarNativeW = 1050; 
                    
                    // Масштабируем topBar, чтобы он заполнил доступное место, но не был больше 1.5
                    const topBarScale = Math.min(centerW / topBarNativeW, 1.5);
                    
                    topBarContainer.scale.set(topBarScale);
                    // Ставим ровно по центру экрана по X
                    topBarContainer.position.set(0, centerY);

                } else {
                    // ЦЕНТР — betPanel (MIN/MAX)
                    betPanel.visible = true;
                    topBarContainer.visible = false;

                    const betPanelNativeW = betPanel.texture.width || 100;
                    
                    // Масштабируем betPanel, чтобы она заполнила доступное место
                    const panelScale = Math.min(centerW / betPanelNativeW, 1.5);

                    betPanel.scale.set(panelScale);
                    // Ставим ровно по центру
                    betPanel.position.set(0, centerY);
                } 
        }
        
    

            // ===============================================
            // 4. АДАПТИВ PUSH-УВЕДОМЛЕНИЯ (Исправлено расположение!)
            // ===============================================
            if (typeof pushContainer !== 'undefined' && pushContainer && !pushContainer.destroyed) {
                const targetWidth = GAME_WIDTH * (isPortrait ? 0.9 : 0.8); 
                const pushScale = targetWidth / 980; 
                
                pushContainer.targetScale = pushScale;
                
                if (!pushContainer.isSpawning) {
                    pushContainer.scale.set(pushScale);
                }
            }

            if (disclaimer && disclaimer.parent) {
        // halfH - это самый низ экрана. 
            // Вычитаем 20 пикселей, чтобы текст не прилипал вплотную к рамке.
            disclaimer.position.set(0, halfH - 5);
            
            // Опционально: уменьшаем шрифт в ландшафте, чтобы не мешал
            disclaimer.style.fontSize = (sw > sh) ? 21 : 28;
            }


            shineEffect.stripY = stripY;
            shineEffect.stripHeight = blueStripHeight;
            shineEffect.halfW = halfW;
            shineEffect.fullW = fullW;


            





            // --- РИСУЕМ БЛИК (Внутри функции resize) ---
            //const shineWidth = 3000; // Ширина блика
            
            // Горизонтальный градиент: прозрачный -> белый -> прозрачный


            //stripShine.clear();
            // Рисуем блик ровно по высоте голубой полосы (blueStripHeight)
            // Позиция Y такая же, как у полосы (stripY)
            //stripShine.rect(-shineWidth / 2, stripY, shineWidth, blueStripHeight);
            


            

        }
// Когда пользователь крутит телефон или меняет размер окна:
        window.addEventListener('resize', () => {
            // Умная камера сама всё посчитает и В КОНЦЕ САМА вызовет resize()!
            focusCameraOnPlayer(true); 
        });
        
        // Самый первый запуск при загрузке игры
        focusCameraOnPlayer(true);
        
        
        // --- ЖЕСТКИЙ DEBUG РУКИ ---
    

    } catch (e) {
        console.error("Playable Init Error:", e);
    }




};

function startApp() {
    // Вызываем твою главную функцию
    init().catch(e => console.error(e));
}

// Проверяем, запущены ли мы внутри рекламной сети
if (typeof mraid !== "undefined") {
    // IronSource и Unity требуют проверки статуса!
    if (mraid.getState() === "loading") {
        // Если сеть еще грузится, ждем события 'ready'
        mraid.addEventListener("ready", startApp);
    } else {
        // Если уже готово - стартуем
        startApp();
    }
} else {
    // Если запущены локально в браузере (npm run dev)
    startApp();
}