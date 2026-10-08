import * as PIXI from 'pixi.js';
import './style.css';

// Импорты ассетов
import bgIMG from './assets/background.webp';
import logoIMG from './assets/logo.webp';
import uiBotIMG from './assets/bot.webp';
import playIMG from './assets/play.png';
import bonusIMG from './assets/freeBonus.png';
import balanceIMG from './assets/balance.png';
import handIMG from './assets/Hand.webp';
import moneyIMG from './assets/money.webp';
import phoneIMG from './assets/phone.webp';
import phoneWalletIMG from './assets/phoneWallet.webp';
import notifIMG from './assets/notif.png';
import iconIMG from './assets/icon.webp';
import goldIMG from './assets/gold.png';
import euroIMG from './assets/euro.png';
import pushIMG from './assets/push.webp';
import sms from './assets/sms.mp3';
import pop from './assets/pop.mp3';
import slot from './assets/slot.mp3';
import bgm from './assets/bgMusic.mp3';
import veer from './assets/veer.mp3';
import mul128 from './assets/1.png';
import mul10 from './assets/2.png';
import mul5 from './assets/3.png';
import mul2 from './assets/4.png';
import mul1 from './assets/5.png';
import ball from './assets/ball.png';
import notif1IMG from './assets/notif1.png';

// ==========================================
// 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И СОСТОЯНИЯ (ВАЖЕН ПОРЯДОК)
// ==========================================
let isAudioUnlocked = false;
let isIronSource = false;


let isMutedByNetwork = false;    
let isMutedBySystemHack = false; 
let isGameHidden = false;        

const audioBuffers = {};
let bgmSource = null;

// Создаем аудио-контекст сразу
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// Master Gain — наш главный рубильник громкости
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);
masterGain.gain.value = 1;

// ==========================================
// 2. КОНФИГ ИГРЫ
// ==========================================
const GAME_WIDTH  = 1080;
const GAME_HEIGHT = 1920;

const ROWS = 8;
const PEG_SPACING_X = 80;
const PEG_SPACING_Y = 75;
const PEG_RADIUS = 8;
const BALL_RADIUS = 27;
const START_Y = 770;

const GRAVITY = 1;
const BOUNCE_DAMPING = 0.2;
const RANDOM_BOUNCE = 10.0;

const pegs = [];
const activeBalls = [];
const slots = [];
let pushContainer = null;
let ballsDropped = 0;
let ballsLanded = 0;
const TOTAL_BALLS = 6;
const fixedWins = [450, 320, 860, 150, 500, 500];

// ==========================================
// 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ЗАГРУЗКИ
// ==========================================

// Помогает достать путь из импорта (Vite/Webpack)
const getAssetPath = (src) => (src && src.default) ? src.default : src;

async function loadSound(url) {
    const path = getAssetPath(url);
    if (!path) return null;
    if (audioBuffers[path]) return audioBuffers[path];
    
    try {
        let arrayBuffer;
        if (path.startsWith('data:')) {
            const base64String = path.split(',')[1];
            const binaryString = window.atob(base64String);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
        } else {
            const response = await fetch(path);
            arrayBuffer = await response.arrayBuffer();
        }

        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioBuffers[path] = audioBuffer;
        return audioBuffer;
    } catch (e) {
        console.error("Audio error:", path, e);
        return null;
    }
}

function loadTextureDirectly(src) {
    const path = getAssetPath(src);
    return new Promise((resolve) => {
        if (!path) return resolve(PIXI.Texture.EMPTY);
        const img = new window.Image();
        img.onload  = () => resolve(PIXI.Texture.from(img));
        img.onerror = () => {
            console.warn("Texture failed:", path);
            resolve(PIXI.Texture.EMPTY);
        };
        img.src = path;
    });
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ АНИМАЦИИ
async function createAnimFromFolder(globObject, speed = 0.5, loop = true) {
    if (!globObject || Object.keys(globObject).length === 0) {
        console.error("Anim error: Empty globObject");
        return new PIXI.Container(); // Чтобы .set() не выдавал ошибку
    }

    const sortedKeys = Object.keys(globObject).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );
    
    const textures = [];
    for (const key of sortedKeys) {
        const url = globObject[key]?.default || globObject[key];
        const tex = await loadTextureDirectly(url);
        if (tex) textures.push(tex);
    }

    if (textures.length === 0) return new PIXI.Container();

    const anim = new PIXI.AnimatedSprite(textures);
    anim.animationSpeed = speed;
    anim.loop = loop;
    anim.anchor.set(0.5); // Теперь точно не упадет
    return anim;
}

// ==========================================
// 4. ЦЕНТРАЛЬНОЕ УПРАВЛЕНИЕ ЗВУКОМ
// ==========================================

function updateAudioState() {
    const shouldBeMuted = isGameHidden || isMutedByNetwork || isMutedBySystemHack;
    // Плавно меняем громкость (0.05с), чтобы избежать щелчков
    masterGain.gain.setTargetAtTime(shouldBeMuted ? 0 : 1, audioCtx.currentTime, 0.05);
}

function playSound(url, volume = 1.0) {
    const path = getAssetPath(url);
    if (!isAudioUnlocked || !audioBuffers[path]) return;

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffers[path];
    const localGain = audioCtx.createGain();
    localGain.gain.value = volume;
    
    source.connect(localGain);
    localGain.connect(masterGain); 
    source.start(0);
}

function startBGM(url, volume = 0.5) {
    const path = getAssetPath(url);
    if (bgmSource) { try { bgmSource.stop(); } catch(e){} }
    if (!audioBuffers[path]) return;

    bgmSource = audioCtx.createBufferSource();
    bgmSource.buffer = audioBuffers[path];
    bgmSource.loop = true;
    const localGain = audioCtx.createGain();
    localGain.gain.value = volume;

    bgmSource.connect(localGain);
    localGain.connect(masterGain);
    bgmSource.start(0);
}

function unlockAudioOnFirstTouch() {
    if (isAudioUnlocked) return;
    audioCtx.resume().then(() => {
        isAudioUnlocked = true;
        initMraidAudioListeners();
        if (typeof bgm !== 'undefined') startBGM(bgm, 0.4);
        updateAudioState();
        document.removeEventListener('touchstart', unlockAudioOnFirstTouch);
        document.removeEventListener('click', unlockAudioOnFirstTouch);
    });
}
document.addEventListener('touchstart', unlockAudioOnFirstTouch, { once: true });
document.addEventListener('click',      unlockAudioOnFirstTouch, { once: true });

// ==========================================
// 5. MRAID И ЖИЗНЕННЫЙ ЦИКЛ (ДЛЯ МОДЕРАЦИИ)
// ==========================================

function pauseGame() {
    isGameHidden = true;
    PIXI.Ticker.shared.stop();
    updateAudioState();
}

function resumeGame() {
    isGameHidden = false;
    PIXI.Ticker.shared.start();
    updateAudioState();
}

document.addEventListener('visibilitychange', () => {
    (document.hidden || document.visibilityState === 'hidden') ? pauseGame() : resumeGame();
});

function initMraidAudioListeners() {
    if (typeof mraid !== 'undefined') {
        mraid.addEventListener('viewableChange', (v) => v ? resumeGame() : pauseGame());
        mraid.addEventListener('volumeChange', (volume) => {
            isMutedByNetwork = (volume === 0);
            updateAudioState();
        });
    }
}

// Хак для физической кнопки мута на iOS
setInterval(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS || !isAudioUnlocked || audioCtx.state !== 'running') return;

    const source = audioCtx.createBufferSource();
    source.buffer = audioCtx.createBuffer(1, 1, 22050);
    source.connect(audioCtx.destination);
    const start = performance.now();
    source.onended = () => {
        isMutedBySystemHack = (performance.now() - start > 10);
        updateAudioState();
    };
    source.start(0);
}, 2000);

// Магазин
function openStore() {
    pauseGame();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let finalUrl = "";
    if (typeof buildConfig !== 'undefined') {
        finalUrl = isIOS ? buildConfig.appStoreUrl : buildConfig.googlePlayUrl;
    }
    if (typeof mraid !== 'undefined') { mraid.open(finalUrl); return; }
    window.open(finalUrl, '_blank');
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
        free_try:          'FREE TRY',
        collect_bonus:     'COLLECT BONUS',
        play:              'PLAY',
        deposit_bonus_500: 'BONUS FOR FIRST DEPOSIT UP TO 500 EUR',
        free_spins_250:    '250 FREE SPINS',
        min_deposit_20:    'MINIMAL FIRST DEPOSIT IS JUST 20 EUR',
        install:           'INSTALL',
        bonus:      'BONUS',
        free_spins: 'FREE SPINS',
    };
    
    if (typeof buildConfig !== 'undefined' && buildConfig.translations) {
        const lang = buildConfig.language || 'EN';
        if (buildConfig.translations[lang]?.[key]) {
            return buildConfig.translations[lang][key];
        }
    }
    return defaults[key] || key;
}


/**
 * Умная функция вычисления размера шрифта на основе длины перевода.
 * @param {string} translatedText - Переведенный текст (например, "VYZKOUSENI ZDARMA")
 * @param {string} englishOriginal - Английский оригинал (например, "FREE TRY")
 * @param {number} baseFontSize - Размер шрифта в дизайне (например, 120)
 * @param {number} minFontSize - Минимально допустимый размер (чтобы текст можно было прочитать)
 * @returns {number} - Идеальный размер шрифта
 */
function getSmartFontSize(translatedText, englishOriginal, baseFontSize, minFontSize = 30) {
    if (!translatedText || !englishOriginal) return baseFontSize;

    const enLength = englishOriginal.length;
    const trLength = translatedText.length;

    // Если перевод короче или такой же длины — возвращаем оригинальный размер шрифта
    if (trLength <= enLength) {
        return baseFontSize;
    }

    // Вычисляем коэффициент. 
    // Пример: "FREE TRY" (8) / "VYZKOUSENI ZDARMA" (17) = 0.47
    // Чтобы текст не сжимался СЛИШКОМ сильно (так как пробелы и узкие буквы съедают меньше места), 
    // мы немного смягчаем коэффициент (добавляем степень 0.8).
    const ratio = Math.pow(enLength / trLength, 0.8);

    const newFontSize = Math.floor(baseFontSize * ratio);

    // Возвращаем новый размер, но не меньше разрешенного минимума
    return Math.max(newFontSize, minFontSize);
}


// ==========================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ==========================================
const init = async () => {
    try {
        await document.fonts.load('10pt "softhyphen"');
        
        // 2. Ждем, пока браузер закончит обработку всех шрифтов
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



        const [
            backgroundTex, logoTex, uiBotTex, playButtonTex, balanceTex, handTex,
            bonusTex, moneyTex, phoneTex, phoneWalletTex, notifTex, iconTex, goldTex,
            euroTex, pushTex, mul128Tex, mul10Tex, mul5Tex, mul2Tex, mu1Tex, ballTex, notif1
        ] = await Promise.all([
            // Загрузка текстур
            loadTextureDirectly(bgIMG),
            loadTextureDirectly(logoIMG),
            loadTextureDirectly(uiBotIMG),
            loadTextureDirectly(playIMG),
            loadTextureDirectly(balanceIMG),
            loadTextureDirectly(handIMG),
            loadTextureDirectly(bonusIMG),
            loadTextureDirectly(moneyIMG),
            loadTextureDirectly(phoneIMG),
            loadTextureDirectly(phoneWalletIMG),
            loadTextureDirectly(notifIMG),
            loadTextureDirectly(iconIMG),
            loadTextureDirectly(goldIMG),
            loadTextureDirectly(euroIMG),
            loadTextureDirectly(pushIMG),
            loadTextureDirectly(mul128),
            loadTextureDirectly(mul10),
            loadTextureDirectly(mul5),
            loadTextureDirectly(mul2),
            loadTextureDirectly(mul1),
            loadTextureDirectly(ball),
            loadTextureDirectly(notif1IMG),

            // ==========================================
            // ВАЖНО: ЗАГРУЗКА ЗВУКОВ ДЛЯ AUDIO CONTEXT
            // ==========================================
            loadSound(sms),
            loadSound(pop),
            loadSound(slot),
            loadSound(bgm),
            loadSound(veer)
        ]);

        // ------------------------------------------
        // КАМЕРА
        // ------------------------------------------
// ------------------------------------------
        // КАМЕРА
        // ------------------------------------------
        let cameraX    = GAME_WIDTH / 2;
        let cameraY    = GAME_HEIGHT / 2;
        let cameraZoom = 1.25;
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

        const background = new PIXI.Sprite({texture: backgroundTex});
        background.anchor.set(0.5);
        background.position.set(300 , 900);
        background.scale.set(3);
        gameContainer.addChild(background);

        const PlayButtonSprite = new PIXI.Sprite({texture: playButtonTex});
        PlayButtonSprite.anchor.set(0.5);
        PlayButtonSprite.scale.set(0.43);
        uiOverlayContainer.addChild(PlayButtonSprite);
        PlayButtonSprite.eventMode = 'static';

        const uiBotSprite = new PIXI.Sprite({texture: uiBotTex});
        uiBotSprite.anchor.set(0.5);
        uiBotSprite.scale.set(1);
        uiOverlayContainer.addChild(uiBotSprite);
        uiBotSprite.eventMode = 'none';

        const logoSprite = new PIXI.Sprite({texture: logoTex});
        logoSprite.anchor.set(0.5);
        logoSprite.scale.set(0.5);
        logoSprite.position.set(0 , -800);
        uiOverlayContainer.addChild(logoSprite);
        logoSprite.eventMode = 'none';

        // В консоли:
        console.log([...document.styleSheets].map(s => s.href || 'inline'));

        


        


        // ==========================================
    // 6.5. ДИСКЛЕЙМЕР ДЛЯ IRONSOURCE

        
    // ==========================================
        // ГЛОБАЛЬНЫЙ ДИСКЛЕЙМЕР (ДЛЯ IRONSOURCE)
        // ==========================================
        let disclaimerTxt = null;
        
        if (isIronSource) {
            disclaimerTxt = new PIXI.Text({ 
                text: "For illustrative purposes only".toUpperCase(), // Или getT("disclaimer")
                style: { 
                    fontFamily: 'softhyphen', 
                    fontSize: 34, 
                    fill: '#ffffff',
                    stroke: { color: '#000000', width: 7 }, // Черная обводка для читаемости 
                    alpha: 0.6, 
                    align: 'center'
                } 
            });
            disclaimerTxt.anchor.set(0.5, 1); // Якорь снизу по центру
            disclaimerTxt.zIndex = 1000;      // Поверх вообще всего UI
            uiOverlayContainer.addChild(disclaimerTxt);
            
            // Включаем сортировку, чтобы zIndex сработал
            uiOverlayContainer.sortableChildren = true;
        }


        const flyTextStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen', 
            fontSize: 64,
            fill: '#ffee00', // Желтый/Золотой
            //stroke: { color: '#000000', width: 5 },
            align: 'center', // Центрирует строки друг относительно друга
            //dropShadow: { color: '#000000', blur: 4, distance: 2 }
        });


        const balanceSprite = new PIXI.Sprite({texture: balanceTex});
        balanceSprite.anchor.set(0.5);
        balanceSprite.position.set(0 , -530);
        balanceSprite.scale.set(3.2);
        uiOverlayContainer.addChild(balanceSprite);

        let currentBalance = 0;
        let visualBalance = 0; // То, что отображается на экране в данный момент

        const balanceText = new PIXI.Text({text: `€ ${currentBalance.toFixed(2)}`, style: flyTextStyle });
        balanceText.anchor.set(0.5, 0.5); // Якорь снизу по центру
        balanceText.zIndex = 20; // Поверх всего
        balanceText.position.set(0 , 0);
        balanceText.scale.set(0.4);
        balanceSprite.addChild(balanceText);


    const pegContainer = new PIXI.Container();
    //pegContainer.position.set(0 , 300);
    //pegContainer.anchor.set(0.5);
    gameContainer.addChild(pegContainer);

    // Рисуем верхнюю дырку (спавнер)
    const spawnerHole = new PIXI.Graphics();
    spawnerHole.circle(GAME_WIDTH / 2, START_Y - 100, 30);
    spawnerHole.fill({ color: 0x000000, alpha: 0.5 });
    spawnerHole.stroke({ color: 0x1e293b, width: 4 });
    pegContainer.addChild(spawnerHole);

    // Генерируем ряды точек
    for (let row = 0; row < ROWS; row++) {
        // Каждый следующий ряд имеет на 1 точку больше (например: 3, 4, 5...)
        const cols = row + 3; 
        
        // Вычисляем ширину текущего ряда, чтобы отцентрировать его
        const rowWidth = (cols - 1) * PEG_SPACING_X;
        const startX = GAME_WIDTH / 2 - rowWidth / 2;
        const y = START_Y + row * PEG_SPACING_Y;

        for (let col = 0; col < cols; col++) {
            const x = startX + col * PEG_SPACING_X;

            // Рисуем точку (PIXI.Graphics)
            const peg = new PIXI.Graphics();
            peg.circle(0, 0, PEG_RADIUS);
            peg.fill(0xffffff);
            
            // Добавляем легкое свечение точке
            const glow = new PIXI.Graphics();
            glow.circle(0, 0, PEG_RADIUS + 4);
            glow.fill({ color: 0xffffff, alpha: 0.2 });
            peg.addChild(glow);

            peg.position.set(x, y);
            pegContainer.addChild(peg);

            // Сохраняем математические данные для физики
            // Добавляем смещение контейнера (pegContainer.y)
            pegs.push({ x: x + pegContainer.x, y: y + pegContainer.y, radius: PEG_RADIUS });
        }
    }

    // ==========================================
    // 2. ЯЧЕЙКИ ВНИЗУ (МНОЖИТЕЛИ)
    // ==========================================
// ==========================================
    // 2. ЯЧЕЙКИ ВНИЗУ (СПРАЙТЫ С ТЕКСТОМ)
    // ==========================================
    const slotContainer = new PIXI.Container();
    gameContainer.addChild(slotContainer);

    const multipliers = [128, 10, 5, 2, 1, 2, 5, 10, 128];
    const SLOT_WIDTH = PEG_SPACING_X; 
    // Поднимаем или опускаем линию ячеек здесь (+150 — примерный отступ)
    const SLOT_Y = START_Y + ROWS * PEG_SPACING_Y; 
    const totalSlotsWidth = multipliers.length * SLOT_WIDTH;
    const slotsStartX = GAME_WIDTH / 2 - totalSlotsWidth / 2;

    // Соответствие текстур числам
    const textureMap = {
        128: mul128Tex,
        10:  mul10Tex,
        5:   mul5Tex,
        2:   mul2Tex,
        1:   mu1Tex
    };

    multipliers.forEach((mult, index) => {
        // Вычисляем центр каждой ячейки по X
        const slotX = slotsStartX + index * SLOT_WIDTH + (SLOT_WIDTH / 2);
        
        // Создаем контейнер-группу для ячейки
        const slotGroup = new PIXI.Container();
        slotGroup.position.set(slotX, SLOT_Y);
        slotContainer.addChild(slotGroup);

        // 1. Добавляем спрайт-подложку
        const sprite = new PIXI.Sprite({ texture: textureMap[mult] });
        sprite.anchor.set(0.5);
        sprite.scale.set(0.18);
        
        slotGroup.addChild(sprite);

        if(mult == 1){
            //sprite.y -= 3;
        }

        // 2. Добавляем текст ПОВЕРХ спрайта
        const label = new PIXI.Text({
            text: `x${mult}`, // Пишем "x128", "x10" и т.д.
            style: {
                fontFamily: 'softhyphen',
                fontSize: 28,
                fill: '#ffffff', // Белый цвет
                //stroke: { color: '#000000', width: 6 }, // Черная обводка для читаемости
                align: 'center'
            }
        });
        console.log([...document.fonts].map(f => `${f.family} ${f.weight} ${f.status}`));
        label.anchor.set(0.5);
        label.position.set(0, 0); // Центрируем ровно посередине спрайта
        slotGroup.addChild(label);

        // Сохраняем данные для физики
        // visual: slotGroup — теперь анимация будет двигать и картинку, и текст вместе
        slots.push({ 
            xMin: slotX - SLOT_WIDTH / 2, 
            xMax: slotX + SLOT_WIDTH / 2, 
            y: SLOT_Y, 
            multiplier: mult, 
            visual: slotGroup 
        });
    });

    // ==========================================
    // 3. ФУНКЦИЯ СПАВНА ШАРИКА
    // ==========================================
function dropBall() {
        // 1. Создаем спрайт вместо PIXI.Graphics
        const ball = new PIXI.Sprite({ texture: ballTex });
        
        // 2. Ставим якорь по центру, чтобы физика отскоков работала правильно
        ball.anchor.set(0.5);

        //ball.scale.set(2)
        

        // 3. Подгоняем визуальный размер спрайта под радиус из конфига
        // BALL_RADIUS * 2 — это диаметр шарика
        ball.width = BALL_RADIUS * 2;
        ball.height = BALL_RADIUS * 2;

        // 4. Позиционирование (оставляем твою логику)
        ball.x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 0.1; 
        ball.y = START_Y - 100 + pegContainer.y; 
        
        gameContainer.addChild(ball);

        // 5. Добавляем в массив активных шаров для физического движка
        activeBalls.push({
            sprite: ball, // Теперь здесь хранится спрайт
            x: ball.x,
            y: ball.y,
            vx: (Math.random() - 0.5) * 2, 
            vy: 0,
            radius: BALL_RADIUS,
            isDead: false
        });
    }
    // ==========================================
    // 4. ФИЗИЧЕСКИЙ ДВИЖОК ПЛИНКО
    // ==========================================
   // ==========================================
    // 4. ФИЗИЧЕСКИЙ ДВИЖОК ПЛИНКО
    // ==========================================
    app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;

        for (let i = activeBalls.length - 1; i >= 0; i--) {
            const ball = activeBalls[i];
            if (ball.isDead) continue;

            // Гравитация и Движение
            ball.vy += GRAVITY * dt;
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;
            ball.vx *= 0.99; // Трение воздуха

            // КОЛЛИЗИИ С ТОЧКАМИ
            for (let j = 0; j < pegs.length; j++) {
                const peg = pegs[j];
                const dx = ball.x - peg.x;
                const dy = ball.y - peg.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = ball.radius + peg.radius;

                if (distance < minDistance) {
                    // Выталкиваем шарик из точки
                                        // УМНОЕ УПРАВЛЕНИЕ ЗВУКОМ
                    // ==========================================
                    let soundChance = 0.35;
                    const ballsOnScreen = activeBalls.length;

                    // Логика вероятности:
                    if (ballsOnScreen >= 5) {
                        soundChance = 0.3; // Когда шаров 5-6, играет только 15% ударов (редко)
                    } else if (ballsOnScreen >= 3) {
                        soundChance = 0.3; // В середине — 35% ударов
                    } else {
                        soundChance = 0.3;  // Когда осталось 1-2 шара — почти каждый удар со звуком
                    }

                    // Проверяем удачу
                    if (Math.random() < soundChance) {
                        // Добавляем легкую вариацию громкости, чтобы не долбило в одну точку
                        const randomVol = 0.2 + Math.random() * 0.2; // Громкость от 0.3 до 0.6
                        playSound(pop, randomVol);
                    }
                    const overlap = minDistance - distance;
                    const nx = dx / distance; 
                    const ny = dy / distance; 
                    
                    ball.x += nx * overlap;
                    ball.y += ny * overlap;

                    // Отскок
                    const dotProduct = ball.vx * nx + ball.vy * ny;
                    ball.vx = (ball.vx - 2 * dotProduct * nx) * BOUNCE_DAMPING;
                    ball.vy = (ball.vy - 2 * dotProduct * ny) * BOUNCE_DAMPING;

                    // Плинко-рандом
                    ball.vx += (Math.random() - 0.5) * RANDOM_BOUNCE;
                }
            }

            // === ВОТ ЭТА СТРОЧКА ЗАСТАВЛЯЕТ КАРТИНКУ ПАДАТЬ ===
            ball.sprite.position.set(ball.x, ball.y);

            // ПРОВЕРКА ПОПАДАНИЯ В ЯЧЕЙКУ
// ПРОВЕРКА ПОПАДАНИЯ В ЯЧЕЙКУ
// ПРОВЕРКА ПОПАДАНИЯ В ЯЧЕЙКУ
            if (ball.y >= SLOT_Y) {
                ball.isDead = true;
                playSound(slot);
                
                let landedSlot = null;
                for (let s = 0; s < slots.length; s++) {
                    if (ball.x >= slots[s].xMin && ball.x <= slots[s].xMax) {
                        landedSlot = slots[s];
                        break;
                    }
                }

                if (landedSlot) {
                    // 1. Берем заранее определенную сумму для текущего шарика
                    const winAmount = fixedWins[ballsLanded] || 0;

                    spawnAndFlyFan(moneyTex, { x: 0, y: 0 }, { x: 0, y: -400 }, () => {
                        addMoneyToBalance(winAmount);
                    });
                    
                    // 2. Добавляем её к балансу
                    
                    
                    // 3. Анимация лунки (визуально оставляем, как будто множитель сработал)
                    landedSlot.visual.y = SLOT_Y + 10;
                    setTimeout(() => {
                        if (landedSlot && landedSlot.visual) landedSlot.visual.y = SLOT_Y;
                    }, 100);
                }

                // Считаем упавший шарик
                ballsLanded++;
                
                // Проверяем, не последний ли он
                if (ballsLanded === TOTAL_BALLS) {
                    setTimeout(() => {
                        // Принудительно ставим 2780 в конце, если вдруг были копейки или ошибки округления
                        currentBalance = 2780;
                        addMoneyToBalance(0); // Обновляем текст
                        
                        startFinalSequence();
                    }, 1200);
                }

                ball.sprite.destroy();
                activeBalls.splice(i, 1);
            }
        }
    });

// ==========================================
    // ЛОГИКА ЗАПУСКА И КЛИКОВ
    // ==========================================
    let isGameActive = false; // Флаг: можно ли бросать шарики

    // Настраиваем зону для кликов по Плинко
    app.stage.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);

    PlayButtonSprite.eventMode = 'static';
        PlayButtonSprite.once('pointerdown', async () => {
            if (!isGameActive) return;

            addMoneyToBalance(-100);
            
            // Деактивируем кнопку, чтобы нельзя было нажать второй раз
            isGameActive = false; 
            pressButton(PlayButtonSprite);
            
            // Спавним 6 шариков с задержкой в 300мс
            for (let i = 0; i < TOTAL_BALLS; i++) {
                dropBall();
                ballsDropped++;
                // Если у вас нет функции wait, она обычно выглядит так:
                // const wait = (ms) => new Promise(res => setTimeout(res, ms));
                await wait(1100); 
            }
        });

    // ------------------------------------------
    // ВЫЗОВ ВСТУПИТЕЛЬНОГО ЭКРАНА
    // ------------------------------------------
    // Ждем полсекунды после загрузки и показываем окно
    setTimeout(() => {
        // Передаем текстуру руки (если она есть)
        const handTexture = typeof handTex !== 'undefined' ? handTex : null;
        
        showWelcomePopup(handTexture, () => {
            // ЭТОТ КОД ВЫПОЛНИТСЯ ПОСЛЕ НАЖАТИЯ "COLLECT BONUS"
            
            console.log("БОНУС СОБРАН!");
            addMoneyToBalance(100);// Начисляем стартовый баланс
            
            // Если у тебя есть UI баланса (balanceTex), обнови текст здесь
            // balanceText.text = "€ " + currentBalance;

            let myHand = spawnTutorialHand(PlayButtonSprite.x - 50, PlayButtonSprite.y , 0.4);
            myHand.scale.set(0.1);

            PlayButtonSprite.on("pointerdown" , ()=>{
                myHand.destroy();
            })

            isGameActive = true; // РАЗРЕШАЕМ БРОСАТЬ ШАРИКИ
            app.stage.eventMode = 'static'; // Включаем клики по экрану
        });
    }, 500);


    // ==========================================
// ВСТУПИТЕЛЬНЫЙ ЭКРАН (WELCOME POPUP)
// ==========================================
function showWelcomePopup(handTexture, onCollect) {
    // Включаем сортировку слоев в UI
    uiOverlayContainer.sortableChildren = true;

    const popupContainer = new PIXI.Container();
    popupContainer.zIndex = 200; // Поверх всего
    uiOverlayContainer.addChild(popupContainer);

    // 1. ТЕМНЫЙ ДИММЕР (чтобы текст читался идеально)
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.85 });
    dimmer.eventMode = 'static'; // Блокируем клики по игре на фоне
    popupContainer.addChild(dimmer);

    // 2. ГРУППА КОНТЕНТА (Тексты + Кнопка)
    const contentGroup = new PIXI.Container();
    contentGroup.position.set(0, -100); // Чуть приподнимаем от центра
    popupContainer.addChild(contentGroup);

    // ==========================================
    // ТЕКСТ "FREE TRY"
    // ==========================================
    const freeTryStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen', // Или 'Arial Black' / 'Impact'
        fontSize: 85,
        fill: '#fff133', // Ярко-желтый
        stroke: { color: '#3a0800', width: 14, join: 'round' }, // Темно-бордовая обводка
        dropShadow: { color: '#000000', alpha: 0.8, distance: 10, blur: 0, angle: Math.PI / 2 },
        align: 'center'
    });
    const freeTryText = new PIXI.Text({text: getT('free_try').toUpperCase(), style: freeTryStyle });
    freeTryText.anchor.set(0.5);
    freeTryText.position.set(0, -150);
    contentGroup.addChild(freeTryText);

    // ==========================================
    // ТЕКСТ "€ 100"
    // ==========================================
    const amountStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 230,
        fill: '#ffffff', // Белый
        //stroke: { color: '#681b0a', width: 18, join: 'round' }, // Красно-коричневая обводка
        dropShadow: { color: '#000000', alpha: 0.8, distance: 15, blur: 0, angle: Math.PI / 2 },
        align: 'center'
    });
    const amountText = new PIXI.Text({ text: "€ 100", style: amountStyle });
    amountText.anchor.set(0.5);
    amountText.position.set(0, 40);
    contentGroup.addChild(amountText);

    // ==========================================
    // КНОПКА "COLLECT BONUS"
    // ==========================================


    const btnContainer = new PIXI.Sprite({texture: bonusTex})
    btnContainer.position.set(0 , 300);
    btnContainer.anchor.set(0.5);
    btnContainer.scale.set(1.5);
    //uiOverlayContainer.addChild(logoSprite);

    // Текст внутри кнопки
    const btnTextStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 35,
        fill: '#4a1500', // Темно-коричневый цвет текста
        align: 'center'
    });
    const btnText = new PIXI.Text({ text: getT('collect_bonus').toUpperCase(), style: btnTextStyle });
    btnText.anchor.set(0.5);
    btnText.position.set(0, 0); // Чуть опускаем визуально по центру
    btnContainer.addChild(btnText);


    contentGroup.addChild(btnContainer);

    // Спавним руку над кнопкой Play (координаты можно взять из PlayButtonSprite)
    const myHand = spawnTutorialHand(contentGroup.x - 50, contentGroup.y + 400);

    // ==========================================
    // ТУТОРИАЛ РУКА (Указывает на кнопку)
    // ==========================================


    // ==========================================
    // АНИМАЦИИ
    // ==========================================
    let time = 0;
    contentGroup.scale.set(0); // Стартуем с нуля

    const popupTicker = (ticker) => {
        const dt = ticker.deltaTime / 60;
        time += dt;

        // 1. Анимация вылета "пружинкой" (первые 0.5 сек)
        if (time < 0.5) {
            const t = time / 0.5;
            const ease = 1 - Math.pow(1 - t, 3);
            contentGroup.scale.set(ease * 1.1); // Перелет на 10%
        } else if (time < 0.7) {
            const t = (time - 0.5) / 0.2;
            contentGroup.scale.set(1.1 - (0.1 * t)); // Возврат к 1.0
        }

        // 2. Дыхание кнопки (бесконечно)
    };
    app.ticker.add(popupTicker);

    btnContainer.eventMode = 'static';

    // ==========================================
    // ЛОГИКА КЛИКА ПО КНОПКЕ
    // ==========================================
    btnContainer.once('pointerdown', () => {
        // Проигрываем звук сбора
        // playSound(bonusSound);
            if (myHand && !myHand.destroyed) {
                myHand.destroy();
            }
        
        app.ticker.remove(popupTicker); // Останавливаем анимации
        
        // Красивое закрытие окна
        let closeProgress = 0;
        const closeTicker = (ticker) => {
            closeProgress += ticker.deltaTime / (0.2 * 60);
            if (closeProgress >= 1) {
                app.ticker.remove(closeTicker);
                popupContainer.destroy();
                
                // ВЫЗЫВАЕМ КОЛБЭК, КОТОРЫЙ РАЗРЕШАЕТ ИГРАТЬ!
                if (onCollect) onCollect();
            } else {
                contentGroup.scale.set(1 - closeProgress);
                dimmer.alpha = 0.85 * (1 - closeProgress);
            }
        };
        app.ticker.add(closeTicker);
    });
}

async function startFinalSequence() {
        console.log("ЗАПУСК ФИНАЛА");
        
        // 1. Скрываем нижнюю панель и кнопку (чтобы не мешали телефону)
        uiBotSprite.visible = false;
        PlayButtonSprite.visible = false;

        // 2. Показываем телефонную анимацию (ждем её завершения)
        // Передаем currentBalance, который набрался от 6 шариков
        await new Promise(resolve => {
            showPhoneAnimation(currentBalance, resolve);
        });

        // 3. Небольшая пауза для плавности
        await wait(500);

        // 4. Показываем финальный экран окончания
        showEndScreen();
    }

        /**
         * Плавно добавляет сумму к балансу с эффектом пульсации
         * @param {number} amount - Сколько добавить
         * @param {number} durationSec - Время анимации (в секундах)
         */
        function addMoneyToBalance(amount, durationSec = 0.6) {
            // 1. Увеличиваем логический (реальный) баланс
            currentBalance += amount;
            
            const startValue = visualBalance;
            const targetValue = currentBalance;

            // 2. Если анимация уже идет, останавливаем старый тикер
            if (balanceText._moneyTicker) {
                app.ticker.remove(balanceText._moneyTicker);
            }

            let timeElapsed = 0;
            const baseScale = 0.4; // Базовый масштаб текста (если менял - впиши сюда)

            const ticker = (t) => {
                timeElapsed += t.deltaTime / 60;

                if (timeElapsed >= durationSec) {
                    // ФИНАЛ: Точно устанавливаем целевое значение
                    visualBalance = targetValue;
                    balanceText.text = `€ ${visualBalance.toFixed(2)}`;
                    balanceText.scale.set(baseScale);
                    
                    app.ticker.remove(ticker);
                    balanceText._moneyTicker = null;
                } else {
                    // ПРОЦЕСС: Плавное замедление (Cubic Ease-Out)
                    const progress = timeElapsed / durationSec;
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    
                    visualBalance = startValue + (targetValue - startValue) * easeOut;
                    balanceText.text = `€ ${visualBalance.toFixed(2)}`;
                    
                    // ЭФФЕКТ: Легкое увеличение (пульс) текста в процессе набора
                    // Math.sin даст нам красивый "вздох" текста (увеличился и сдулся обратно)
                    const pulse = Math.sin(progress * Math.PI) * 0.15;
                    balanceText.scale.set(baseScale + pulse);
                }
            };

            // 3. Сохраняем ссылку на тикер и запускаем
            balanceText._moneyTicker = ticker;
            app.ticker.add(ticker);
        }
   
        
/**
 * Создает анимированную руку, указывающую на точку
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @returns {PIXI.Sprite} - Возвращает объект руки
 */
/**
 * @param {number} x
 * @param {number} y
 * @param {number} baseScale - Базовый размер (по умолчанию 0.6)
 */
function spawnTutorialHand(x, y, baseScale = 0.5) {
    const hand = new PIXI.Sprite({ texture: handTex });
    
    hand.anchor.set(0.2, 0.1); 
    hand.position.set(x, y);
    hand.scale.set(baseScale); // Устанавливаем масштаб сразу
    hand.zIndex = 500;
    hand.angle = -35;
    hand.eventMode = 'none';
    
    uiOverlayContainer.addChild(hand);

    let elapsed = 0;
    const handTicker = (ticker) => {
        if (hand.destroyed) return app.ticker.remove(handTicker);
        
        elapsed += ticker.deltaTime / 60;

        // Эффект нажатия: пульсирует относительно ВАШЕГО baseScale
        // (0.08 * baseScale) — чтобы амплитуда пульсации тоже уменьшалась вместе с рукой
        const pulse = Math.sin(elapsed * 8) * (baseScale * 0.08);
        hand.scale.set(baseScale + pulse);

        // Эффект парения: тоже пропорционально размеру
        hand.y = y + Math.sin(elapsed * 8) * (baseScale * 25);
    };
    
    app.ticker.add(handTicker);
    hand.on('destroyed', () => app.ticker.remove(handTicker));

    return hand;
}


/**
 * Анимация веера: вытягивается в сторону цели, уменьшаясь в перспективе, затем "хвост" догоняет перед.
 */
/**
 * Анимация веера: вытягивается в сторону цели, уменьшаясь в перспективе, затем "хвост" догоняет перед.
 */
/**
 * Анимация веера: вытягивается строго по прямой в сторону цели, уменьшаясь в перспективе, 
 * затем "хвост" догоняет перед.
 */
function spawnAndFlyFan(moneyTexture, startPos, targetPos, onComplete) {
    const numBills = 6;
    const bills = [];
    
    // --- БАЗОВЫЙ РАЗМЕР КУПЮРЫ ---
    const BASE_SCALE = 0.13; 
    
    const container = new PIXI.Container();
    container.zIndex = 150;
    uiOverlayContainer.addChild(container);

    const sX = startPos.x;
    const sY = startPos.y;
    const tX = targetPos.x;
    const tY = targetPos.y;

    const dx = tX - sX;
    const dy = tY - sY;
    
    // Угол полета к цели
    const angle = Math.atan2(dy, dx); 
    const totalDistance = Math.sqrt(dx * dx + dy * dy);
    const spreadDistance = totalDistance * 0.65; 

    // Создаем купюры
    for (let i = 0; i < numBills; i++) {
        const bill = new PIXI.Sprite({ texture: moneyTexture });
        bill.anchor.set(0.5);
        bill.scale.set(0);
        bill.position.set(sX, sY);
        // Купюра просто поворачивается "лицом" по направлению полета
        bill.rotation = angle + Math.PI / 2;
        container.addChild(bill);
        bills.push(bill);
    }

    playSound(veer);

    let time = 0;
    const tPop = 0.15;     
    const tSpread = 0.3;  
    const tGather = 0.4;  
    const tTotal = tPop + tSpread + tGather;

    const ticker = (t) => {
        const dt = t.deltaTime / 60;
        time += dt;

        if (time <= tPop) {
            // ФАЗА 1: Появление из центра пружинкой
            const p = time / tPop;
            const ease = p < 1 ? p * p * (3 - 2 * p) * 1.2 : 1;
            
            bills.forEach(b => b.scale.set(ease * BASE_SCALE));
        }
        else if (time <= tPop + tSpread) {
            // ФАЗА 2: Вытягивание веера (СТРОГО ПО ПРЯМОЙ)
            const p = (time - tPop) / tSpread;
            const ease = 1 - Math.pow(1 - p, 3);

            bills.forEach((b, i) => {
                const ratio = i / (numBills - 1);

                // Движемся только по прямой линии (вектору)
                b.x = sX + Math.cos(angle) * spreadDistance * ratio * ease;
                b.y = sY + Math.sin(angle) * spreadDistance * ratio * ease;
                
                // 3D-Эффект (Передние купюры становятся меньше)
                const targetScale = BASE_SCALE * (1.0 - 0.5 * ratio); 
                b.scale.set(BASE_SCALE + (targetScale - BASE_SCALE) * ease);
            });
        }
        else if (time <= tTotal) {
            // ФАЗА 3: Засасывание в баланс
            const p = (time - (tPop + tSpread)) / tGather;
            const ease = p * p; // Ease-In (Ускоряется к концу)

            bills.forEach((b, i) => {
                const ratio = i / (numBills - 1);
                
                // Фиксированная позиция купюры в конце 2-й фазы
                const finalStartX = sX + Math.cos(angle) * spreadDistance * ratio;
                const finalStartY = sY + Math.sin(angle) * spreadDistance * ratio;

                // Летим прямо в цель
                b.x = finalStartX + (tX - finalStartX) * ease;
                b.y = finalStartY + (tY - finalStartY) * ease;

                // Плавно уменьшаются в 0 при попадании в цель
                const startScale = BASE_SCALE * (1.0 - 0.5 * ratio);
                b.scale.set(startScale * (1 - ease));
            });
        }
        else {
            app.ticker.remove(ticker);
            container.destroy();
            if (onComplete) onComplete();
        }
    };
    app.ticker.add(ticker);
}



        
// ==========================================
        // 1. БЕСКОНЕЧНЫЙ ФОН (TILING SPRITE)
        // ==========================================
        // Вместо PIXI.Sprite используем PIXI.TilingSprite
        // Изначально задаем ему размер 100x100, в resize() мы растянем его на весь экран



        
    


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
    const targetZoom = isPortrait ? 3.2 : 2.77; 
    
    // Смещение: самолет должен быть слева от центра экрана на 300px
    const cameraOffsetX = 0; 
    
    let targetX = (predictedX !== null ? predictedX : targetObject.x) - cameraOffsetX; 
    
    // ВАЖНО: Всегда держим камеру по центру оси Y! 
    // Убираем условие isPortrait ? 200 : 0
    let targetY = 0; 

    // --- ЗАЩИТА ОТ КРАЕВ ФОНА ---
    if (typeof backgroundContainer !== 'undefined') {
        const finalScale = Math.min(sw / GAME_WIDTH, sh / GAME_HEIGHT) * targetZoom;
        const halfScreenWidthInWorld = (sw / 2) / finalScale;

        // Края составного фона
        const bgLeftEdge = backgroundContainer.x;
        const bgRightEdge = backgroundContainer.x + backgroundContainer.totalWidth;

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
// ==========================================
// КИНЕМАТОГРАФИЧНАЯ АНИМАЦИЯ ТЕЛЕФОНА
// ==========================================
// ==========================================
// КИНЕМАТОГРАФИЧНАЯ АНИМАЦИЯ ТЕЛЕФОНА
// ==========================================
function showPhoneAnimation(targetAmount, onComplete) {
    // 1. DIMMER (Нижний слой)
    const dimmerContainer = new PIXI.Container();
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.7 });
    dimmer.eventMode = 'static';
    dimmerContainer.addChild(dimmer);
    uiOverlayContainer.addChild(dimmerContainer);

    // 2. КОНТЕНТ (Верхний слой)
    const popupContainer = new PIXI.Container();
    uiOverlayContainer.addChild(popupContainer);

    // 3. КОНТЕЙНЕР ТЕЛЕФОНА
    const phoneGroup = new PIXI.Container();
    popupContainer.addChild(phoneGroup);

    // САМ ТЕЛЕФОН (Первый экран)
    const phoneSprite = new PIXI.Sprite({ texture: phoneTex });
    phoneSprite.anchor.set(0.5);
    phoneSprite.scale.set(1.2); 
    phoneGroup.addChild(phoneSprite);

    // МАСКА ДЛЯ ЭКРАНА ТЕЛЕФОНА (чтобы уведомления не вылезали за края)
    // Рисуем маску, но НЕ добавляем ей fill(), а сразу применяем.
    const phoneScreenMask = new PIXI.Graphics();
    phoneScreenMask.roundRect(-420, -520, 840, 1040, 40); 
    phoneScreenMask.fill(0xffffff); // PIXI требует заливку для маски, но сама маска будет скрыта
    //phoneGroup.addChild(phoneScreenMask);

    // ==========================================
    // ФАЗА 1: ВЫЛЕТ ТЕЛЕФОНА С ВРАЩЕНИЕМ
    // ==========================================
    let appearProgress = 0;
    
    const startX = -800;
    const startY = 1200;
    const startRot = -Math.PI / 4; 
    
    const targetX = 0;
    const targetY = 100; 
    const targetRot = 0;

    phoneGroup.position.set(startX, startY);
    phoneGroup.rotation = startRot;

    const appearTicker = (ticker) => {
        appearProgress += ticker.deltaTime / (0.8 * 60); 

        if (appearProgress >= 1) {
            phoneGroup.position.set(targetX, targetY);
            phoneGroup.rotation = targetRot;
            app.ticker.remove(appearTicker);

            if(!isIronSource){
                showBigPushOnPhone();
                
            }
            else{
                setTimeout(()=>{startWalletPhase()} , 200);
            }
            
            
        } else {
            const ease = 1 - Math.pow(1 - appearProgress, 3); 
            phoneGroup.x = startX + (targetX - startX) * ease;
            phoneGroup.y = startY + (targetY - startY) * ease;
            phoneGroup.rotation = startRot + (targetRot - startRot) * ease;
        }
    };
    app.ticker.add(appearTicker);

    // ==========================================
    // ФАЗА 2: ПУШ ИЗ "ЧЁЛКИ" ТЕЛЕФОНА
    // ==========================================
function showBigPushOnPhone() {
    const pushCont = new PIXI.Container();
    const startPushY = -560;
    const targetPushY = -540;

    pushCont.position.set(0, startPushY);
    phoneGroup.addChild(pushCont);

    // Спрайт вместо нарисованного пуша
    const pushSprite = new PIXI.Sprite({ texture: pushTex });
    pushSprite.anchor.set(0.5);
    pushSprite.scale.set(0.35); // ← настрой размер под свою текстуру
    pushCont.addChild(pushSprite);

    playSound(sms);

    // Анимация выезда из чёлки
    let time = 0;
    const pushTicker = (ticker) => {
        time += ticker.deltaTime / 60;
        

        if (time < 0.3) {
            const p = time / 0.3;
            const ease = p < 1 ? p * p * (3 - 2 * p) * 1.1 : 1;
            pushCont.y = startPushY + (targetPushY - startPushY) * ease;
            
        } else if (time > 1.6 && time < 1.9) {
            const p = (time - 1.6) / 0.3;
            const ease = 1 - Math.pow(1 - p, 3);
            pushCont.y = targetPushY - ((targetPushY - startPushY) * ease);
        } else if (time >= 1.9) {
            app.ticker.remove(pushTicker);
            pushCont.destroy();
            startWalletPhase();
        }
    };
    app.ticker.add(pushTicker);
}

    // ==========================================
    // ФАЗА 3: ПЛАВНОЕ "НАРАСТАНИЕ" ВТОРОГО ЭКРАНА И СЧЕТЧИК
    // ==========================================
    let moneyTicker = null;
    let notifTimer = null;

function startWalletPhase() {
    // 1. ВТОРОЙ ТЕЛЕФОН
    const phoneWalletSprite = new PIXI.Sprite({ texture: phoneWalletTex });
    phoneWalletSprite.anchor.set(0.5);
    phoneWalletSprite.scale.set(1.2); 
    phoneWalletSprite.alpha = 0;
    phoneGroup.addChild(phoneWalletSprite);

    let fadeProgress = 0;
    const fadeTicker = (ticker) => {
        fadeProgress += ticker.deltaTime / (0.5 * 60);
        if (fadeProgress >= 1) {
            app.ticker.remove(fadeTicker);
            phoneWalletSprite.alpha = 1;
            phoneSprite.destroy(); 
        } else {
            phoneWalletSprite.alpha = fadeProgress;
        }
    };
    app.ticker.add(fadeTicker);

    // 2. СЧЕТЧИК ДЕНЕГ
    const moneyStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen', 
        fontSize: 75,
        fill: '#ffffff', 
        dropShadow: { color: '#00aa00', alpha: 0.8, distance: 0, blur: 10 },
        align: 'center'
    });
    
    const moneyText = new PIXI.Text({ text: "0 €", style: moneyStyle });
    moneyText.anchor.set(0.5);
    moneyText.position.set(0, -480); 
    phoneGroup.addChild(moneyText);

    let timeElapsed = 0;
    const fillDuration = 2.5; 

    moneyTicker = (ticker) => {
        timeElapsed += ticker.deltaTime / 60;
        if (timeElapsed < fillDuration) {
            const easeOut = 1 - Math.pow(1 - (timeElapsed / fillDuration), 3);
            moneyText.text = Math.floor(targetAmount * easeOut).toLocaleString('ru-RU') + " €";
            moneyText.scale.set(1 + Math.sin(timeElapsed * 20) * 0.03);
        } else {
            moneyText.text = targetAmount.toLocaleString('ru-RU') + " €";
            moneyText.scale.set(1 + Math.sin(timeElapsed * 5) * 0.01);
        }
    };

    setTimeout(()=>{
        app.ticker.add(moneyTicker);
    } , 1000);
    

    // 3. УВЕДОМЛЕНИЯ — настройки здесь
    const NOTIF_SCALE       = 1.8;   // размер уведомления
    const NOTIF_SPACING     = 150;   // отступ между уведомлениями
    const NOTIF_START_Y     = 150;   // Y первого уведомления (верх стопки)
    const NOTIF_MAX_VISIBLE = 3;     // сколько уведомлений видно одновременно
    const NOTIF_INTERVAL_MS = 1100;  // интервал появления (мс)

    const notifContainer = new PIXI.Container(); // без маски
    phoneGroup.addChild(notifContainer);

    let activeNotifs = [];

    function spawnSmallNotification() {

        const notif = new PIXI.Sprite({ texture: notifTex }); 
        if(activeNotifs.length == 2){
            notif.texture = notif1;

        }
        notif.anchor.set(0.5);
        notif.y = NOTIF_START_Y - 60;
        notif.alpha = 0;
        notif.scale.set(NOTIF_SCALE * 0.7);


        notifContainer.addChild(notif);
        activeNotifs.unshift(notif);

        let moveProgress = 0;
        const startPositions = activeNotifs.map(n => n.y);
        const startAlphas    = activeNotifs.map(n => n.alpha);
        const startScales    = activeNotifs.map(n => n.scale.x);

        const moveTicker = (ticker) => {
            if (notif.destroyed) return app.ticker.remove(moveTicker);

            moveProgress += ticker.deltaTime / 60;

            if (moveProgress >= 1) {
                app.ticker.remove(moveTicker);
                // удаляем лишние уведомления сверх лимита
                while (activeNotifs.length > NOTIF_MAX_VISIBLE) {
                    const old = activeNotifs.pop();
                    old.destroy();
                }
            } else {
                const ease = 1 - Math.pow(1 - moveProgress, 3);
                activeNotifs.forEach((n, index) => {
                    const targetY = NOTIF_START_Y + index * NOTIF_SPACING;
                    n.y = startPositions[index] + (targetY - startPositions[index]) * ease;

                    if (index === 0) {
                        // новое уведомление — появляется и вырастает
                        n.alpha = startAlphas[0] + (1 - startAlphas[0]) * ease;
                        n.scale.set(startScales[0] + (NOTIF_SCALE - startScales[0]) * ease);
                    }
                    if (index >= NOTIF_MAX_VISIBLE - 1) {
                        // последнее в стопке — исчезает
                        n.alpha = 1 - ease;
                    }
                });
            }
        };
        app.ticker.add(moveTicker);
    }

    notifTimer = setInterval(() => {
        spawnSmallNotification();
        playSound(sms);
    }, NOTIF_INTERVAL_MS);

    setTimeout(closePhone, 4000);
}
    // ==========================================
    // ФУНКЦИЯ ЗАКРЫТИЯ
    // ==========================================
    function closePhone() {
        if (moneyTicker) app.ticker.remove(moneyTicker);
        if (notifTimer) clearInterval(notifTimer);
        
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
    }

}


// ==========================================
// ФИНАЛЬНЫЙ ЭКРАН (END CARD)
// ==========================================
function showEndScreen() {
    PlayButtonSprite.visible = false;
    uiBotSprite.visible = false;
    logoSprite.visible = false;
    pegContainer.visible = false;
    balanceSprite.visible = false;
    slotContainer.visible = false;
    uiOverlayContainer.sortableChildren = true;
    const endContainer = new PIXI.Container();
    endContainer.zIndex = 300;
    uiOverlayContainer.addChild(endContainer);

    // 1. ФОНОВЫЙ ДИММЕР (с легким градиентом или просто затемнение)
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.4 });
    dimmer.eventMode = 'static';
    dimmer.on('pointerdown', openStore); // Клик по фону тоже в стор
    endContainer.addChild(dimmer);


    // 3. ИКОНКА ПРИЛОЖЕНИЯ (iconTex)
    const icon = new PIXI.Sprite({ texture: iconTex });
    icon.anchor.set(0.5);
    icon.scale.set(0.6);
    icon.position.set(0, -730);
    // Добавляем скругление иконке через маску
    const iconMask = new PIXI.Graphics();
    iconMask.roundRect(-icon.width/2, -icon.height/2, icon.width, icon.height, 60);
    iconMask.fill(0xffffff);
    icon.addChild(iconMask);
    icon.mask = iconMask;
    endContainer.addChild(icon);

    // 4. ТЕКСТЫ (BONUS, 450 € + 250, FREE SPINS)
    const commonStyle = {
        fontFamily: 'softhyphen',
        align: 'center',
        //stroke: { color: '#000000', width: 8 },
        dropShadow: { color: '#000000', alpha: 0.4, distance: 6, blur: 2 }
    };

    const bonusTxt = new PIXI.Text({ text: getT('bonus').toUpperCase(), style: { ...commonStyle, fontSize: 130, fill: '#fff133' } });
    bonusTxt.anchor.set(0.5);
    bonusTxt.position.set(0, -180);
    endContainer.addChild(bonusTxt);

    const amountTxt = new PIXI.Text({ text: "450 € + 250", style: { ...commonStyle, fontSize: 150, fill: '#ffffff' } });
    amountTxt.anchor.set(0.5);
    amountTxt.position.set(0, -30);
    endContainer.addChild(amountTxt);

    const spinsTxt = new PIXI.Text({ text: getT('free_spins').toUpperCase(), style: { ...commonStyle, fontSize: 85, fill: '#fff133' } });
    spinsTxt.anchor.set(0.5);
    spinsTxt.position.set(0, 110);
    endContainer.addChild(spinsTxt);

// ==========================================
    // 5. ЗОЛОТЫЕ МОНЕТЫ ВНИЗУ (БЕСШОВНЫЕ)
    // ==========================================
    const goldContainer = new PIXI.Container();
    endContainer.addChild(goldContainer);

    const goldBaseScale = 2.2;
    // Вычисляем реальную ширину одного спрайта после масштабирования
    const goldWidth = goldTex.width * goldBaseScale;

    // Создаем 3 части: Левая, Центральная, Правая
    for (let i = -1; i <= 1; i++) {
        const goldPart = new PIXI.Sprite({ texture: goldTex });
        goldPart.anchor.set(0.5, 1); // Якорь снизу по центру
        goldPart.scale.set(goldBaseScale);
        
        // Ставим части встык: -goldWidth, 0, goldWidth
        goldPart.x = i * goldWidth;

        // Зеркалим левую и правую части, чтобы швы исчезли
        if (i !== 0) {
            goldPart.scale.x *= -1;
        }

        goldContainer.addChild(goldPart);
    }

    // ==========================================
    // 6. КНОПКА INSTALL С НЕОНОВОЙ ОБВОДКОЙ
    // ==========================================
    const btnGroup = new PIXI.Container();
    btnGroup.position.set(0, 650);
    btnGroup.eventMode = 'static';
    btnGroup.cursor = 'pointer';
    btnGroup.on('pointerdown', openStore);
    endContainer.addChild(btnGroup);

    // Синее тело кнопки
    const btnBase = new PIXI.Graphics();
    btnBase.roundRect(-350, -85, 700, 170, 35);
    btnBase.fill({ color: '#448aff' });
    btnBase.stroke({ color: '#2962ff', width: 4 });
    btnGroup.addChild(btnBase);

    // --- БЕГАЮЩИЙ НЕОНОВЫЙ СВЕТ ---
    const neonContainer = new PIXI.Container();
    btnGroup.addChild(neonContainer);

    // Рисуем саму рамку-путь (розовая)
    const neonPath = new PIXI.Graphics();
    neonPath.roundRect(-358, -93, 716, 186, 40);
    neonPath.stroke({ color: '#ff4081', width: 12 });
    neonContainer.addChild(neonPath);

    // Создаем "бегунок" (градиентный круг, который будет ездить по кругу)
    const runner = new PIXI.Graphics();
    runner.circle(0, 0, 150);
    runner.fill({ color: 0xcc44ff, alpha: 1 }); // ← фиолетовый вместо белого
    runner.blendMode = 'add';
    neonContainer.addChild(runner);
    runner.mask = neonPath;

    // Текст на кнопке
    const installTxt = new PIXI.Text({ 
        text: getT("install").toUpperCase(), 
        style: { fontFamily: 'softhyphen', fontSize: 75, fill: '#ffffff', stroke: { color: '#1a237e', width: 6 } } 
    });
    installTxt.anchor.set(0.5);
    btnGroup.addChild(installTxt);

    // ==========================================
    // АНИМАЦИИ (Тикер)
    // ==========================================
    let elapsed = 0;
    const endTicker = (ticker) => {
        const dt = ticker.deltaTime / 60;
        elapsed += dt;

        // 1. Бегающий неон по периметру
        // Простая математика круга, растянутого под прямоугольник
        runner.x = Math.cos(elapsed * 4) * 380;
        runner.y = Math.sin(elapsed * 4) * 110;

        // 2. Шатание (wobble) кнопки
        btnGroup.rotation = Math.sin(elapsed * 3) * 0.02;
        btnGroup.scale.set(1 + Math.sin(elapsed * 4) * 0.03);

        // 3. Золото внизу чуть подрагивает (блестит)
        //goldBottom.scale.x = 2.2 + Math.sin(elapsed * 2) * 0.02;
    };
    app.ticker.add(endTicker);

    // 7. АДАПТИВ ДЛЯ ЭКРАНА
    const onEndResize = () => {
        const sh = window.innerHeight;
        const uiScale = uiOverlayContainer.scale.y;
        const halfH = (sh / 2) / uiScale;

        // Прижимаем золото к самому низу
        goldContainer.y = halfH;
        
        // Масштабируем весь контент, чтобы влез по ширине на узких экранах
        const sw = window.innerWidth;
        const targetW = sw / uiScale;
        if (targetW < 1000) {
            const s = targetW / 1000;
            icon.scale.set(1.2 * s);
            amountTxt.scale.set(s);
            bonusTxt.scale.set(s);
            spinsTxt.scale.set(s);
            btnGroup.scale.set(s);
        }
    };
    window.addEventListener('resize', onEndResize);
    onEndResize();
}

        // ==========================================
        // RESIZE / АДАПТИВ
        // ==========================================
// ==========================================
        // RESIZE / АДАПТИВ
        // ==========================================
        function resize() {
            const sw = window.innerWidth + 4;
            const sh = window.innerHeight + 4;
            app.renderer.resize(sw, sh);

            // Базовый зум для вписывания игры в экран (Contain)
            const baseZoom = Math.min(sw / GAME_WIDTH, sh / GAME_HEIGHT);
            const finalScale = baseZoom * cameraZoom;

            // 1. ИГРОВЫЕ СЛОИ 
            cameraLayers.forEach(layer => {
                layer.scale.set(finalScale);
                layer.position.set(
                    sw / 2 - (cameraX * finalScale * layer.parallaxFactor),
                    sh / 2 - (cameraY * finalScale * layer.parallaxFactor)
                );
            });

            // 2. UI СЛОЙ
            let uiScale = sh / GAME_HEIGHT;
            const ar = sw / sh;
            if (ar < 0.53) uiScale *= (ar / 0.53);

            uiOverlayContainer.scale.set(uiScale);
            uiOverlayContainer.position.set(sw / 2, sh / 2);

            // ==========================================
            // ПРИВЯЗКА К КРАЯМ ЭКРАНА
            // ==========================================
            // ВЫЧИСЛЯЕМ ПОЛОВИНУ ВИДИМОЙ ВЫСОТЫ (Локальный низ контейнера)
            const halfH = (sh / 2) / uiScale;

            // Привязываем элементы к низу (halfH - это самый нижний пиксель экрана)
            // Отнимаем нужное количество пикселей, чтобы приподнять их над краем
            
            // Подложка: приподнимаем на 190 пикселей от низа
            uiBotSprite.position.set(0, halfH - 170);
            
            // Кнопка Play: приподнимаем на 180 пикселей от низа (чуть ниже центра подложки)
            PlayButtonSprite.position.set(0, halfH - 170);


            if (typeof disclaimerTxt !== 'undefined' && disclaimerTxt) {
                // Ставим в самый низ и отступаем 15 пикселей вверх
                disclaimerTxt.position.set(0, halfH - 15);
            }
            
            // Если у тебя логотип сверху, его можно привязать к верху (-halfH):
            // logoSprite.position.set(0, -halfH + 120);
        }
        

        window.addEventListener('resize', resize);
        resize();


    } catch (e) {
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