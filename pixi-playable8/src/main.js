import './style.css';
import * as PIXI from 'pixi.js';
import bgFirstIMG from './assets/background1.webp';
import commonIMG from './assets/common.webp';
import rareIMG from './assets/rare.webp';
import epicIMG from './assets/epic.webp';
import legendaryIMG from './assets/legendary.webp';
import nightStartIMG from './assets/nightStart.webp';
import redRoadIMG from './assets/redRoad.webp';
import lukIMG from './assets/luk.webp';
import barrierIMG from './assets/barrier.webp';
import car1IMG from './assets/car1.webp';
import car2IMG from './assets/car2.webp';
import car3IMG from './assets/car3.webp';
import car4IMG from './assets/car4.webp';
import balanceIMG from './assets/balance.png';
import logoIMG from './assets/logo.webp';
import panelIMG from './assets/panel.webp';
import difficultIMG from './assets/DiddicultyPannel.webp';
import totalWinIMG from './assets/totalWin.webp';
import  bgmAudioFile from './assets/bgMusic.mp3';
import jump from './assets/jump.mp3';
import cars from './assets/cars.mp3';
import trans from './assets/trans.mp3';
import free from './assets/games.mp3';
//import bgIMG from './assets/background.png';



// ==========================================
// ГЛОБАЛЬНАЯ РАЗБЛОКИРОВКА АУДИО (iOS / Android)
// ==========================================
// ==========================================
// ГЛОБАЛЬНАЯ РАЗБЛОКИРОВКА АУДИО (iOS / Android)
// ==========================================
let isAudioUnlocked = false;

function unlockAudioOnFirstTouch() {
    if (isAudioUnlocked) return;
    
    // Создаем пустой звук (хак для iOS/Android)
    const silentAudio = new Audio();
    silentAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    
    silentAudio.play().then(() => {
        isAudioUnlocked = true;
        
        // ==========================================
        // БРАУЗЕР ДАЛ ДОБРО! ЗАПУСКАЕМ ФОНОВУЮ МУЗЫКУ
        // ==========================================
        // Передаем импортированный файл и громкость (например, 0.4)
        if (typeof bgmAudioFile !== 'undefined') {
            startBGM(bgmAudioFile, 0.4); 
        }

        // Убираем слушатели, чтобы функция больше не вызывалась
        document.removeEventListener('touchstart', unlockAudioOnFirstTouch, true);
        document.removeEventListener('touchend', unlockAudioOnFirstTouch, true);
        document.removeEventListener('click', unlockAudioOnFirstTouch, true);
    }).catch((e) => {
        console.warn("Автоплей заблокирован:", e);
    });
}

document.addEventListener('touchstart', unlockAudioOnFirstTouch, { once: true, passive: true });
document.addEventListener('touchend',   unlockAudioOnFirstTouch, { once: true, passive: true });
document.addEventListener('click',      unlockAudioOnFirstTouch, { once: true, passive: true });



// ==========================================
// КОНФИГ
// ==========================================
const GAME_WIDTH  = 1080;
const GAME_HEIGHT = 1920;

let pushContainer = null;



// ==========================================
// ОТКРЫТИЕ МАГАЗИНА (AdNetwork-aware)
// ==========================================
function openStore() {
    PIXI.Ticker.shared.stop();
    pauseGame();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    let finalUrl = null;
    if (typeof buildConfig !== 'undefined') {
        finalUrl = isIOS ? buildConfig.appStoreUrl : buildConfig.googlePlayUrl;
        if (!finalUrl) finalUrl = buildConfig.googlePlayUrl || buildConfig.appStoreUrl;
    }

    if (typeof window.FbPlayableAd !== 'undefined') { window.FbPlayableAd.onCTAClick(); return; }
    if (typeof gameplayapi !== 'undefined') { gameplayapi.gameplayStop(); gameplayapi.openStoreLink(); return; }
    if (typeof mraid !== 'undefined') { mraid.open(finalUrl); return; }
    window.open(finalUrl, '_blank');
}


// ==========================================
// ЗАГРУЗКА ТЕКСТУР
// ==========================================
const getAssetPath = (src) => (src && src.default) ? src.default : src;

/**
 * Безопасная загрузка текстуры (без CORS-заголовков, работает в рекламных сетях)
 * @param {string|object} src — путь или импортированный модуль
 * @returns {Promise<PIXI.Texture>}
 */
function loadTextureDirectly(src) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload  = () => resolve(PIXI.Texture.from(img));
        img.onerror = ()  => reject(new Error(`Failed to load image: ${src}`));
        img.src = getAssetPath(src);
    });
}

/**
 * Создаёт AnimatedSprite из папки с PNG/WebP кадрами (import.meta.glob)
 * @param {object}  globObject — результат import.meta.glob('./assets/Anim/*.webp', { eager: true, import: 'default' })
 * @param {number}  speed      — animationSpeed (0.1–1.0)
 * @param {boolean} loop
 * @returns {Promise<PIXI.AnimatedSprite>}
 */
async function createAnimFromFolder(globObject, speed = 0.5, loop = true) {
    const sortedKeys = Object.keys(globObject).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );
    const urls = sortedKeys.map(k => globObject[k]?.default || globObject[k]);

    const loadSafe = (src) => new Promise((res, rej) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload  = () => res(PIXI.Texture.from(img));
        img.onerror = () => rej(new Error(`Frame load failed: ${src}`));
        img.src = src;
    });

    const textures = await Promise.all(urls.map(loadSafe));
    const anim = new PIXI.AnimatedSprite(textures);
    anim.animationSpeed = speed;
    anim.loop = loop;
    anim.anchor.set(0.5);
    return anim;
}

/**
 * Быстро клонирует существующий AnimatedSprite
 * @param {PIXI.AnimatedSprite} sourceAnim - Оригинал анимации
 * @returns {PIXI.AnimatedSprite} - Новый независимый спрайт
 */
function cloneAnimation(sourceAnim) {
    if (!sourceAnim || !sourceAnim.textures) return null;

    // Создаем новый спрайт, используя ТЕ ЖЕ текстуры из памяти
    const clone = new PIXI.AnimatedSprite(sourceAnim.textures);
    
    // Копируем настройки оригинала
    clone.animationSpeed = sourceAnim.animationSpeed;
    clone.loop = sourceAnim.loop;
    clone.anchor.copyFrom(sourceAnim.anchor);
    clone.scale.copyFrom(sourceAnim.scale);
    
    // Запускаем проигрывание
    //clone.play();
    
    return clone;
}


// ==========================================
// АУДИО
// ==========================================
let isGameMuted = false;
const activeSounds = new Set();
let bgmAudio = null;
let isBgmStarted = false;

/**
 * Воспроизводит одиночный звуковой эффект
 * @param {string} soundUrl
 * @param {number} volume — 0.0–1.0
 */
function playSound(soundUrl, volume = 1.0) {
    if (isGameMuted || !soundUrl) return;
    const sfx = new Audio(soundUrl);
    sfx.volume = volume;
    activeSounds.add(sfx);
    sfx.onended = () => activeSounds.delete(sfx);
    sfx.onerror = () => activeSounds.delete(sfx);
    sfx.play().catch(() => activeSounds.delete(sfx));
}

/**
 * Запускает фоновую музыку (один раз, зациклена)
 * @param {string} bgmUrl
 * @param {number} volume
 */
function startBGM(bgmUrl, volume = 0.6) {
    if (isGameMuted || isBgmStarted || !bgmUrl) return;
    isBgmStarted = true;
    bgmAudio = new Audio(bgmUrl);
    bgmAudio.volume = volume;
    bgmAudio.loop = true;
    bgmAudio.play().catch(() => { isBgmStarted = false; });
}

function pauseGame() {
    isGameMuted = true;
    PIXI.Ticker.shared.stop();
    activeSounds.forEach(s => s.pause());
    if (bgmAudio) bgmAudio.pause();
}

function resumeGame() {
    isGameMuted = false;
    PIXI.Ticker.shared.start();
    activeSounds.forEach(s => s.play().catch(() => {}));
    if (bgmAudio && isBgmStarted) bgmAudio.play().catch(() => {});
}

document.addEventListener('visibilitychange', () => document.hidden ? pauseGame() : resumeGame());
if (typeof mraid !== 'undefined') {
    mraid.addEventListener('viewableChange', (v) => v ? resumeGame() : pauseGame());
}

        




// ==========================================
// ЛОКАЛИЗАЦИЯ
// ==========================================

// ==========================================
// ЛОКАЛИЗАЦИЯ
// ==========================================
/**
 * Возвращает переведённую строку (или ключ если перевода нет)
 * @param {string} key
 * @returns {string}
 */
function getT(key) {
    const defaults = {
        win:           'WIN',
        install:       'INSTALL NOW',
        disclaimer:    'For illustrative purposes only',
        claim:         'CLAIM',
        cashout:       'CASH OUT',
        welcome:       'WELCOME BONUS',
        play:          'PLAY',
        deposit_bonus: 'DEPOSIT BONUS',
        free_spins:    'FREE SPINS',
        go:            'GO',
        you_won:       'YOU WON!',
        download:      'DOWNLOAD',
        // --- Новые фразы ---
        fly:           'FLY',
        big_win:       'BIG WIN',
        take_reward:   'TAKE YOUR REWARD'
    };
    
    if (typeof buildConfig !== 'undefined' && buildConfig.translations) {
        const lang = buildConfig.language || 'EN';
        if (buildConfig.translations[lang]?.[key]) return buildConfig.translations[lang][key];
    }
    
    return defaults[key] || key;
}


// ==========================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ==========================================
const init = async () => {
    try {

        await document.fonts.load('10pt "LuckiestGuy"');
        await document.fonts.load('10pt "Inter"');
        await document.fonts.load('10pt "softhyphen"');
        
        // 2. Ждем, пока браузер закончит обработку всех шрифтов
        await document.fonts.ready;

        await document.fonts.ready;

        const app = new PIXI.Application();
        await app.init({
            width:           window.innerWidth,
            height:          window.innerHeight,
            backgroundColor: 0x87CEEB,
            autoDensity:     true,
            resolution:      window.devicePixelRatio || 1,
        });
        document.body.appendChild(app.canvas);
        app.stage.eventMode = 'static';
        app.stage.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);


        const [bgFirstTex, commonTex , rareTex , epicTex , legendaryTex , nightStartTex , redRoadTex ,
             lukTex , barrierTex , car1Tex , car2Tex , car3Tex , car4Tex , logoTex , balanceTex , panelTex , difficultyTex , totalWinTex] = await Promise.all([
            loadTextureDirectly(bgFirstIMG),
            loadTextureDirectly(commonIMG),
            loadTextureDirectly(rareIMG),
            loadTextureDirectly(epicIMG),
            loadTextureDirectly(legendaryIMG),
            loadTextureDirectly(nightStartIMG),
            loadTextureDirectly(redRoadIMG),
            loadTextureDirectly(lukIMG),
            loadTextureDirectly(barrierIMG),
            loadTextureDirectly(car1IMG),
            loadTextureDirectly(car2IMG),
            loadTextureDirectly(car3IMG),
            loadTextureDirectly(car4IMG),
            loadTextureDirectly(logoIMG),
            loadTextureDirectly(balanceIMG),
            loadTextureDirectly(panelIMG),
            loadTextureDirectly(difficultIMG),
            loadTextureDirectly(totalWinIMG),

        ]);

        // ------------------------------------------
        // КАМЕРА
        // ------------------------------------------
        let cameraX    = 0;
        let cameraY    = 0;
        let cameraZoom = 1;
        let currentCameraTicker = null;

        /** Слои с параллаксом. parallaxFactor: 0 = статичный, 1 = обычный мир */
        const cameraLayers = [];

        function createLayer(parallaxFactor) {
            const layer = new PIXI.Container();
            layer.parallaxFactor = parallaxFactor;
            app.stage.addChild(layer);
            cameraLayers.push(layer);
            return layer;
        }

        // ------------------------------------------
        // СЛОИ (пример структуры — замени под свою игру)
        // ------------------------------------------
        const gameContainer    = createLayer(1.0); // Игровой мир
        const uiOverlayContainer = new PIXI.Container(); // UI поверх всего
        app.stage.addChild(uiOverlayContainer);

        const player = new PIXI.Container();
        player.position.set(-1260, 0);
        player.scale.set(1.45);


        const backgroundFirstSprite = new PIXI.Sprite({ texture: bgFirstTex });
        backgroundFirstSprite.anchor.set(0.5);

        // Ставим дорогу в центр или в начальные координаты (например 0, 0)
        backgroundFirstSprite.position.set(300, 0);
        backgroundFirstSprite.scale.set(3);
        

        const backgroundFirstSpriteMirror = new PIXI.Sprite({ texture: bgFirstTex });

        backgroundFirstSpriteMirror.anchor.set(0.5);

        // Ставим дорогу в центр или в начальные координаты (например 0, 0)
        backgroundFirstSpriteMirror.position.set(1700, 0);
        backgroundFirstSpriteMirror.scale.x = -3;
        backgroundFirstSpriteMirror.scale.y = 3;
        gameContainer.addChild(backgroundFirstSpriteMirror);
        gameContainer.addChild(backgroundFirstSprite);

        const nightStart = new PIXI.Sprite({ texture: nightStartTex });
        nightStart.anchor.set(0.5);
        nightStart.position.set(-1570 , 0);
        nightStart.scale.set(2.3);
        nightStart.visible = false;

        gameContainer.addChild(nightStart);

        const redRoad = new PIXI.Sprite({ texture: redRoadTex });
        redRoad.scale.set(1.3);
        redRoad.anchor.set(0.5);
        redRoad.position.set(2135 , 0);
        gameContainer.addChild(redRoad);

        const amountStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen',
            fontSize: 68,
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: { color: '#000000', width: 6 },
            dropShadow: { color: '#000000', alpha: 0.8, distance: 3, blur: 4 },
            align: 'center'
        });

        const luksArray = [];
        const bareers = [];
        const monees = []
        const startX = -960;
        const offset = 420;

        const initialAmounts = [1.3 , 1.7, 2.1, 2.3 , 3 , 3.2 , 3.5 , 4 , 4.2 , 4.5 , 4.7 , 5.2];



        const idleFrames = import.meta.glob('./assets/PlayerIdle/*.webp', { eager: true, import: 'default' });
        const animIdle = await createAnimFromFolder(idleFrames, 0.3, true);
        const tapeFrames = import.meta.glob('./assets/Tape/*.webp', { eager: true, import: 'default' });
        const animTape = await createAnimFromFolder(tapeFrames, 0.15, true);
        const flyCoinFrames = import.meta.glob('./assets/bonus/*.webp', { eager: true, import: 'default' });
        const animFlyCoin = await createAnimFromFolder(flyCoinFrames, 0.2, true);
        const CoinsFrames = import.meta.glob('./assets/Coins/*.webp', { eager: true, import: 'default' });
        const animCoins = await createAnimFromFolder(CoinsFrames, 0.2, true);
        const jumpFrames = import.meta.glob('./assets/PlayerJump/*.webp', { eager: true, import: 'default' });
        const animJump = await createAnimFromFolder(jumpFrames, 0.17, true);
        const SuperWinFrames = import.meta.glob('./assets/SuperWin/*.webp', { eager: true, import: 'default' });
        const animSuperWin = await createAnimFromFolder(SuperWinFrames, 0.2, true);


        // ==========================================
    // ВЕРХНЯЯ ПАНЕЛЬ (HEADER)
    // ==========================================
    const headerContainer = new PIXI.Container();
    headerContainer.zIndex = 100; // Поверх игры
    uiOverlayContainer.addChild(headerContainer);

    // 1. Темная подложка на всю ширину
    const headerBg = new PIXI.Graphics();
    headerBg.rect(-2500, -50, 5000, 150); // Очень широкая, чтобы закрыть края при повороте
    headerBg.fill({ color: '#424242', alpha: 1 }); // Темно-серый цвет
    headerContainer.addChild(headerBg);

    // 2. Логотип (слева)
    const topLogo = new PIXI.Sprite({ texture: logoTex });
    topLogo.anchor.set(0, 0.5); // Якорь слева по центру
    topLogo.scale.set(1.3);      // Подбери нужный размер
    headerContainer.addChild(topLogo);

    // 3. Плашка баланса (справа)
    const topBalanceContainer = new PIXI.Container();
    headerContainer.addChild(topBalanceContainer);

    const balanceBg = new PIXI.Sprite({ texture: balanceTex });
    balanceBg.anchor.set(1, 0.5); // Якорь справа по центру
    balanceBg.scale.set(1.2);
    topBalanceContainer.addChild(balanceBg);

    // ==========================================
    // ПЛАШКА "TOTAL WIN" (По центру сверху)
    // ==========================================
    const totalWinGroup = new PIXI.Container();
    totalWinGroup.zIndex = 100;
    uiOverlayContainer.addChild(totalWinGroup);

    // Спрайт плашки
    const totalWinBg = new PIXI.Sprite({ texture: totalWinTex });
    totalWinBg.anchor.set(0.5);
    totalWinBg.scale.set(0.4); // Подгони под нужный размер
    totalWinGroup.addChild(totalWinBg);

    // Текст с цифрами (Изначально "25")
    let currentTotalWin = 25; // Это наше стартовое значение
    let visualTotalWin = 25;  // То, что сейчас видит игрок

    const totalWinText = new PIXI.Text({
        text: "25",
        style: {
            fontFamily: 'softhyphen', // Или твой шрифт с цифрами
            fontSize: 65,
            fill: '#ffffff',
            align: 'center',
            dropShadow: { color: '#000000', alpha: 0.5, distance: 3, blur: 2 }
        }
    });
    totalWinText.anchor.set(0.5);

    const WinText = new PIXI.Text({
        text: getT('buy_bonus').toUpperCase() ,
        style: {
            fontFamily: 'softhyphen', // Или твой шрифт с цифрами
            fontSize: 65,
            fill: '#fffb00',
            align: 'center',
            dropShadow: { color: '#000000', alpha: 0.5, distance: 3, blur: 2 }
        }
    });
    totalWinText.anchor.set(0.5);
    
    // ВАЖНО: Если на твоем ассете надпись TOTAL WIN уже нарисована сверху,
    // сдвинь текст с цифрами чуть вниз, чтобы он попал ровно в красное поле.
    // Если ассет пустой, текст будет по центру (0, 0).
    totalWinText.position.set(0, 20); 
    WinText.anchor.set(0.5);
    WinText.position.set(0 , -60);
    
    totalWinGroup.addChild(totalWinText);
    totalWinGroup.addChild(WinText);

    // 4. Текст баланса внутри плашки
    const topBalanceText = new PIXI.Text({
        text: "1500.00 EUR", 
        style: {
            fontFamily: 'softhyphen', // Или твой шрифт
            fontSize: 42,
            fontWeight: 'bold',
            fill: '#ffffff'
        }
    });
    topBalanceText.anchor.set(1, 0.5);
    // Сдвигаем текст влево от края плашки, чтобы он был внутри
    topBalanceText.position.set(-200, 0); 
    balanceBg.addChild(topBalanceText);
        for(let i = 0; i <= 8; i++) {
            // Создаем КОНТЕЙНЕР для люка (чтобы картинка и текст двигались вместе)
            const lukContainer = new PIXI.Container();
            lukContainer.position.set(i * offset + startX, 0);
            
            // Запоминаем текущую сумму в самом объекте (пригодится для умножения)
            lukContainer.currentAmount = initialAmounts[i] || 0;


                
         
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

            gameContainer.addChild(lukContainer);
            luksArray.push(lukContainer);
            
        }


                let gameIsStarted = false;

                    // ==========================================
                // НИЖНЯЯ ПАНЕЛЬ (FOOTER)
                // ==========================================
        // ==========================================
            // НИЖНЯЯ ПАНЕЛЬ (FOOTER)
            // ==========================================
   // ==========================================
    // НИЖНЯЯ ПАНЕЛЬ (FOOTER)
    // ==========================================
        const footerContainer = new PIXI.Container();
        footerContainer.zIndex = 110; 
        uiOverlayContainer.addChild(footerContainer);

        // 1. ТЕМНАЯ ПОДЛОЖКА (Бесконечная в ширину, цвет как на референсе)
// 1. ТЕМНАЯ ПОДЛОЖКА
        const footerDarkBase = new PIXI.Graphics();
        
        // Увеличили высоту со 170 до 220 (от -110 до +110)
        footerDarkBase.rect(-3000, -210, 6000, 720); 
        
        footerDarkBase.fill({ color: '#424242', alpha: 1 });
        footerContainer.addChild(footerDarkBase);

        // ГРУППА КОНТЕНТА (В ней элементы будут намертво "склеены")
        const contentGroup = new PIXI.Container();
        contentGroup.scale.set(1.2);
        footerContainer.addChild(contentGroup);

        // 2. ГЛАВНАЯ ПАНЕЛЬ СТАВОК (panelTex)
        const footerBg = new PIXI.Sprite({ texture: panelTex });
        footerBg.anchor.set(0.5);
        // Сдвигаем влево внутри нашей группы
        footerBg.position.set(-860, -50); 
        contentGroup.addChild(footerBg);

        // 3. БЛОК DIFFICULTY (difficultyTex)
        const diffBlock = new PIXI.Sprite({ texture: difficultyTex });
        diffBlock.anchor.set(0.5);
        diffBlock.scale.set(0.80);
        // Ставим по центру, чуть правее панели ставок
        diffBlock.position.set(250, -45); 
        contentGroup.addChild(diffBlock);

        // 4. ЗЕЛЕНАЯ КНОПКА (Справа)
        const freeGamesBtn = new PIXI.Container();
        // Ставим справа от difficulty
        freeGamesBtn.position.set(740, -130); 
        contentGroup.addChild(freeGamesBtn);

        const btnGraphics = new PIXI.Graphics();
        // Рисуем кнопку (чуть изменил пропорции, чтобы была похожа на референс)
        btnGraphics.roundRect(300, -150, 540, 220, 10);
        btnGraphics.position.set(-100 , 120);
        btnGraphics.fill({ color: 0x439c50 }); // Мягкий зеленый, как на скрине
        freeGamesBtn.addChild(btnGraphics);

        const freeGamesText = new PIXI.Text({ 
            text: getT('free_games_left').toUpperCase() + " 3", 
            style: {
                fontFamily: 'softhyphen', // На референсе строгий системный шрифт, а не Luckiest Guy
                fontSize: 25,
                fontWeight: 'bold',
                fill: '#ffffff',
                align: 'center'
            } 
        });
        freeGamesText.anchor.set(0.5);
        freeGamesText.position.set(460 , 80);
        freeGamesBtn.addChild(freeGamesText);

        // 2. Создаем сколько угодно клонов мгновенно в любой момент игры:
        const tapeClone1 = cloneAnimation(animTape);
        tapeClone1.position.set(0, 2100);
        tapeClone1.scale.set(7);
        uiOverlayContainer.addChild(tapeClone1);

        const tapeClone2 = cloneAnimation(animTape);
        tapeClone2.scale.set(7);
        tapeClone2.position.set(0, 1150);
        uiOverlayContainer.addChild(tapeClone2);
        const tapeClone3 = cloneAnimation(animTape);
        tapeClone3.scale.set(7);
        tapeClone3.position.set(0, -500);
        uiOverlayContainer.addChild(tapeClone3);

        animTape.zIndex = 100;
        tapeClone1.zIndex = 100;
        tapeClone2.zIndex = 100;
        tapeClone3.zIndex = 100;

        animTape.scale.set(7);
        animTape.position.set(0, 300);
        uiOverlayContainer.addChild(animTape);

        player.addChild(animIdle);
        animIdle.visible = true;
        animIdle.play();

        // ==========================================
        // 1. НАСТРОЙКА ИГРОКА И СЛОЕВ
        // ==========================================
        // Добавляем анимацию прыжка игроку (скрыта по умолчанию)
        player.addChild(animJump);
        animJump.visible = false;

        // Создаем специальный контейнер для барьеров и машин
        // Помещаем его ЗА игроком, но ПЕРЕД люками
        const obstaclesLayer = new PIXI.Container();
        
        // Включаем сортировку, чтобы игрок всегда был поверх машин и барьеров
        gameContainer.sortableChildren = true;
        player.zIndex = 100;
        obstaclesLayer.zIndex = 50;
        
        // Если luksArray добавлялись в gameContainer, их zIndex по умолчанию 0 (они в самом низу)
        gameContainer.addChild(obstaclesLayer);

        // Массив машин для рандома
        const carTextures = [car1Tex, car2Tex, car3Tex, car4Tex];
        const PLAYER_START_X = -1400; // Стартовая позиция из твоего кода

        gameContainer.addChild(player);

        //showChickenSelection();

        animTape.loop = false; 
        tapeClone2.loop = false;
        tapeClone2.loop = false;
        tapeClone1.loop = false;
        animTape.onComplete = () => {
            console.log("Анимация завершена!");
            tapeClone1.destroy();
            tapeClone2.destroy();
            tapeClone3.destroy();
            animTape.destroy();
            showFreeGamesReward(3, ()=>{
                gameIsStarted = true;
            });
            // Здесь можно удалить объект или запустить следующее действие
            // animTape.destroy();
        };

        gameContainer.addChild(player);

        // Передаем итоговую сумму выигрыша (например, 74630)
        //showSuperWinScreen(74630);

        showChickenSelection(()=>{
            
        })


        //showFreeGamesReward(3);



// ==========================================
        // 2. ИГРОВАЯ ЛОГИКА (РАУНДЫ И ПРЫЖКИ)
        // ==========================================
        let currentRound = 1;      // Текущий раунд (1, 2, 3)
        let currentLukIndex = -1;  // Индекс люка, на котором стоит курица (-1 = на старте)
        let isJumping = false;     // Блокировка кликов во время прыжка

        // Целевые люки для каждого раунда (индексы массива начинаются с 0!)
        // 5-й люк = индекс 4. 7-й люк = индекс 6.
        const TARGET_LUKS = {
            1: 4, 
            2: 6,
            3: 4
        };

        /**
         * Главная функция прыжка на следующий люк
         */
        function jumpToNextLuk() {
            if (isJumping) return;

            playSound(jump);

            focusCameraOnTarget(player , false);

            // Курица прыгнула на люк с множителем x2
            addTotalWin(5292); // Плашка начнет расти с 25 до 2525
            
            const targetIndex = currentLukIndex + 1;
            
            // Проверка: есть ли еще люки?
            if (targetIndex >= luksArray.length) return;

            isJumping = true;
            currentLukIndex = targetIndex;
            const targetLuk = luksArray[targetIndex];

            // 1. Меняем анимацию на прыжок
            animIdle.visible = false;
            animJump.visible = true;
            animJump.gotoAndPlay(0); // Начинаем с первого кадра

            // 2. Анимация прыжка по параболе (X меняется линейно, Y по дуге)
            const startX = player.x;
            const targetX = targetLuk.x;
            const startY = player.y; // 0
            const jumpHeight = 250;  // Высота прыжка курицы
            const jumpDuration = 0.4; // Время прыжка (в секундах)

            let progress = 0;
            const jumpTicker = (ticker) => {
                progress += ticker.deltaTime / (jumpDuration * 60);

                if (progress >= 1) {
                    // ПРИЗЕМЛЕНИЕ
                    app.ticker.remove(jumpTicker);
                    player.position.set(targetX, startY);
                    
                    // Возвращаем анимацию Idle
                    animJump.visible = false;
                    animIdle.visible = true;
                    animIdle.play();

                    // Спавним барьер и машину
                    spawnObstacles(targetLuk.x);

                    // Проверяем, не дошли ли до конца раунда
                    checkRoundEnd();
                } else {
                    // Полет по параболе
                    player.x = startX + (targetX - startX) * progress;
                    // Парабола: 4 * p * (1 - p) дает дугу от 0 до 1 и обратно в 0
                    player.y = startY - jumpHeight * (4 * progress * (1 - progress));
                }
            };
            app.ticker.add(jumpTicker);
        }

        /**
         * Спавн барьера и машины на X координате люка
         */
/**
         * Спавн барьера и машины на X координате люка
         */
        function spawnObstacles(lukX) {
            // ==========================================
            // 1. ПАДЕНИЕ БАРЬЕРА
            // ==========================================
            const barrier = new PIXI.Sprite({ texture: barrierTex });
            barrier.anchor.set(0.5);
            barrier.scale.set(0.75);
            
            // Спавним высоко в небе
            const startBarrierY = -800; 
            // Где он должен остановиться (чуть выше люка, чтобы курица стояла перед ним)
            const targetBarrierY = -250; 
            
            barrier.position.set(lukX, startBarrierY); 
            obstaclesLayer.addChild(barrier);

            let fallProgress = 0;
            const dropTicker = (ticker) => {
                // Если барьер удален (например, при рестарте раунда), убиваем тикер!
                if (barrier.destroyed) return app.ticker.remove(dropTicker);

                fallProgress += ticker.deltaTime / (0.3 * 60); // Падает за 0.3 сек
                
                if (fallProgress >= 1) {
                    app.ticker.remove(dropTicker);
                    barrier.y = targetBarrierY;
                    // playSound(barrierSound);
                } else {
                    // Эффект ускорения при падении (Ease In)
                    barrier.y = startBarrierY + (targetBarrierY - startBarrierY) * (fallProgress * fallProgress);
                }
            };
            app.ticker.add(dropTicker);

            // ==========================================
            // 2. ВЫЕЗД МАШИНЫ (Останавливается ПЕРЕД барьером)
            // ==========================================
            // Шанс 50% на появление машины
            if (Math.random() > 0.5) {
                setTimeout(() => {
                    const randomCar = carTextures[Math.floor(Math.random() * carTextures.length)];
                    const car = new PIXI.Sprite({ texture: randomCar });
                    car.anchor.set(0.5);
                    car.scale.set(0.75);
                    
                    // Машина выезжает сверху (за экраном)
                    const startCarY = -1500;
                    // Машина ДОЛЖНА ОСТАНОВИТЬСЯ перед барьером (чуть выше него)
                    // Подбери это число (-100 или -200), чтобы капот машины не въезжал в барьер
                    const targetCarY = targetBarrierY - 430; 

                    car.position.set(lukX, startCarY); 
                    // Машина должна быть ЗА барьером, чтобы если они пересекутся, барьер был сверху
                    obstaclesLayer.addChildAt(car, 0); 

                    let driveProgress = 0;
                    const driveDuration = 0.5; // Едет полсекунды

                    const driveTicker = (ticker) => {
                        // ЗАЩИТА ОТ КРАША: Если машина удалена (рестарт раунда), убиваем тикер!
                        if (car.destroyed) return app.ticker.remove(driveTicker);

                        driveProgress += ticker.deltaTime / (driveDuration * 60); 

                        if (driveProgress >= 1) {
                            app.ticker.remove(driveTicker);
                            // МАШИНА ОСТАНАВЛИВАЕТСЯ ПЕРЕД БАРЬЕРОМ И СТОИТ!
                            car.y = targetCarY;
                            
                            // Опционально: звук тормозов
                            // playSound(brakeSound);
                        } else {
                            // Плавное торможение машины (Cubic Ease Out)
                            const easeOut = 1 - Math.pow(1 - driveProgress, 3);
                            car.y = startCarY + (targetCarY - startCarY) * easeOut;
                        }
                    };
                    app.ticker.add(driveTicker);
                    playSound(cars);
                    
                }, 300); // Задержка 0.3 сек после падения барьера
            }
        }

        /**
         * Проверка: нужно ли завершать раунд?
         */
/**
         * Проверка: нужно ли завершать раунд?
         */
        function checkRoundEnd() {
            const targetForThisRound = TARGET_LUKS[currentRound];

            if (currentLukIndex === targetForThisRound) {
                console.log(`ЦЕЛЬ ДОСТИГНУТА! ЗАПУСК ТРАФИКА...`);
                
                // 1. Запускаем поток машин по всем дорожкам
                spawnTrafficJam();
                playSound(cars);

                const gamesLeft = 3 - currentRound;
                freeGamesText.text = getT('free_games_left').toUpperCase() + " " + gamesLeft;

                if (currentRound === 3) {
                     addTotalWin(11);
                    // ФИНАЛ: Ждем чуть дольше, чтобы насладиться трафиком
                    setTimeout(() => {
                        showSuperWinScreen(90000);
                    }, 1500);
                } else {
                    // ОБЫЧНЫЙ РАУНД: Ждем проезда машин и телепортируем назад
                    setTimeout(() => {
                        currentRound++;
                        resetRound();
                    }, 1200);
                }
            } else {
                // Раунд не окончен, разрешаем прыгать дальше
                isJumping = false; 
            }
        }

        /**
         * Откат на старт и очистка препятствий
         */
        function resetRound() {
            // 1. Очищаем все барьеры и машины
            // destroy({ children: true }) безопасно удалит спрайты, не удаляя сам слой
            while(obstaclesLayer.children[0]) {
                obstaclesLayer.children[0].destroy();
            }

            // 2. Телепортируем курицу на старт
            player.position.set(PLAYER_START_X, 0);
            currentLukIndex = -1; // Сбрасываем индекс люка

            // 3. Разрешаем прыгать снова
            isJumping = false;
            console.log(`НАЧИНАЕТСЯ РАУНД ${currentRound}`);
            focusCameraOnTarget(player , false);
        }

        // ==========================================
        // 3. УПРАВЛЕНИЕ
        // ==========================================
        app.stage.eventMode = 'static';
        app.stage.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);
        
        // При клике на экран - прыгаем на следующий люк
        app.stage.on('pointerdown', () => {
            if (!isJumping && gameIsStarted) {
                // Если хочешь добавить звук прыжка:
                // playSound(jumpSound);
                jumpToNextLuk();
            }
        });


        /**
         * Спавнит поток машин на всех дорожках сзади курицы
         */
/**
         * Спавнит поток машин только на дорожках СПРАВА от курицы
         */
        function spawnTrafficJam() {
            // Начинаем цикл с ПЕРВОЙ СВОБОДНОЙ дорожки перед курицей
            // i = currentLukIndex + 1
            for (let i = currentLukIndex + 1; i < luksArray.length; i++) {
                const laneX = luksArray[i].x;
                
                // Пускаем поток машин (например, 3 машины на каждую свободную полосу)
                const carCount = 3;
                
                for (let j = 0; j < carCount; j++) {
                    // Рассчитываем задержку, чтобы машины ехали пачкой
                    const delay = j * 250 + (Math.random() * 150);
                    
                    setTimeout(() => {
                        // Если игрок уже телепортировался назад (resetRound), 
                        // прекращаем спавнить машины для старого этапа
                        if (currentLukIndex === -1) return;

                        const randomCarTex = carTextures[Math.floor(Math.random() * carTextures.length)];
                        const car = new PIXI.Sprite({ texture: randomCarTex });
                        car.anchor.set(0.5);
                        car.scale.set(0.75);
                        
                        const startCarY = -1500;
                        const targetCarY = 2000; 

                        car.position.set(laneX, startCarY);
                        // Добавляем в самый низ контейнера препятствий
                        obstaclesLayer.addChildAt(car, 0);

                        let driveProgress = 0;
                        const driveDuration = 0.5; // Скорость "пробки"

                        const driveTicker = (ticker) => {
                            if (car.destroyed) return app.ticker.remove(driveTicker);

                            driveProgress += ticker.deltaTime / (driveDuration * 60);

                            if (driveProgress >= 1) {
                                app.ticker.remove(driveTicker);
                                car.destroy();
                            } else {
                                // Линейное движение без торможения (пролетают мимо)
                                car.y = startCarY + (targetCarY - startCarY) * driveProgress;
                            }
                        };
                        app.ticker.add(driveTicker);
                    }, delay);
                }
            }
        }


        focusCameraOnTarget(player , false);


        // Камера: Если у тебя работает функция focusCameraOnTarget(player), 
        // камера будет автоматически плавно ехать за курицей и телепортироваться вместе с ней!

        
// ==========================================
        // 1. БЕСКОНЕЧНЫЙ ФОН (TILING SPRITE)
        // ==========================================
        // Вместо PIXI.Sprite используем PIXI.TilingSprite
        // Изначально задаем ему размер 100x100, в resize() мы растянем его на весь экран

 /**
     * Плавно добавляет сумму в плашку TOTAL WIN
     * @param {number} amountToAdd - Сколько добавить к текущей сумме
     */
    function addTotalWin(amountToAdd) {
        // Увеличиваем реальный баланс
        currentTotalWin += amountToAdd;
        
        // Стартовая точка для анимации
        const startValue = visualTotalWin;
        const targetValue = currentTotalWin;
        
        // Длительность анимации (например, 1 секунда)
        const durationSec = 1.0; 
        let timeElapsed = 0;

        // Останавливаем предыдущую анимацию, если она была
        if (totalWinText._moneyTicker) {
            app.ticker.remove(totalWinText._moneyTicker);
        }

        const ticker = (t) => {
            timeElapsed += t.deltaTime / 60;

            if (timeElapsed >= durationSec) {
                // ФИНАЛ АНИМАЦИИ
                visualTotalWin = targetValue;
                totalWinText.text = Math.floor(visualTotalWin).toLocaleString('ru-RU');
                totalWinGroup.scale.set(1.0); // Возвращаем базовый размер
                
                app.ticker.remove(ticker);
                totalWinText._moneyTicker = null;
            } else {
                // ПЛАВНЫЙ НАБОР ЦИФР (Cubic Ease Out)
                const progress = timeElapsed / durationSec;
                const easeOut = 1 - Math.pow(1 - progress, 3);
                
                visualTotalWin = startValue + (targetValue - startValue) * easeOut;
                totalWinText.text = Math.floor(visualTotalWin).toLocaleString('ru-RU');
                
                // ЛЕГКАЯ ПУЛЬСАЦИЯ ВСЕЙ ПЛАШКИ ВО ВРЕМЯ НАБОРА
                // 1.0 — это базовый scale (замени на свой, если в init ставил другой)
                totalWinGroup.scale.set(1.0 + Math.sin(progress * Math.PI) * 0.1);
            }
        };

        totalWinText._moneyTicker = ticker;
        app.ticker.add(ticker);
    }
/**
 * Показывает финальный экран SUPER WIN, а затем панель CONGRATULATIONS
 * @param {number} finalAmount - Итоговая сумма (например, 90000)
 */
function showSuperWinScreen(finalAmount) {
    uiOverlayContainer.sortableChildren = true;
    const superWinContainer = new PIXI.Container();
    superWinContainer.zIndex = 500; 
    uiOverlayContainer.addChild(superWinContainer);

    // ==========================================
    // 1. ТЕМНЫЙ ФОН И ДОЖДЬ ИЗ МОНЕТ (ДЛЯ ОБЕИХ ФАЗ)
    // ==========================================
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.85 });
    dimmer.eventMode = 'static';
    
    // Клик по диммеру ВСЕГДА ведет в стор
    dimmer.on('pointerdown', openStore); 
    superWinContainer.addChild(dimmer);

    const bgCoins = new PIXI.AnimatedSprite(animCoins.textures);
    bgCoins.animationSpeed = 0.2;
    bgCoins.anchor.set(0.5);
    bgCoins.play();
    const bgScale = Math.max(GAME_WIDTH / bgCoins.width, GAME_HEIGHT / bgCoins.height);
    bgCoins.scale.set(bgScale * 1.2); 
    bgCoins.alpha = 0.6; 
    superWinContainer.addChild(bgCoins);

    // ==========================================
    // 2. ФАЗА 1: КУРИЦА SUPER WIN
    // ==========================================
    const phase1Group = new PIXI.Container();
    superWinContainer.addChild(phase1Group);

    const glow = new PIXI.Graphics();
    glow.circle(0, 0, 300);
    glow.fill({ color: 0xffcc00, alpha: 0.4 });
    glow.filters = [new PIXI.BlurFilter(80)];
    glow.blendMode = 'add';
    phase1Group.addChild(glow);

    const superWinAnim = new PIXI.AnimatedSprite(animSuperWin.textures);
    superWinAnim.animationSpeed = 0.25;
    superWinAnim.anchor.set(0.5);
    superWinAnim.scale.set(2.5); 
    superWinAnim.play();
    phase1Group.addChild(superWinAnim);

    const amountStyle = new PIXI.TextStyle({ 
        fontFamily: 'softhyphen', fontSize: 100, fill: '#ffffff', 
        stroke: { color: '#000000', width: 8 }, dropShadow: { color: '#000000', alpha: 0.6, distance: 5 }, align: 'center'
    });
    
    const amountText = new PIXI.Text({ text: "€ 0", style: amountStyle });
    amountText.anchor.set(0.5);
    amountText.position.set(0, 320); // Подгони под табличку
    phase1Group.addChild(amountText);

    // ==========================================
    // 3. ФАЗА 2: ПАНЕЛЬ CONGRATULATIONS (Скрыта изначально)
    // ==========================================
    const phase2Group = new PIXI.Container();
    phase2Group.scale.set(0); // Прячем
    superWinContainer.addChild(phase2Group);

    // Серая плашка с желтой обводкой
    const panelBg = new PIXI.Graphics();
    panelBg.roundRect(-450, -350, 900, 700, 40);
    panelBg.fill({ color: '#3d3f42' }); // Темно-серый
    panelBg.stroke({ color: '#ffcc33', width: 12 }); // Желтая обводка
    phase2Group.addChild(panelBg);

    // Тексты панели
    const titleStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 70, fill: '#ffffff', align: 'center' });
    const winStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 80, fill: '#ffffff', align: 'center' });

    const titleText = new PIXI.Text({ text: getT('congratulations').toUpperCase() , style: titleStyle });
    titleText.anchor.set(0.5);
    titleText.position.set(0, -220);
    phase2Group.addChild(titleText);

    // "YOU WIN \n 90.000 EUR"
    // Заменяем пробел между цифрами на точку, как на скрине
    const winString = getT('you_won').toUpperCase() + "\n" + finalAmount.toLocaleString('de-DE') + " EUR"; 
    const winText = new PIXI.Text({ text: winString, style: winStyle });
    winText.anchor.set(0.5);
    winText.position.set(0, -40);
    phase2Group.addChild(winText);

    // Кнопка COLLECT WIN
    const btnGroup = new PIXI.Container();
    btnGroup.position.set(0, 200);
    btnGroup.eventMode = 'static';
    btnGroup.cursor = 'pointer';
    btnGroup.on('pointerdown', openStore); // Отправляем в стор
    phase2Group.addChild(btnGroup);

    const btnBg = new PIXI.Graphics();
    btnBg.roundRect(-250, -50, 500, 100, 20);
    btnBg.fill({ color: '#ffb74d' }); // Желто-оранжевая кнопка
    
    // Тень под кнопкой для объема
    const btnShadow = new PIXI.Graphics();
    btnShadow.roundRect(-250, -40, 500, 100, 20);
    btnShadow.fill({ color: '#c88c32' }); 
    btnGroup.addChild(btnShadow, btnBg);

    const btnText = new PIXI.Text({ 
        text: getT('collect_win').toUpperCase(), 
        style: { fontFamily: 'softhyphen', fontSize: 50, fill: '#2a2a2a', align: 'center' } 
    });
    btnBg.scale.set(1.2);
    btnShadow.scale.set(1.2);
    btnText.anchor.set(0.5);
    btnGroup.addChild(btnText);

    // ==========================================
    // 4. ТАЙМИНГИ И АНИМАЦИИ
    // ==========================================
    phase1Group.scale.set(0);
    let elapsed = 0;
    const countDuration = 2.0;  // Время накрутки цифр на курице
    const phase1EndTime = 4.0;  // Во сколько секунд курица улетает
    
    let currentDisplayCount = 0;
    let currentPhase = 1;

    const animTicker = (ticker) => {
        const dt = ticker.deltaTime / 60;
        elapsed += dt;
        
        // --- ЛОГИКА ФАЗЫ 1 (КУРИЦА) ---
        if (currentPhase === 1) {
            // Вылет курицы (пружинка)
            if (elapsed < 0.6) {
                const p = elapsed / 0.6;
                const ease = p < 1 ? p * p * (3 - 2 * p) * 1.15 : 1; 
                phase1Group.scale.set(ease * 1.0);
            } else {
                // Мягкое парение
                phase1Group.y = Math.sin(elapsed * 3) * 15;
                phase1Group.scale.set(1.0 + Math.sin(elapsed * 4) * 0.02);
            }

            // Набор счетчика
            if (elapsed > 0.5 && elapsed <= 0.5 + countDuration) {
                const p = (elapsed - 0.5) / countDuration;
                const easeOut = 1 - Math.pow(1 - p, 3);
                
                const newVal = Math.floor(finalAmount * easeOut);
                if (newVal !== currentDisplayCount) {
                    currentDisplayCount = newVal;
                    // Пишем через точку (Евро формат: 90.000)
                    amountText.text = `€ ${currentDisplayCount.toLocaleString('de-DE')}`;
                    amountText.scale.set(1.0 + Math.random() * 0.05);
                }
            } else if (elapsed > 0.5 + countDuration) {
                amountText.text = `€ ${finalAmount.toLocaleString('de-DE')}`;
                amountText.scale.set(1.0);
            }

            // ПРОВЕРКА НА ПЕРЕХОД К ФАЗЕ 2
            if (elapsed >= phase1EndTime) {
                currentPhase = 2; // Переключаем фазу
                elapsed = 0;      // Сбрасываем таймер для новой анимации
            }
        } 
        
        // --- ЛОГИКА ФАЗЫ 2 (ПАНЕЛЬ) ---
        else if (currentPhase === 2) {
            // Улет курицы вверх
            if (elapsed < 0.4) {
                const p = elapsed / 0.4;
                phase1Group.y = -(p * 1500); // Улетает вверх
                phase1Group.alpha = 1 - p;
            } else if (elapsed > 0.4 && elapsed < 0.9) {
                // Курица улетела, уничтожаем её для освобождения памяти
                if (!phase1Group.destroyed) phase1Group.destroy({ children: true });
                
                // Вылет панели CONGRATULATIONS пружинкой
                const p = (elapsed - 0.4) / 0.5;
                const ease = p < 1 ? p * p * (3 - 2 * p) * 1.1 : 1; 
                phase2Group.scale.set(ease * 1.0);
            } else if (elapsed >= 0.9) {
                // Пульсация кнопки COLLECT WIN (привлекаем внимание)
                btnGroup.scale.set(1.0 + Math.sin((elapsed - 0.9) * 6) * 0.05);
            }
        }

        // Вращение свечения (если курица еще жива)
        if (!glow.destroyed) glow.rotation += 0.5 * dt;
    };
    
    app.ticker.add(animTicker);
}       /**
 /**
 * Показывает экран выигрыша фриспинов
/**
 * Показывает экран выигрыша фриспинов
 * @param {number} count - Количество фриспинов
 * @param {Function} onComplete - Колбэк при закрытии
 */
function showFreeGamesReward(count, onComplete) {
    uiOverlayContainer.sortableChildren = true;
    const rewardContainer = new PIXI.Container();
    rewardContainer.zIndex = 400; 
    playSound(free);
    
    // === ГАРАНТИЯ КЛИКА ===
    // Делаем кликабельным ВЕСЬ контейнер окна, а не только фон
    rewardContainer.eventMode = 'static';
    rewardContainer.cursor = 'pointer';
    rewardContainer.hitArea = new PIXI.Rectangle(-5000, -5000, 10000, 10000);
    
    uiOverlayContainer.addChild(rewardContainer);

    // 1. ТЕМНЫЙ ФОН (ДИММЕР)
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.8 });
    rewardContainer.addChild(dimmer);

    // 2. АНИМИРОВАННЫЙ ФОН (Дождь из монет)
    const bgCoins = new PIXI.AnimatedSprite(animCoins.textures);
    bgCoins.animationSpeed = 0.2;
    bgCoins.anchor.set(0.5);
    bgCoins.zIndex = 100;
    bgCoins.play();
    
    const bgScale = Math.max(GAME_WIDTH / bgCoins.width, GAME_HEIGHT / bgCoins.height);
    bgCoins.scale.set(bgScale * 1.2); 
    bgCoins.alpha = 1; 
    rewardContainer.addChild(bgCoins);

    // 3. ЦЕНТРАЛЬНАЯ ГРУППА
    const mainGroup = new PIXI.Container();
    rewardContainer.addChild(mainGroup);

    // --- СВЕЧЕНИЕ (ЛУЧИ) ---
    const glow = new PIXI.Graphics();
    glow.circle(0, 0, 250);
    glow.fill({ color: 0xffcc00, alpha: 0.3 });
    glow.filters = [new PIXI.BlurFilter(60)];
    mainGroup.addChild(glow);

    // --- ЦЕНТРАЛЬНЫЙ АССЕТ: МОНЕТА С КРЫЛЬЯМИ ---
    const wingedCoin = new PIXI.AnimatedSprite(animFlyCoin.textures);
    wingedCoin.animationSpeed = 0.2;
    wingedCoin.anchor.set(0.5);
    wingedCoin.scale.set(3.8); 
    wingedCoin.play();
    mainGroup.addChild(wingedCoin);

    // --- ТЕКСТЫ ---
    const styleWin = new PIXI.TextStyle({ 
        fontFamily: 'softhyphen', fontSize: 60, fill: '#ffffff', 
        stroke: { color: '#000000', width: 6 } 
    });
    
    const styleCount = new PIXI.TextStyle({ 
        fontFamily: 'softhyphen', fontSize: 260, fill: '#ffffff', 
        stroke: { color: '#000000', width: 10 } 
    });
    
    const styleFree = new PIXI.TextStyle({ 
        fontFamily: 'softhyphen', fontSize: 90, fill: '#ffcc00', 
        stroke: { color: '#000000', width: 12 },
        dropShadow: { color: '#000000', alpha: 0.5, distance: 8, blur: 0 }
    });

    const topText = new PIXI.Text({ text: getT('you_won'), style: styleWin });
    topText.anchor.set(0.5);
    topText.position.set(0, -340);
    mainGroup.addChild(topText);

    // СТАРТУЕМ С ЦИФРЫ 1
    const countText = new PIXI.Text({ text: "1", style: styleCount });
    countText.anchor.set(0.5);
    countText.position.set(0, -10); 
    mainGroup.addChild(countText);

    const bottomText = new PIXI.Text({ text: getT('free_games'), style: styleFree });
    bottomText.anchor.set(0.5);
    bottomText.position.set(0, 400);
    mainGroup.addChild(bottomText);

    const continueText = new PIXI.Text({ 
        text: getT('press_anywhere').toUpperCase(), 
        style: { fontFamily: 'softhyphen', fontSize: 40, fill: '#ffffff', fontWeight: 'bold' } 
    });
    continueText.anchor.set(0.5);
    continueText.position.set(0, 750);
    rewardContainer.addChild(continueText);

    // --- АНИМАЦИИ ---
    mainGroup.scale.set(0);
    let elapsed = 0;
    let currentDisplayCount = 1; // Текущая цифра на экране
    
    const animTicker = (ticker) => {
        const dt = ticker.deltaTime / 60;
        elapsed += dt;
        
        // 1. Появление группы (без дальнейшего дыхания)
        if (elapsed < 0.5) {
            const p = elapsed / 0.5;
            const ease = 1 - Math.pow(1 - p, 3);
            mainGroup.scale.set(ease * 1.1);
        } else {
            // Фиксируем масштаб жестко
            mainGroup.scale.set(1.1);
        }

        // 2. АНИМАЦИЯ СЧЕТЧИКА (от 1 до count)
        // Начинает считать после 0.5 сек (когда группа уже вылетела)
        if (elapsed > 0.5 && currentDisplayCount < count) {
            // Счет идет 1 секунду
            let countProgress = (elapsed - 0.5) / 1.0;
            if (countProgress > 1) countProgress = 1;
            
            // Вычисляем новое значение
            let newVal = Math.floor(1 + (count - 1) * countProgress);
            
            if (newVal !== currentDisplayCount) {
                currentDisplayCount = newVal;
                countText.text = currentDisplayCount.toString();
                // Эффект "удара" при смене цифры
                countText.scale.set(1.3);
                
                // Если есть звук тиканья, можно раскомментировать:
                // playSound(tickSound, 0.2);
            }
        }

        // Плавное возвращение масштаба цифры в норму (1.0) после "удара"
        if (countText.scale.x > 1.0) {
            countText.scale.set(Math.max(1.0, countText.scale.x - dt * 2));
        }

        // Вращение свечения на фоне остается
        glow.rotation += 0.5 * dt;

        // Мигание текста "Нажмите чтобы продолжить"
        continueText.alpha = 0.4 + Math.abs(Math.sin(elapsed * 3)) * 0.6;
    };
    app.ticker.add(animTicker);

    // --- ЛОГИКА ЗАКРЫТИЯ (Клик по всему окну) ---
    let isClosing = false;
    rewardContainer.on('pointerdown', () => {
        if (isClosing) return;
        
        // ФИЧА: Если счетчик еще не дошел до конца, первый клик просто пропускает анимацию
        if (currentDisplayCount < count) {
            currentDisplayCount = count;
            countText.text = count.toString();
            countText.scale.set(1.0);
            return; 
        }

        isClosing = true;
        app.ticker.remove(animTicker);
        
        // Анимация ухода
        let fade = 0;
        const closeTicker = (t) => {
            fade += t.deltaTime / (0.3 * 60);
            if (fade >= 1) {
                app.ticker.remove(closeTicker);
                rewardContainer.destroy({ children: true });
                if (onComplete) onComplete();
            } else {
                rewardContainer.alpha = 1 - fade;
                mainGroup.scale.set(1.1 * (1 + fade)); // Улетает в камеру
            }
        };
        app.ticker.add(closeTicker);
    });
}

        // ==========================================
// СТАРТОВЫЙ ЭКРАН (КАРУСЕЛЬ КАРТОЧЕК)
// ==========================================
function showChickenSelection(onSelect) {
    // Включаем сортировку слоев
    uiOverlayContainer.sortableChildren = true;

    const popupContainer = new PIXI.Container();
    popupContainer.zIndex = 200; // Поверх всего
    uiOverlayContainer.addChild(popupContainer);

    // 1. ЗАТЕМНЕНИЕ ФОНА
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.8 });
    dimmer.eventMode = 'static'; // Блокируем клики по игре на фоне
    popupContainer.addChild(dimmer);

    // 2. ДАННЫЕ ДЛЯ КАРТОЧЕК
    const cardsData = [
        { id: 'common',    tex: commonTex,    title: 'EASY',     multiplier: '10 000',  spins: 15, vol: 'LOW',       buy: '250'  },
        { id: 'rare',      tex: rareTex,      title: 'NORMAL',   multiplier: '50 000',  spins: 10, vol: 'MEDIUM',    buy: '500'  },
        { id: 'epic',      tex: epicTex,      title: 'HARD',     multiplier: '240 000', spins: 5,  vol: 'HIGH',      buy: '1000' },
        { id: 'legendary', tex: legendaryTex, title: 'HARDCORE', multiplier: '1 000 000', spins: 3, vol: 'VERY HIGH', buy: '5000' }
    ];

    // Группа для всех карточек (её мы будем двигать)
    const carouselGroup = new PIXI.Container();
    popupContainer.addChild(carouselGroup);

    const CARD_WIDTH = 600;  // Визуальная ширина карточки (настрой под свои ассеты)
    const CARD_GAP = 450;     // Расстояние между карточками
    const SPACING = CARD_WIDTH + CARD_GAP; // Шаг между центрами карточек

    const NewStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 115, fill: '#ffea00', stroke: { color: '#000000', width: 8 }, dropShadow: { color: '#000000', alpha: 0.5, distance: 5 }, align: 'center' });

    const title = new PIXI.Text({ text: getT('buy_bonus').toUpperCase(), style: NewStyle });
    title.anchor.set(0.5);
    title.position.set(0, -700); // Настрой высоту под свой ассет
    popupContainer.addChild(title);

    // Общие стили текста
    const titleStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 105, fill: '#ffffff', stroke: { color: '#000000', width: 0 }, dropShadow: { color: '#000000', alpha: 0.2, distance: 15 }, align: 'center' });
    const multStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 65, fill: '#ffea00', stroke: { color: '#000000', width: 8 }, dropShadow: { color: '#000000', alpha: 0.5, distance: 5 }, align: 'center' });
    const spinsStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 60, fill: '#ffffff', stroke: { color: '#000000', width: 6 }, align: 'center' });
    const volStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 40, fontWeight: 'bold', fill: '#ffffff', align: 'center' });
    const btnStyle = new PIXI.TextStyle({ fontFamily: 'softhyphen', fontSize: 75, fill: '#ffffff', stroke: { color: '#006600', width: 6 }, dropShadow: { color: '#000000', alpha: 0.5, distance: 3 }, align: 'center' });

    const cards = [];

    // 3. СОЗДАЕМ КАРТОЧКИ
    cardsData.forEach((data, index) => {
        const cardGroup = new PIXI.Container();
        
        // Расставляем их в ряд слева направо (индекс 0, 1, 2, 3)
        // Все они изначально выстраиваются относительно нуля
        cardGroup.x = index * SPACING;
        carouselGroup.addChild(cardGroup);
        cards.push(cardGroup);

        // Сама картинка карточки
        const bg = new PIXI.Sprite({ texture: data.tex });
        bg.anchor.set(0.5);
        bg.scale.set(1.2);
        // Подгоняем размер. Если твои картинки огромные, используй scale (например, 0.8)
        // bg.scale.set(0.8); 
        cardGroup.addChild(bg);

        // --- ТЕКСТЫ ---
        // 1. Заголовок (HARDCORE)
        const titleText = new PIXI.Text({ text: data.title, style: titleStyle });
        titleText.anchor.set(0.5);
        titleText.position.set(0, -420); // Настрой высоту под свой ассет
        cardGroup.addChild(titleText);


// ==========================================
        // 3. ФРИСПИНЫ (FREE [число] SPIN)
        // Разный стиль для числа и текста
        // ==========================================
        
        // Контейнер, который объединит эти 3 слова
        const spinsGroup = new PIXI.Container();
        spinsGroup.position.set(0, 210);
        cardGroup.addChild(spinsGroup);

        // 1. Стиль для слов "FREE" и "SPIN" (Белый, обычный размер)
        const textWordStyle = new PIXI.TextStyle({ 
            fontFamily: 'softhyphen', 
            fontSize: 90, // Меньше, чем цифра
            fill: '#ffffff', 
            dropShadow: { color: '#000000', alpha: 0.2, distance: 15 }, 
            align: 'center'
            //stroke: { color: '#000000', width: 6 } 
        });

        // 2. Стиль для самой ЦИФРЫ (Желтый, крупный)
        const numberStyle = new PIXI.TextStyle({ 
            fontFamily: 'softhyphen', 
            fontSize: 160, // Огромная цифра
            fill: '#fff133', // Ярко-желтый
            dropShadow: { color: '#000000', alpha: 0.2, distance: 15 }, 
            align: 'center'
        });

        // Создаем 3 элемента
        const wordFree = new PIXI.Text({ text: "FREE", style: textWordStyle });
        const numSpins = new PIXI.Text({ text: data.spins.toString(), style: numberStyle });
        const wordSpin = new PIXI.Text({ text: "SPIN", style: textWordStyle });

        // Якоря ставим по левому краю (0) для удобного выстраивания в линию
        // По Y якорь ставим на 0.5, чтобы они были выровнены по центру друг относительно друга
        wordFree.anchor.set(0, 0.5);
        numSpins.anchor.set(0, 0.5);
        wordSpin.anchor.set(0, 0.5);

        // Расставляем их друг за другом с небольшим отступом (10px)
        wordFree.x = 0;
        numSpins.x = wordFree.x + wordFree.width + 10;
        wordSpin.x = numSpins.x + numSpins.width + 10;

        // Добавляем в группу
        spinsGroup.addChild(wordFree, numSpins, wordSpin);

        // МАГИЯ ЦЕНТРОВКИ: сдвигаем всю группу назад на половину её общей ширины,
        // чтобы вся фраза "FREE X SPIN" встала ровно по центру карточки
        spinsGroup.x = -spinsGroup.width / 2;

        // 4. Волатильность (VOLATILITY: VERY HIGH)
        const volText = new PIXI.Text({ text: `VOLATILITY: ${data.vol}`, style: volStyle });
        volText.anchor.set(0.5);
        volText.position.set(0, 320);
        cardGroup.addChild(volText);

        // 5. Кнопка BUY (BUY € 5000)
        // Предполагается, что зеленая кнопка уже нарисована на ассете, мы просто пишем на ней текст
        const buyText = new PIXI.Text({text: getT('buy').toUpperCase() + " €" + `${data.buy}` , style: btnStyle});
        buyText.anchor.set(0.5);
        buyText.position.set(0, 430); // Центр зеленой кнопки внизу
        cardGroup.addChild(buyText);

        // ==========================================
        // ЛОГИКА КЛИКА (Только для Легендарной карточки)
        // ==========================================
        if (data.id === 'legendary') {
            cardGroup.eventMode = 'static';
            cardGroup.cursor = 'pointer';
            
            cardGroup.once('pointerdown', () => {
                app.ticker.remove(carouselTicker);

                animTape.play();
                tapeClone1.play();
                tapeClone2.play();
                playSound(trans);

                setTimeout(()=>{
                    nightStart.visible = true;
                } , 500);

                
                // Красивое исчезновение всего окна
                let fade = 0;
                const closeTicker = (ticker) => {
                    fade += ticker.deltaTime / (0.3 * 60);
                    if (fade >= 1) {
                        app.ticker.remove(closeTicker);
                        popupContainer.destroy();
                        if (onSelect) onSelect(); // Вызываем старт игры!
                    } else {
                        popupContainer.alpha = 1 - fade;
                        // Карточка, на которую нажали, слегка увеличивается перед стартом
                        cardGroup.scale.set(1 + fade * 0.2); 
                    }
                };
                app.ticker.add(closeTicker);
            });
        }
    });

    // ==========================================
    // 4. АНИМАЦИЯ КАМЕРЫ (ПРОКРУТКА)
    // ==========================================
    // Изначально карусель сдвинута далеко вправо (за край экрана)
    const startX = window.innerWidth; 
    
    // Целевая позиция: мы хотим, чтобы последняя (индекс 3) карточка оказалась ровно по центру (0)
    // Значит, мы должны сдвинуть всю карусель влево на расстояние (3 * SPACING)
    const targetIndex = 3; 
    const targetX = -(targetIndex * SPACING);

    carouselGroup.x = startX;

    let time = 0;
    const scrollDuration = 2.5; // Время прокрутки (1.5 секунды)

    const carouselTicker = (ticker) => {
        time += ticker.deltaTime / 60;

        if (time < scrollDuration) {
            const p = time / scrollDuration;
            // Используем Cubic Ease-Out (быстрый старт, плавное торможение в конце)
            const ease = 1 - Math.pow(1 - p, 3);
            
            // Двигаем карусель
            carouselGroup.x = startX + (targetX - startX) * ease;

            // --- БОНУС: ПАРАЛЛАКС И ЭФФЕКТ ФОКУСА ---
            // Делаем так, чтобы карточки, которые не в центре, были чуть меньше и темнее

        } else {
            carouselGroup.x = targetX;
            // Когда легендарная карточка в центре, она начинает "дышать" (ожидая клика)
            cards[targetIndex].scale.set(1.0 + Math.sin(time * 5) * 0.02);
            cards[targetIndex].alpha = 1.0;
        }
    };
    app.ticker.add(carouselTicker);
}

        
    


        function swapButtons(fromBtn, toBtn, targetScale, duration = 0.4) {
            // Готовим входящую кнопку
            toBtn.alpha = 0;
            toBtn.scale.set(0);
            toBtn.visible = true;
            toBtn.eventMode = 'none';

            let time = 0;
            const startScale = fromBtn.scale.x;

            const ticker = (t) => {
                time += t.deltaTime / (duration * 60);
                const p = Math.min(time, 1);
                // Ease out cubic
                const ease = 1 - Math.pow(1 - p, 3);

                // Уходящая кнопка — тает и сжимается
                fromBtn.alpha = 1 - ease;
                fromBtn.scale.set(startScale * (1 - ease * 0.3));

                // Входящая кнопка — появляется и вырастает
                toBtn.alpha = ease;
                toBtn.scale.set(targetScale * ease);

                if (p >= 1) {
                    app.ticker.remove(ticker);
                    fromBtn.visible = false;
                    fromBtn.eventMode = 'none';
                    fromBtn.alpha = 1;
                    fromBtn.scale.set(startScale);
                    toBtn.alpha = 1;
                    toBtn.scale.set(targetScale);
                    toBtn.eventMode = 'static';
                }
            };

            app.ticker.add(ticker);
}


        /**
         * Спавнит одноразовую анимацию (взрыв или эффект сбора) в заданных координатах
         * @param {PIXI.AnimatedSprite} sourceAnim - Оригинальная анимация (animBoom или animEffect)
         * @param {number} x - Координата X
         * @param {number} y - Координата Y
         * @param {number} scale - Масштаб эффекта
         */
        function spawnOneShotAnimation(sourceAnim, x, y, scale = 1.0) {
            if (!sourceAnim || !sourceAnim.textures) return;

            // 1. Создаем КОПИЮ анимации, используя уже загруженные в память кадры!
            // Это работает мгновенно и не жрет оперативную память.
            const fx = new PIXI.AnimatedSprite(sourceAnim.textures);
            
            fx.anchor.set(0.5);
            fx.position.set(x, y);
            fx.scale.set(0.1);
            
            fx.animationSpeed = sourceAnim.animationSpeed || 0.4;
            fx.loop = false; // Обязательно выключаем зацикливание
            
            // Если это взрыв, можно сделать его ярким (опционально)
            // fx.blendMode = 'add'; 

            // 2. Добавляем поверх всего (в fxLayer или gameContainer)
            // Если у тебя настроена сортировка (sortableChildren), ставим высокий zIndex
            fx.zIndex = 100;
            gameContainer.addChild(fx);

            // 3. Запускаем анимацию с первого кадра
            fx.gotoAndPlay(0);

            // 4. УДАЛЯЕМ МУСОР ПОСЛЕ ПРОИГРЫВАНИЯ
            fx.onComplete = () => {
                fx.destroy(); // Полностью очищаем память
            };
        }



        // ==========================================
        // УТИЛИТЫ АНИМАЦИИ
        // ==========================================

        /**
         * Перемещает объект за durationSeconds с линейной интерполяцией.
         * Возвращает Promise — можно await-ить.
         */
        function moveToLinear(object, targetX, targetY, durationSeconds, onComplete) {
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
                    object.position.x = startX + (targetX - startX) * progress;
                    object.position.y = startY + (targetY - startY) * progress;
                }
            };
            app.ticker.add(object._moveTicker);
        }

        /**
         * Прыжок по параболе (X меняется равномерно, Y — дуга).
         * Возвращает Promise — можно await-ить.
         * @param {number} jumpHeight — высота дуги в пикселях
         */
        function jumpToX(object, targetX, jumpHeight, durationSeconds, onComplete) {
            if (object._jumpTicker) app.ticker.remove(object._jumpTicker);
            const startX = object.position.x;
            const startY = object.position.y;
            let progress = 0;

            const jumpTicker = (ticker) => {
                if (object.destroyed) { app.ticker.remove(jumpTicker); return; }
                progress += ticker.deltaTime / (durationSeconds * 60);
                if (progress >= 1) {
                    object.position.set(targetX, startY);
                    app.ticker.remove(jumpTicker);
                    object._jumpTicker = null;
                    if (onComplete) onComplete();
                } else {
                    const parabola = 4 * progress * (1 - progress);
                    object.position.set(
                        startX + (targetX - startX) * progress,
                        startY - jumpHeight * parabola
                    );
                }
            };
            object._jumpTicker = jumpTicker;
            app.ticker.add(jumpTicker);
        }

        /**
 * Умная камера: фокусируется на любом объекте (самолет, курица и т.д.)
 * @param {PIXI.DisplayObject} targetObject - За кем следим (например, plane)
 * @param {boolean} instant - Мгновенно или плавно
 * @param {number|null} predictedX - Будущая координата X (для опережения)
 */
/**
 * Умная камера: следует за самолетом по X, но по Y всегда остается в центре (0)
 */
function focusCameraOnTarget(targetObject, instant = true, predictedX = null) {
    if (!targetObject) return;

    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const isPortrait = sw < sh;

    // В портрете отдаляем камеру (0.9), чтобы влезло больше пути.
    // В ландшафте приближаем (1.3), чтобы обрезать пустое небо и землю.
    const targetZoom = isPortrait ? 1 : 1; 
    
    // Смещение: самолет должен быть слева от центра экрана на 300px
    const cameraOffsetX = -400; 
    
    let targetX = (predictedX !== null ? predictedX : targetObject.x) - cameraOffsetX; 
    
    // ВАЖНО: Всегда держим камеру по центру оси Y! 
    
    let targetY = isPortrait ? 300 : 0; 

    // --- ЗАЩИТА ОТ КРАЕВ ФОНА ---
    if (typeof backgroundFirstSprite !== 'undefined') {
        const finalScale = Math.min(sw / GAME_WIDTH, sh / GAME_HEIGHT) * targetZoom;
        const halfScreenWidthInWorld = (sw / 2) / finalScale;

        // Края составного фона
        const bgLeftEdge = -2000;
        const bgRightEdge = 3000;

        if (targetX - halfScreenWidthInWorld < bgLeftEdge) {
            targetX = bgLeftEdge + halfScreenWidthInWorld;
        }
        if (targetX + halfScreenWidthInWorld > bgRightEdge) {
            targetX = bgRightEdge - halfScreenWidthInWorld;
        }
    }

    // Применяем
    if (instant) {
        cameraX = targetX;
        cameraY = targetY; // Всегда 0
        cameraZoom = targetZoom;
        resize(); 
    } else {
        animateCamera(targetX, targetY, targetZoom, 0.5); 
    }
}

        /**
         * Плавно перемещает камеру в точку (targetX, targetY) с нужным зумом.
         */
        function animateCamera(targetX, targetY, targetZoom, durationSeconds, onComplete) {
            if (currentCameraTicker) app.ticker.remove(currentCameraTicker);
            const startX = cameraX, startY = cameraY, startZoom = cameraZoom;
            let progress = 0;

            currentCameraTicker = (ticker) => {
                progress += ticker.deltaTime / (durationSeconds * 60);
                if (progress >= 1) {
                    cameraX = targetX; cameraY = targetY; cameraZoom = targetZoom;
                    app.ticker.remove(currentCameraTicker);
                    currentCameraTicker = null;
                    resize();
                    if (onComplete) onComplete();
                } else {
                    const ease = 1 - Math.pow(1 - progress, 3);
                    cameraX    = startX    + (targetX    - startX)    * ease;
                    cameraY    = startY    + (targetY    - startY)    * ease;
                    cameraZoom = startZoom + (targetZoom - startZoom) * ease;
                    resize();
                }
            };
            app.ticker.add(currentCameraTicker);
        }

        /**
         * Promise-обёртки для использования с await
         */
        const moveAsync  = (obj, x, y, t) => new Promise(res => moveToLinear(obj, x, y, t, res));
        const jumpAsync  = (obj, x, h, t) => new Promise(res => jumpToX(obj, x, h, t, res));
        const flashAsync = (tIn, tOut)     => new Promise(res => flashTransition(res, tIn, tOut));
        const blurAsync  = (tIn, tOut, b)  => new Promise(res => blurTransition(res, tIn, tOut, b));
        const wait       = (ms)            => new Promise(res => setTimeout(res, ms));

// ==========================================
// ИГРОВОЙ ЦИКЛ FLAPPY BIRD
// ==========================================
// ==========================================
// ИГРОВОЙ ЦИКЛ FLAPPY BIRD
// ==========================================


// ==========================================
// ЛОГИКА СБОРА БОНУСОВ И ШТРАФОВ



        /**
         * Вспышка экрана (белый flash).
         * @param {Function} onPeak  — вызывается на пике (смена сцены)
         * @param {number}   durationIn
         * @param {number}   durationOut
         * @param {number}   holdMs   — задержка на пике (мс)
         */
        function flashTransition(onPeak, durationIn = 0.15, durationOut = 1.0, holdMs = 200) {
            const flash = new PIXI.Graphics();
            flash.rect(-5000, -5000, 10000, 10000);
            flash.fill(0xFFFFFF);
            flash.alpha = 0;
            flash.eventMode = 'static';
            app.stage.addChild(flash);

            let time = 0;
            let phase = 'in';

            const ticker = (t) => {
                time += t.deltaTime / 60;
                if (phase === 'in') {
                    const p = Math.min(time / durationIn, 1);
                    flash.alpha = p;
                    if (p >= 1) {
                        phase = 'hold';
                        time  = 0;
                        if (onPeak) onPeak();
                        setTimeout(() => { phase = 'out'; time = 0; }, holdMs);
                    }
                } else if (phase === 'out') {
                    const ease = 1 - Math.pow(1 - Math.min(time / durationOut, 1), 3);
                    flash.alpha = 1 - ease;
                    if (time >= durationOut) {
                        app.ticker.remove(ticker);
                        flash.destroy();
                    }
                }
            };
            app.ticker.add(ticker);
        }

        /**
         * Размытие экрана (blur transition).
         * @param {Function} onPeak  — вызывается на пике максимального размытия
         * @param {number}   durationIn
         * @param {number}   durationOut
         * @param {number}   maxBlur
         */
        function blurTransition(onPeak, durationIn = 0.3, durationOut = 0.5, maxBlur = 30) {
            const blurFilter = new PIXI.BlurFilter({ quality: 4 });
            blurFilter.strength = 0;
            app.stage.filters = [...(app.stage.filters || []), blurFilter];

            const blocker = new PIXI.Graphics();
            blocker.rect(-5000, -5000, 10000, 10000);
            blocker.fill({ color: 0x000000, alpha: 0.001 });
            blocker.eventMode = 'static';
            app.stage.addChild(blocker);

            let time = 0;
            let phase = 'in';

            const ticker = (t) => {
                time += t.deltaTime / 60;
                if (phase === 'in') {
                    const p = Math.min(time / durationIn, 1);
                    blurFilter.strength = maxBlur * (p * p);
                    if (p >= 1) { phase = 'out'; time = 0; if (onPeak) onPeak(); }
                } else {
                    const ease = 1 - Math.pow(1 - Math.min(time / durationOut, 1), 3);
                    blurFilter.strength = maxBlur * (1 - ease);
                    if (time >= durationOut) {
                        app.ticker.remove(ticker);
                        blocker.destroy();
                        app.stage.filters = (app.stage.filters || []).filter(f => f !== blurFilter);
                        if (!app.stage.filters.length) app.stage.filters = null;
                    }
                }
            };
            app.ticker.add(ticker);
        }


        /**
 * Показывает плашку победы (Стиль "Gran Victoria")
 * @param {number} winAmount - Сумма выигрыша
 */
// Добавили 2 параметра: 
// showButton (показывать ли кнопку Cash Out) 
// autoCloseMs (через сколько миллисекунд закрыть. 0 = висит бесконечно)
// Добавили skipAnimation = false по умолчанию

// Добавили skipAnimation = false по умолчанию
function showWinPlaque(winAmount, showButton = false, autoCloseMs = 0, skipAnimation = false) {
    return new Promise((resolve) => {
        uiOverlayContainer.sortableChildren = true;

        const popupContainer = new PIXI.Container();
        popupContainer.zIndex = 50; 
        uiOverlayContainer.addChild(popupContainer);

        // ==========================================
        // 1. ДИММЕР
        // ==========================================
        const dimmer = new PIXI.Graphics();
        dimmer.rect(-5000, -5000, 10000, 10000); 
        dimmer.fill({ color: 0x000000, alpha: 0.75 }); 
        dimmer.eventMode = 'static'; 
        
        if (showButton) {
            dimmer.cursor = 'pointer'; 
            dimmer.on('pointerdown', openStore); 
        }
        
        // ЕСЛИ АНИМАЦИЯ ПРОПУЩЕНА — мгновенно показываем фон
        if (skipAnimation) {
            dimmer.alpha = 1;
        } else {
            playSound(win); // Звук победы играем только в первый раз
        }
        
        popupContainer.addChild(dimmer);

        // ==========================================
        // 2. ГРАФИКА
        // ==========================================
        const plaqueGroup = new PIXI.Container();
        popupContainer.addChild(plaqueGroup);

        const glow = new PIXI.Graphics();
        glow.circle(0, 0, 280);
        glow.fill({ color: 0xffdd00, alpha: 0.3 }); 
        const glowFilter = new PIXI.BlurFilter({ strength: 30, quality: 4 });
        glow.filters = [glowFilter];
        glow.blendMode = 'add'; 
        plaqueGroup.addChild(glow);

        const textGradient = new PIXI.FillGradient(0, 0, 0, 100);
        textGradient.addColorStop(0, '#ff6600'); 
        textGradient.addColorStop(1, '#ffcc00'); 

        const titleStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen', 
            fontSize: 140, 
            fontWeight: '900', 
            fill: textGradient,
            stroke: { color: '#ffffff', width: 12 }, 
            dropShadow: { color: '#000000', alpha: 0.6, distance: 8, blur: 5 }, 
            align: 'center',
            lineHeight: 120, 
            wordWrap: true,
            wordWrapWidth: 800 
        });

        const title = new PIXI.Text({ text: getT("big_win").toUpperCase(), style: titleStyle });
        title.anchor.set(0.5);
        title.position.set(0, -100); 
        plaqueGroup.addChild(title);

        const balanceStyle = new PIXI.TextStyle({
            fontFamily: 'Inter',
            fontSize: 160, 
            fontWeight: '900',
            fill: textGradient, 
            stroke: { color: '#ffffff', width: 14 }, 
            dropShadow: { color: '#000000', alpha: 0.6, distance: 10, blur: 5 }, 
        });

        const cashStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen',
            fontSize: 160, 
            fontWeight: '900',
            fill: '#ffffff', 
            stroke: { color: '#000000', width: 14 }, 
            dropShadow: { color: '#000000', alpha: 0.6, distance: 10, blur: 5 }, 
        });

        // Если анимация пропускается, сразу пишем полную сумму
        const initialText = skipAnimation ? (winAmount.toLocaleString('ru-RU') + " €") : "0 €";
        const balanceText = new PIXI.Text({ text: initialText, style: balanceStyle });
        balanceText.anchor.set(0.5);
        balanceText.position.set(0, 100); 
        plaqueGroup.addChild(balanceText);
        // ==========================================
        // 3. КНОПКА CTA 
        // ==========================================
        const ctaButton = new PIXI.Sprite({ texture: endButtonTex });
        if (showButton) {
            ctaButton.anchor.set(0.5);
            ctaButton.position.set(0, 280); // Подняли поближе (было 320)
            ctaButton.scale.set(0.4); 
            ctaButton.eventMode = "static";
            ctaButton.cursor = "pointer";
            
            // Если анимация пропущена, кнопка сразу видима на 100%
            ctaButton.alpha = skipAnimation ? 1 : 0; 
            
            ctaButton.on('pointerdown', openStore);
            plaqueGroup.addChild(ctaButton);
        }

        const cashText = new PIXI.Text({ text: getT("install"), style: cashStyle });
        cashText.anchor.set(0.5);
        cashText.scale.set(0.86);
        cashText.position.set(0, 0); 
        ctaButton.addChild(cashText);


        plaqueGroup.y = showButton ? -80 : 0;

        // ==========================================
        // 4. АДАПТИВ 
        // ==========================================
        let plaqueScale = 1.0; 
        const onPlaqueResize = () => {
            const sw = window.innerWidth;
            const targetWidth = sw * 0.95;
            const globalUiScale = uiOverlayContainer.scale.x || 1;
            plaqueScale = Math.min(1.2, (targetWidth / 800) / globalUiScale); 
            
            // Если пропускаем анимацию, сразу ставим правильный масштаб
            if (skipAnimation) {
                plaqueGroup.scale.set(plaqueScale);
            } else if (!plaqueGroup.isAnimating) {
                plaqueGroup.scale.set(plaqueScale);
            }
        };
        window.addEventListener('resize', onPlaqueResize);
        onPlaqueResize(); 

        // ==========================================
        // 5. АНИМАЦИИ (Выполняется только если !skipAnimation)
        // ==========================================
        let time = skipAnimation ? 1.5 : 0; // Если пропуск, перематываем время сразу в конец
        let currentBalanceLocal = 0;
        const duration = 1.5; 

        if (!skipAnimation) {
            plaqueGroup.scale.set(0); 
        }

        const animTicker = (ticker) => {
            const dt = ticker.deltaTime / 60;
            time += dt;

            // --- БЛОК АНИМАЦИИ ВЫЛЕТА (Пропускается, если skipAnimation=true) ---
            if (!skipAnimation) {
                plaqueGroup.isAnimating = true; 
                
                if (time < 0.5) {
                    const t = time / 0.5;
                    const ease = 1 - Math.pow(1 - t, 3);
                    plaqueGroup.scale.set(plaqueScale * (ease * 1.15)); 
                } else if (time < 0.7) {
                    const t = (time - 0.5) / 0.2;
                    plaqueGroup.scale.set(plaqueScale * (1.15 - (0.15 * t))); 
                } else {
                    plaqueGroup.isAnimating = false; 
                }

                // Анимация цифр
                if (time < duration) {
                    const t = time / duration;
                    const easeOut = 1 - Math.pow(1 - t, 3);
                    currentBalanceLocal = Math.floor(winAmount * easeOut);
                    balanceText.text = currentBalanceLocal.toLocaleString('ru-RU') + " €";
                }
            }

            // --- БЛОК БЕСКОНЕЧНОЙ АНИМАЦИИ ПОСЛЕ ОСТАНОВКИ ЦИФР ---
            if (time >= duration) {
                if (!skipAnimation) {
                    balanceText.text = winAmount.toLocaleString('ru-RU') + " €";
                }
                
                plaqueGroup.isAnimating = true; 
                
                // Легкое дыхание всей плашки и свечения
                plaqueGroup.scale.set(plaqueScale * (1 + Math.sin((time - duration) * 8) * 0.02)); 
                glow.scale.set(1.0 + Math.sin(time * 5) * 0.1); 
                
                // Плавное появление кнопки (если она есть и еще невидима)
                if (showButton && ctaButton.alpha < 1) {
                    ctaButton.alpha += 0.05;
                }
            }
        };
        app.ticker.add(animTicker);

        // ==========================================
        // 6. ЛОГИКА АВТО-ЗАКРЫТИЯ
        // ==========================================
        const closePlaque = () => {
            if (!popupContainer || popupContainer.destroyed) return;
            window.removeEventListener('resize', onPlaqueResize); 
            app.ticker.remove(animTicker);
            
            // Если включен skipAnimation, исчезаем мгновенно (без анимации)
            if (skipAnimation) {
                popupContainer.destroy();
                resolve();
                return;
            }
            
            let closeProgress = 0;
            const closeTicker = (ticker) => {
                closeProgress += ticker.deltaTime / (0.2 * 60);
                if (closeProgress >= 1) {
                    app.ticker.remove(closeTicker);
                    popupContainer.destroy();
                    resolve(); 
                } else {
                    plaqueGroup.scale.set(plaqueScale * (1 - closeProgress));
                    popupContainer.alpha = 1 - closeProgress;
                }
            };
            app.ticker.add(closeTicker);
        };

        if (autoCloseMs > 0) {
            setTimeout(closePlaque, autoCloseMs);
        }
    });
}
        // ==========================================
        // UI-КОМПОНЕНТЫ
        // ==========================================

        /**
         * Анимация появления объекта «пружинкой» (scale 0 → targetScale).
         * @param {PIXI.DisplayObject} obj
         * @param {number} targetScale
         * @param {number} durationSec
         */
        function springBounce(obj, targetScale = 1.0, durationSec = 0.5) {
            obj.scale.set(0);
            obj.isSpawning = true;
            let progress = 0;

            const ticker = (t) => {
                if (obj.destroyed) return app.ticker.remove(ticker);
                progress += t.deltaTime / (durationSec * 60);
                if (progress >= 1) {
                    obj.scale.set(targetScale);
                    obj.isSpawning = false;
                    app.ticker.remove(ticker);
                } else {
                    const e = progress - 1;
                    const ease = (e * e * (3 * e + 2) + 1);
                    obj.scale.set(targetScale * ease);
                }
            };
            app.ticker.add(ticker);
        }

        /**
         * Пульсация масштаба объекта (бесконечная).
         * @returns {Function} — вызови, чтобы остановить
         */
        function startPulse(obj, amplitude = 0.05, speed = 5, baseScale = 1.0) {
            let time = 0;
            const ticker = (t) => {
                if (obj.destroyed) return app.ticker.remove(ticker);
                time += t.deltaTime / 60;
                obj.scale.set(baseScale + Math.sin(time * speed) * amplitude);
            };
            app.ticker.add(ticker);
            return () => app.ticker.remove(ticker);
        }

        /**
         * Анимация нажатия кнопки (сжать и отпустить).
         * @param {PIXI.DisplayObject} obj
         * @param {Function} callback  — вызывается после завершения анимации
         */
        function pressButton(obj, callback) {
            if (obj._pressTicker) return;
            const orig = obj.scale.x;
            const pressed = orig * 0.9;
            let progress = 0;

            const ticker = (t) => {
                if (obj.destroyed) return app.ticker.remove(ticker);
                progress += t.deltaTime / (0.15 * 60);
                if (progress <= 0.5) {
                    obj.scale.set(orig + (pressed - orig) * (progress / 0.5));
                } else if (progress < 1) {
                    obj.scale.set(pressed + (orig - pressed) * ((progress - 0.5) / 0.5));
                } else {
                    obj.scale.set(orig);
                    app.ticker.remove(ticker);
                    obj._pressTicker = null;
                    if (callback) callback();
                }
            };
            obj._pressTicker = ticker;
            app.ticker.add(ticker);
        }

        /**


        /**
         * Плавно изменяет числовое значение (счётчик денег, прогресс-бар и т.д.)
         * @param {Function} onUpdate — (currentVal: number) => void
         * @param {number}   from
         * @param {number}   to
         * @param {number}   durationSec
         * @returns {Promise}
         */
        function animateValue(from, to, durationSec, onUpdate) {
            return new Promise(resolve => {
                let progress = 0;
                const ticker = (t) => {
                    progress += t.deltaTime / (durationSec * 60);
                    if (progress >= 1) {
                        onUpdate(to);
                        app.ticker.remove(ticker);
                        resolve();
                    } else {
                        const ease = 1 - Math.pow(1 - progress, 3);
                        onUpdate(from + (to - from) * ease);
                    }
                };
                app.ticker.add(ticker);
            });
        }

        /**
         * Туториал-рука, указывающая на targetObject.
         * Автоматически следит за перемещением цели.
         * @param {PIXI.DisplayObject} targetObject
         * @param {PIXI.Texture}       handTexture
         * @returns {Function} hideTutorialHand — вызови чтобы убрать руку
         */
        function showTutorialHand(targetObject, handTexture) {
            if (!targetObject || !handTexture) return () => {};

            const hand = new PIXI.Sprite({ texture: handTexture });
            hand.rotation = -Math.PI / 6;
            hand.eventMode = 'none';
            hand.anchor.set(0.3, 0.3);
            const baseScale = 0.23;
            hand.scale.set(baseScale);
            uiOverlayContainer.addChild(hand);

            let timer = 0;
            const moveDuration = 0.5;

            const ticker = (t) => {
                if (hand.destroyed || targetObject.destroyed) return app.ticker.remove(ticker);
                timer += t.deltaTime / 60;

                const globalPos = targetObject.getGlobalPosition();
                const localPos  = uiOverlayContainer.toLocal(globalPos);

                if (timer < moveDuration) {
                    const ease = 1 - Math.pow(1 - timer / moveDuration, 3);
                    hand.position.set(
                        localPos.x + 150 * (1 - ease),
                        localPos.y + 150 * (1 - ease)
                    );
                } else {
                    hand.position.set(localPos.x, localPos.y);
                    const pulse = Math.sin((timer - moveDuration) * 15) * 0.05;
                    hand.scale.set(baseScale + pulse);
                }
            };
            app.ticker.add(ticker);

            return function hideTutorialHand() {
                if (ticker)           app.ticker.remove(ticker);
                if (!hand.destroyed)  hand.destroy();
            };
        }



// ДОБАВИЛИ АРГУМЕНТ targetAmount (Сумма выигрыша)
function showPhoneAnimation(targetAmount, onComplete) {
    // 1. DIMMER — отдельный контейнер, добавляется ПЕРВЫМ (нижний слой)
    const dimmerContainer = new PIXI.Container();
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.7 });
    dimmer.eventMode = 'static';
    dimmerContainer.addChild(dimmer);
    uiOverlayContainer.addChild(dimmerContainer);

    // 2. КОНТЕНТ — отдельный контейнер, добавляется ВТОРЫМ (верхний слой)
    const popupContainer = new PIXI.Container();
    uiOverlayContainer.addChild(popupContainer);

    // 3. КОНТЕЙНЕР ТЕЛЕФОНА
    const phoneGroup = new PIXI.Container();
    phoneGroup.position.set(0, 1500); 
    popupContainer.addChild(phoneGroup);

    // САМ ТЕЛЕФОН
    const phoneSprite = new PIXI.Sprite({ texture: phoneTex });
    phoneSprite.anchor.set(0.5);
    phoneSprite.scale.set(1.8); 
    phoneGroup.addChild(phoneSprite);

    // ==========================================
    // 4. СЧЕТЧИК ДЕНЕГ (Доходит до targetAmount)
    // ==========================================
    const moneyStyle = new PIXI.TextStyle({
        fontFamily: 'Inter', // Заменили на твой шрифт
        fontSize: 70,
        fill: '#ffffff', // Белый (или сделай #00ff00 для зеленого)
        dropShadow: { color: '#00aa00', alpha: 0.8, distance: 0, blur: 10 },
        align: 'center'
    });
    
    const moneyText = new PIXI.Text({ text: "0 €", style: moneyStyle });
    moneyText.anchor.set(0.5);
    moneyText.position.set(0, -320); 
    phoneGroup.addChild(moneyText);

    // ЛОГИКА НАБОРА СУММЫ ДО TARGET
    let timeElapsed = 0;
    const fillDuration = 3.0; // За сколько секунд наберется вся сумма (3 секунды)

    const moneyTicker = (ticker) => {
        timeElapsed += ticker.deltaTime / 60;

        if (timeElapsed < fillDuration) {
            // Плавное замедление к концу (Cubic Ease-Out)
            const t = timeElapsed / fillDuration;
            const easeOut = 1 - Math.pow(1 - t, 3);
            
            const currentMoney = Math.floor(targetAmount * easeOut);
            moneyText.text = currentMoney.toLocaleString('ru-RU') + " €";
            
            // Быстрая пульсация во время набора
            moneyText.scale.set(1 + Math.sin(timeElapsed * 20) * 0.03);
        } else {
            // ОСТАНОВКА НА ФИНАЛЬНОЙ СУММЕ
            moneyText.text = targetAmount.toLocaleString('ru-RU') + " €";
            
            // Легкое "дыхание" текста после остановки
            moneyText.scale.set(1 + Math.sin(timeElapsed * 5) * 0.01);
        }
    };
    app.ticker.add(moneyTicker);

    // ==========================================
    // 5. СИСТЕМА УВЕДОМЛЕНИЙ (Push Notifications)
    // ==========================================
    const notifContainer = new PIXI.Container();
    phoneGroup.addChild(notifContainer);

    const phoneScreenMask = new PIXI.Graphics();
    phoneScreenMask.roundRect(-450, -550, 1000, 950, 0); 
    phoneScreenMask.fill(0xffffff);
    phoneGroup.addChild(phoneScreenMask);
    notifContainer.mask = phoneScreenMask;

    let activeNotifs = []; 
    const notifSpacing = 140; 
    const startNotifY = 230;   

    function spawnNotification(isInitial = false) {
        const notif = new PIXI.Sprite({ texture: notifTex }); 
        notif.anchor.set(0.5);
        
        if (isInitial) {
            notif.y = startNotifY + (activeNotifs.length * notifSpacing);
            notif.alpha = 1;
        } else {
            notif.y = startNotifY - 50; 
            notif.alpha = 0;
            notif.scale.set(1.5);
        }

        notifContainer.addChild(notif);
        activeNotifs.unshift(notif);

        let moveProgress = 0;
        const moveDuration = 1; 

        const startPositions = activeNotifs.map(n => n.y);
        const startAlphas = activeNotifs.map(n => n.alpha);
        const startScales = activeNotifs.map(n => n.scale.x);

        const moveTicker = (ticker) => {
            if (notif.destroyed) return app.ticker.remove(moveTicker);

            moveProgress += ticker.deltaTime / (moveDuration * 60);

            if (moveProgress >= 1) {
                app.ticker.remove(moveTicker);
                if (activeNotifs.length > 4) {
                    const oldNotif = activeNotifs.pop(); 
                    oldNotif.destroy(); 
                }
            } else {
                const ease = 1 - Math.pow(1 - moveProgress, 3); 

                activeNotifs.forEach((n, index) => {
                    const targetY = startNotifY + (index * notifSpacing);
                    n.y = startPositions[index] + (targetY - startPositions[index]) * ease;
                    
                    if (index === 0 && !isInitial) {
                        n.alpha = startAlphas[0] + (1 - startAlphas[0]) * ease;
                        n.scale.set(startScales[0] + (2.3 - startScales[0]) * ease);
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
        playSound(sms);
    }, 1100);

    // ==========================================
    // 6. АНИМАЦИЯ ПОЯВЛЕНИЯ ТЕЛЕФОНА
    // ==========================================
    let appearProgress = 0;
    const startPhoneY = 1500;
    const targetPhoneY = 300; 

    const appearTicker = (ticker) => {
        appearProgress += ticker.deltaTime / (1.6 * 60); 

        if (appearProgress >= 1) {
            phoneGroup.position.set(0, targetPhoneY);
            app.ticker.remove(appearTicker);
        } else {
            const t = appearProgress - 1;
            const ease = (t * t * (3 * t + 2) + 1); 
            phoneGroup.position.y = startPhoneY + (targetPhoneY - startPhoneY) * ease;
        }
    };
    app.ticker.add(appearTicker);

    // ==========================================
    // 7. КНОПКА ЗАКРЫТИЯ (Или переход в стор)
    // ==========================================
    dimmer.cursor = 'pointer';
    
    // Закрытие автоматически через 4.3 секунды (хватит, чтобы сумма дошла до конца и повисела 1.3 секунды)
    setTimeout(() => {
        app.ticker.remove(moneyTicker);
        clearInterval(notifTimer);
        
        let closeProgress = 0;
        const closeTicker = (ticker) => {
            closeProgress += ticker.deltaTime / (0.3 * 60);
            if (closeProgress >= 1) {
                app.ticker.remove(closeTicker);
                popupContainer.destroy({ children: true });
                dimmerContainer.destroy({ children: true }); 
                if (onComplete) onComplete(); 
            } else {
                popupContainer.alpha = 1 - closeProgress;
                dimmerContainer.alpha = 1 - closeProgress; 
            }
        };
        app.ticker.add(closeTicker);
    }, 4300);
}



 /**
         * Спавнит iOS-style push-уведомление (Тёмная тема + Анимация печати слов).
         * @param {string} title    — заголовок (название приложения, например "Revolut")
         * @param {string} bodyLine1 — первая строка текста
         * @param {string} bodyLine2 — вторая строка текста (опционально)
         * @param {number} yPos     — позиция по Y относительно центра UI (например, -800)
         * @param {number} lifetime — сколько секунд висит на экране до исчезновения
         */
function spawnPushNotification(amountText, yPos = -800) {
    playSound(sms);

    // Включаем сортировку слоев (на случай, если плашка не вызывалась)
    uiOverlayContainer.sortableChildren = true;

    // 1. СОЗДАЕМ КОНТЕЙНЕР
    pushContainer = new PIXI.Container();
    pushContainer.position.set(0, yPos);
    
    // САМОЕ ВАЖНОЕ: СТАВИМ Z-INDEX БОЛЬШЕ, ЧЕМ У ДИММЕРА (50)
    pushContainer.zIndex = 100; 
    pushContainer.targetScale = 1.0; 
    uiOverlayContainer.addChild(pushContainer);
    
    // ==========================================
    // 2. ВСЯ ГРАФИКА РИСУЕТСЯ В БАЗОВОМ РАЗМЕРЕ
    // ==========================================
    const width = 980; 
    const height = 290;
    const radius = 50;

    const bg = new PIXI.Graphics();
    bg.roundRect(-width / 2, -height / 2, width, height, radius);
    bg.fill({ color: '#ebebeb', alpha: 1 });
    bg.stroke({ color: '#ffffff', width: 2, alpha: 1 });
    pushContainer.addChild(bg);

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

    const textX = -width / 2 + 200; 
    const titleStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 42, fontWeight: 'bold', fill: '#000000' });
    const timeStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 32, fill: '#000000' });
    const bodyStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 38, fill: '#000000' });
    const subStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 28, fill: '#aaaaaa' });

    const lineSpacing = 50; 
    const startY = -90; 

    const title = new PIXI.Text({ text: "Revolut", style: titleStyle });
    title.position.set(textX, startY);
    
    const timeText = new PIXI.Text({ text: "now", style: timeStyle });
    timeText.anchor.set(1, 0); 
    timeText.position.set(width / 2 - 50, startY);
    pushContainer.addChild(title, timeText);

    const fullText1 = `CARD *6532. Transaction: +€${amountText}`;
    const fullText2 = `Current balance: €${amountText}`;
    const fullText3 = "Click here for more information.";

    const line1 = new PIXI.Text({ text: fullText1, style: bodyStyle });
    line1.position.set(textX, startY + lineSpacing);
    
    const line2 = new PIXI.Text({ text: fullText2, style: bodyStyle });
    line2.position.set(textX, startY + lineSpacing * 2);
    
    const subText = new PIXI.Text({ text: fullText3, style: subStyle });
    subText.position.set(textX, startY + lineSpacing * 3 + 10);
    
    pushContainer.addChild(line1, line2, subText);

    if (typeof resize === 'function') resize();

    // ==========================================
    // 3. АНИМАЦИОННЫЙ ЦИКЛ 
    // ==========================================
    pushContainer.scale.set(0); 

    let time = 0;

    const animTicker = (ticker) => {
        if (!pushContainer || pushContainer.destroyed) {
            return app.ticker.remove(animTicker);
        }

        pushContainer.isSpawning = true; 
        
        const dt = ticker.deltaTime / 60;
        time += dt;

        if (time < 0.2) {
            const t = time / 0.2;
            const scaleEase = 1 - Math.pow(1 - t, 3); 
            pushContainer.scale.set(pushContainer.targetScale * scaleEase);
        } else {
            pushContainer.scale.set(pushContainer.targetScale);
            pushContainer.isSpawning = false; 
        }

        if (time > 1.4 && time < 1.6) {
            const t = (time - 1.4) / 0.3;
            pushContainer.y = yPos - (t * 100); 
            pushContainer.alpha = 1 - t; 
        } else if (time >= 1.8) {
            app.ticker.remove(animTicker);
            pushContainer.destroy();
            pushContainer = null;
        }
    };

    app.ticker.add(animTicker);
}

        /**
         * Всплывающий текст (например, "+100€", "x5", "NICE!").
         * Вылетает из startX/Y, прилетает в targetX/Y и исчезает.
         */
        function spawnFloatingText(text, startX, startY, targetX, targetY, finalScale = 1.0, durationSec = 0.8, container = gameContainer) {
            const style = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 120,
                fontWeight: 'bold',
                fill: '#ffdd00',
                stroke: { color: '#804611', width: 8 },
                dropShadow: { color: '#000000', blur: 4, distance: 4 },
            });

            const obj = new PIXI.Text({ text, style });
            obj.anchor.set(0.5);
            obj.position.set(startX, startY);
            obj.scale.set(0);
            const randomRot = (Math.random() - 0.5) * 0.5;
            obj.rotation = randomRot;
            container.addChild(obj);

            let progress = 0;
            const ticker = (t) => {
                if (obj.destroyed) return app.ticker.remove(ticker);
                progress += t.deltaTime / (durationSec * 60);
                if (progress >= 1) {
                    obj.position.set(targetX, targetY);
                    obj.scale.set(finalScale);
                    obj.rotation = 0;
                    app.ticker.remove(ticker);
                } else {
                    const ease = 1 - Math.pow(1 - progress, 3);
                    obj.position.x = startX + (targetX - startX) * ease;
                    obj.position.y = startY + (targetY - startY) * ease;
                    const e = progress - 1;
                    obj.scale.set(finalScale * (e * e * (3 * e + 2) + 1));
                    obj.rotation = randomRot * (1 - ease);
                }
            };
            app.ticker.add(ticker);
            return obj;
        }


        // ==========================================
        // RESIZE / АДАПТИВ
        // ==========================================
function resize() {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    app.renderer.resize(sw, sh);

    // ==========================================
    // 1. ИГРОВОЙ МИР (КАМЕРА И СЛЕЖЕНИЕ ЗА КУРИЦЕЙ)
    // ==========================================
    // Этот блок критически важен для работы focusCameraOnTarget!
    const baseZoom = Math.min(sw / GAME_WIDTH, sh / GAME_HEIGHT);
    const finalScale = baseZoom * cameraZoom;

    if (typeof cameraLayers !== 'undefined') {
        cameraLayers.forEach(layer => {
            layer.scale.set(finalScale);
            layer.position.set(
                sw / 2 - (cameraX * finalScale * layer.parallaxFactor),
                sh / 2 - (cameraY * finalScale * layer.parallaxFactor)
            );
        });
    }

    // ==========================================
    // 2. ГЛОБАЛЬНЫЙ МАСШТАБ UI
    // ==========================================
    let uiScale = sh / GAME_HEIGHT;
    const ar = sw / sh;
    if (ar < 0.53) uiScale *= (ar / 0.53);

    uiOverlayContainer.scale.set(uiScale);
    uiOverlayContainer.position.set(sw / 2, sh / 2);

    const halfH = (sh / 2) / uiScale;
    const halfW = (sw / 2) / uiScale;
    const swUI = sw / uiScale; // Полная ширина экрана в координатах UI

    // ==========================================
    // 3. АДАПТИВНЫЙ ХЕДЕР (ВЕРХНЯЯ ПАНЕЛЬ)
    // ==========================================
    // Если ширина экрана меньше 1400px, начинаем пропорционально уменьшать элементы хедера.
    const HEADER_BREAKPOINT = 1400; 
    let headerAutoSmallScale = 1.0;
    
    if (swUI < HEADER_BREAKPOINT) {
        headerAutoSmallScale = swUI / HEADER_BREAKPOINT;
    }

    // Позиционируем контейнер хедера в самый верх
    if (typeof headerContainer !== 'undefined') {
        headerContainer.position.set(0, -halfH + 50);

        // Применяем масштабирование к элементам (базовый скейл * коэффициент сжатия)
        if (typeof topLogo !== 'undefined') {
            topLogo.scale.set(1.1 * headerAutoSmallScale);
            topLogo.position.set(-halfW + 30, 10);
        }

        if (typeof topBalanceContainer !== 'undefined') {
            topBalanceContainer.scale.set(0.9 * headerAutoSmallScale);
            topBalanceContainer.position.set(halfW - 30, 20);
        }
    }

    // Плашка TOTAL WIN
    if (typeof totalWinGroup !== 'undefined') {
        totalWinGroup.scale.set(1.5 * headerAutoSmallScale);
        if(sw > sh){
            totalWinGroup.position.set(0, -halfH + 320); 
        }
        else{
            totalWinGroup.position.set(0, -halfH * -0.18); 
        }
        
    }

    // ==========================================
    // 4. ФУТЕР (НИЖНЯЯ ПАНЕЛЬ ИЗ ПРЕДЫДУЩЕГО ШАГА)
    // ==========================================
    if (typeof footerContainer !== 'undefined') {
        const isPortrait = sw < sh;
        const BASE_FOOTER_SCALE = 1.2;

        if (typeof footerDarkBase !== 'undefined') footerDarkBase.clear();

        if (isPortrait) {
            // ПОРТРЕТНЫЙ РЕЖИМ
            if (typeof footerDarkBase !== 'undefined') {
                footerDarkBase.rect(-3000, -400, 6000, 800);
                footerDarkBase.fill({ color: '#424242', alpha: 1 });
            }
            footerContainer.position.set(0, halfH - 300);

            if (typeof diffBlock !== 'undefined') diffBlock.visible = false;
            if (typeof footerBg !== 'undefined') footerBg.position.set(0, -180);
            
            if (typeof freeGamesBtn !== 'undefined') {
                freeGamesBtn.position.set(0, 100);
                if (typeof btnGraphics !== 'undefined') {
                    btnGraphics.clear();
                    btnGraphics.roundRect(-450, -50, 900, 140, 20); 
                    btnGraphics.fill({ color: 0x439c50 });
                    btnGraphics.position.set(0, 0); 
                }
                if (typeof freeGamesText !== 'undefined') {
                    freeGamesText.position.set(0, 20);
                    freeGamesText.style.fontSize = 50; 
                }
            }

            const PORTRAIT_WIDTH = 1000; 
            const scaledFooterWidth = PORTRAIT_WIDTH * BASE_FOOTER_SCALE;
            if (typeof contentGroup !== 'undefined') {
                if (swUI < scaledFooterWidth) {
                    contentGroup.scale.set((swUI / PORTRAIT_WIDTH) * 0.95); 
                } else {
                    contentGroup.scale.set(BASE_FOOTER_SCALE); 
                }
            }
        } else {
            // ЛАНДШАФТНЫЙ РЕЖИМ
            if (typeof footerDarkBase !== 'undefined') {
                footerDarkBase.rect(-3000, -210, 6000, 720); 
                footerDarkBase.fill({ color: '#424242', alpha: 1 });
            }
            footerContainer.position.set(0, halfH - 85);

            if (typeof diffBlock !== 'undefined') {
                diffBlock.visible = true;
                diffBlock.position.set(280, -45);
            }
            if (typeof footerBg !== 'undefined') footerBg.position.set(-660, -50);
            
            if (typeof freeGamesBtn !== 'undefined') {
                freeGamesBtn.position.set(480, -130);
                if (typeof btnGraphics !== 'undefined') {
                    btnGraphics.clear();
                    btnGraphics.roundRect(300, -150, 540, 220, 10);
                    btnGraphics.fill({ color: 0x439c50 });
                    btnGraphics.position.set(-100, 120);
                }
                if (typeof freeGamesText !== 'undefined') {
                    freeGamesText.position.set(460, 80);
                    freeGamesText.style.fontSize = 34;
                }
            }

            const LANDSCAPE_WIDTH = 2200; 
            const scaledFooterWidth = LANDSCAPE_WIDTH * BASE_FOOTER_SCALE;
            if (typeof contentGroup !== 'undefined') {
                if (swUI < scaledFooterWidth) {
                    contentGroup.scale.set((swUI / LANDSCAPE_WIDTH) * 0.98); 
                } else {
                    contentGroup.scale.set(BASE_FOOTER_SCALE); 
                }
            }
        }
    }
    
    // --- ПРИВЯЗКА ДИСКЛЕЙМЕРА IRONSOURCE (В САМЫЙ НИЗ) ---
    if (typeof disclaimerTxt !== 'undefined' && disclaimerTxt) {
        disclaimerTxt.position.set(0, halfH - 15);
    }
}
        window.addEventListener('resize', ()=>{
            focusCameraOnTarget(player , true)
        });
        
    }

    catch (e) {
        console.error('Playable Init Error:', e);
    }
};


// ==========================================
// ТОЧКА ВХОДА
// ==========================================
function startApp() {
    init().catch(e => console.error(e));
}

if (typeof mraid !== 'undefined') {
    mraid.getState() === 'loading'
        ? mraid.addEventListener('ready', startApp)
        : startApp();
} else {
    startApp();
}