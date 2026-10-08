import './style.css';
import * as PIXI from 'pixi.js';
import bgIMG from './assets/background.webp';
import planeIMG from './assets/Plane.png';
import shipIMG from './assets/ship.png';
import cloudIMG from './assets/cloud.webp';
import phoneIMG from './assets/phone.webp';
import notifyIMG from './assets/notify.png';
import endIslandIMG from './assets/endIsland.webp';
import rocketIMG from './assets/rocket.png';
import flyButtonIMG from './assets/flyButton.png';
import endButtonIMG from './assets/endButton.webp';
import logoIMG from './assets/logo.png';
import bonus from './assets/bonus.mp3';
import explosion from './assets/Explosion.mp3';
import win from './assets/win.mp3';
import sms from './assets/sms.mp3';
import samolet from './assets/samolet.mp3';
import wrong from './assets/wrong.mp3';

// ==========================================
// ГЛОБАЛЬНАЯ РАЗБЛОКИРОВКА АУДИО (iOS / Android)
// ==========================================
let isAudioUnlocked = false;

function unlockAudioOnFirstTouch() {
    if (isAudioUnlocked) return;
    const silentAudio = new Audio();
    silentAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    silentAudio.play().then(() => {
        isAudioUnlocked = true;
        document.removeEventListener('touchstart', unlockAudioOnFirstTouch, true);
        document.removeEventListener('touchend', unlockAudioOnFirstTouch, true);
        document.removeEventListener('click', unlockAudioOnFirstTouch, true);
    }).catch(() => {});
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


        const [bgTex , planeTex , shipTex, cloud1Tex , phoneTex , notifTex , endIslandTex , rocketTex , flyButtonTex , endButtonTex , logoTex] = await Promise.all([
            loadTextureDirectly(bgIMG),
            loadTextureDirectly(planeIMG),
            loadTextureDirectly(shipIMG),
            loadTextureDirectly(cloudIMG),
            loadTextureDirectly(phoneIMG),
            loadTextureDirectly(notifyIMG),
            loadTextureDirectly(endIslandIMG),
            loadTextureDirectly(rocketIMG),
            loadTextureDirectly(flyButtonIMG),
            loadTextureDirectly(endButtonIMG),
            loadTextureDirectly(logoIMG)
            //loadTextureDirectly(PLAYER_IMG),
        ]);

        // ------------------------------------------
        // КАМЕРА
        // ------------------------------------------
        let cameraX    = 0;
        let cameraY    = 0;
        let cameraZoom = 5.5;
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


        
// ==========================================
        // 1. БЕСКОНЕЧНЫЙ ФОН (TILING SPRITE)
        // ==========================================
        // Вместо PIXI.Sprite используем PIXI.TilingSprite
        // Изначально задаем ему размер 100x100, в resize() мы растянем его на весь экран

        const boomFrames = import.meta.glob('./assets/Boom/*.webp', { eager: true, import: 'default' });
        const effectFrames = import.meta.glob('./assets/Effect/*.webp', { eager: true, import: 'default' });


        const animBoom = await createAnimFromFolder(boomFrames, 0.4, true);
        const animEffect = await createAnimFromFolder(effectFrames, 0.4, true);

// ==========================================
        // БЕСШОВНЫЙ ФОН ЧЕРЕЗ ОТЗЕРКАЛИВАНИЕ (A -> B -> A -> B)
        // ==========================================
        
        // Создаем контейнер, который будет вести себя как один большой фон
        const backgroundContainer = new PIXI.Container();
        
        // Ставим контейнер в начальную точку (где раньше был TilingSprite)
        backgroundContainer.position.set(0, 0);
        
        // Добавляем в игру на самый задний план
        gameContainer.addChildAt(backgroundContainer, 0);

        const count = 5; // Сколько раз повторяем фон
        const bgWidth = bgTex.width; // Ширина одной картинки фона (твое значение)
        
        for (let i = 0; i < count; i++) {
            const bgPiece = new PIXI.Sprite({ texture: bgTex });
            
            // ВАЖНО: Якорь ставим строго слева (0) по X, чтобы было удобно стыковать
            bgPiece.anchor.set(0, 0.5); 
            
            // Ставим кусок ровно за предыдущим
            bgPiece.position.set(i * bgWidth, 0);

            // МАГИЯ ОТЗЕРКАЛИВАНИЯ:
            // Если индекс нечетный (1, 3, 5...), переворачиваем картинку по горизонтали!
            if (i % 2 !== 0) {
                // Переворачиваем (Scale X = -1)
                bgPiece.scale.x = -1;
                // Так как мы перевернули картинку, её левый край уехал вправо.
                // Нам нужно сдвинуть её обратно на ширину картинки, чтобы она встала встык!
                bgPiece.position.x += bgWidth; 
            }
            
            backgroundContainer.addChild(bgPiece);
        }

        // Сохраняем общую ширину в сам контейнер, чтобы "Умная камера" знала, где край мира!
        backgroundContainer.totalWidth = bgWidth * count;

        // 1. Изначальный баланс
        let currentBalance = 100;

        // 2. Массив значений баланса после каждой из 13 точек (строго по твоему списку)
        const balanceHistory = [
            300,   // pt 1 (+2)
            600,   // pt 2 (x2)
            900,   // pt 3 (+3)
            1900,  // pt 4 (+10)
            850,   // pt 5 (🚀)
            1900,  // pt 6 (x2)
            2200,  // pt 7 (+3)
            2500,  // pt 8 (+3)
            5000,  // pt 9 (x2)
            10000, // pt 10 (x2)
            10300, // pt 11 (+3)
            5150,  // pt 12 (/2)
            10300  // pt 13 (x2)
        ];

        // 3. Создаем текст над самолетом
        const moneyTextStyle = new PIXI.TextStyle({
            fontFamily: 'LuckiestGuy', 
            fontSize: 44,
            fontWeight: 'bold',
            letterSpacing : 5,
            fill: '#ffe602', // Желтый/Золотой
            stroke: { color: '#000000', width: 5 },
            //dropShadow: { color: '#000000', blur: 4, distance: 2 }
        });

        const planeMoneyText = new PIXI.Text({ text: currentBalance + " EUR", style: moneyTextStyle });
        planeMoneyText.anchor.set(0.5, 0.5); // Якорь снизу по центру
        planeMoneyText.zIndex = 20; // Поверх всего
        planeMoneyText.position.set(0 , -110);
        


        const plane = new PIXI.Sprite({ texture: planeTex});
        plane.anchor.set(0.5); 
        plane.scale.set(0.35)         // якорь по центру
        plane.position.set(60, 180);
        plane.angle = -20; 
        
        plane.addChild(planeMoneyText);// центр мира
        

        const ship = new PIXI.Sprite({ texture: shipTex});
        ship.anchor.set(0.5);
        ship.scale.set(0.3)        // якорь по центру
        ship.position.set(200, 210);       // центр мира
        gameContainer.addChild(ship);
        gameContainer.addChild(plane);


        const endIsland = new PIXI.Sprite({ texture: endIslandTex});
        endIsland.anchor.set(0.5);
        endIsland.scale.set(0.3)        // якорь по центру
        endIsland.position.set(5300, 140);
        gameContainer.addChild(endIsland);      // центр мира
        gameContainer.addChild(ship);
        gameContainer.addChild(plane);

        const flyTextStyle = new PIXI.TextStyle({
            fontFamily: 'softhyphen', 
            fontSize: 64,
            fontWeight: 'bold',
            fill: '#ffffff', // Желтый/Золотой
            //stroke: { color: '#000000', width: 5 },
            align: 'center', // Центрирует строки друг относительно друга
            dropShadow: { color: '#000000', blur: 4, distance: 2 }
        });


        const flyButton = new PIXI.Sprite({ texture: flyButtonTex });
        flyButton.anchor.set(0.5); 
        flyButton.zIndex = 20;
        flyButton.scale.set(2);
        flyButton.eventMode = "static";
        uiOverlayContainer.addChild(flyButton);

        const flyText = new PIXI.Text({text: getT("fly").toUpperCase(), style: flyTextStyle });
        flyText.anchor.set(0.5, 0.5); // Якорь снизу по центру
        flyText.zIndex = 20; // Поверх всего
        flyText.position.set(0 , -3);

        flyButton.addChild(flyText);





        const endButton = new PIXI.Sprite({ texture: endButtonTex });
        endButton.anchor.set(0.5);
        endButton.zIndex = 20;
        endButton.scale.set(0.4);
        endButton.eventMode = "none";
        endButton.visible = false;
        uiOverlayContainer.addChild(endButton);
        const rawRewardText = getT("take_reward").toUpperCase();

        // 2. Ищем ПОСЛЕДНИЙ пробел и меняем его на перенос строки (\n)
        const formattedRewardText = rawRewardText.replace(/ ([^ ]+)$/, '\n$1');

        // 3. Создаем текст
        const rewardText = new PIXI.Text({ 
            text: formattedRewardText, 
            style: flyTextStyle 
        });
        rewardText.scale.set(2.5);
        endButton.zIndex = 10;
        
        rewardText.anchor.set(0.5, 0.5); // Якорь снизу по центру
        rewardText.position.set(0 , -3);

        endButton.addChild(rewardText);

        const logo = new PIXI.Sprite({ texture: logoTex });
        logo.anchor.set(0.5);
        logo.zIndex = 20;
        logo.scale.set(1);
        logo.alpha = 0.8;
        uiOverlayContainer.addChild(logo);
        


        
        


        // ==========================================
        // ГЛОБАЛЬНОЕ СЛЕЖЕНИЕ КАМЕРЫ (Всегда активно)
        // ==========================================
        app.ticker.add(() => {
            if (plane && !plane.destroyed) {
                // Вызываем фокус камеры каждый кадр
                // instant = true, потому что тикер и так дает плавность
                focusCameraOnTarget(plane, true);
            }
        });

        // Изначальный баланс

        // СОСТОЯНИЯ И ФИЗИКА FLAPPY BIRD
        let gameState = 'START'; // Возможные варианты: 'START', 'TAKEOFF', 'PLAYING', 'GAMEOVER'
        let planeVelocityY = 0; 
        const GRAVITY = 0.45;    
        const LIFT = -10;        // Сила прыжка 
        const FORWARD_SPEED = 7; 
        const FLOOR_Y = 120;     
        const CEILING_Y = -600;  

        // Массив для хранения объектов, которые можно собрать

        //player = plane; 

        // 2. РАССТАВЛЯЕМ МАРШРУТ (Waypoints)
        // Ты можешь ставить их как угодно! Самолет всегда будет долетать до следующей.
// ==========================================
        // УМНЫЙ МАРШРУТ САМОЛЕТА (Кинематографичная физика)
        // ==========================================
        const flightPath = [
            // 1. Старт (Разгон)
            // Лететь близко (X: 0 -> 600, Y: 0). Дуга небольшая.
            { x: 600,  y: 0,    duration: 1, boostHeight: -100, rotationSpeed: 5 },  
            
            // 2. Короткий рывок вперед
            // X: 600 -> 800. Очень быстро, маленькая дуга.
            { x: 800,  y: 0,    duration: 0.6, boostHeight: 30,  rotationSpeed: 5 },  
            
            // 3. Крутой подъем!
            // X: 800 -> 1000, Y: 0 -> -150. Летим вверх! Сильный буст.
            { x: 1000, y: -150, duration: 0.6, boostHeight: -50, rotationSpeed: 5},  
            
            // 4. Плавное снижение
            // X: 1000 -> 1200, Y: -150 -> -50. Самолет падает. Буст слабенький.
            { x: 1200, y: -50,  duration: 0.5, boostHeight: 10,  rotationSpeed: 5 },

            // 5. Снова вверх
            // Y: -50 -> -180.
            { x: 1400, y: -180, duration: 0.5, boostHeight: 60, rotationSpeed: 1.2 },

            // 6. Дооооолгое падение (Пике)
            // X: 1400 -> 1800 (400px), Y: -180 -> 40 (вниз на 220px).
            // Долгий полет, отрицательный буст даст красивое провисание "брюхом"!
            { x: 1800, y: 40,   duration: 1, boostHeight: -10, rotationSpeed: 1.08 },

            // 7. Долгий ровный пролет над землей
            // X: 1800 -> 2300 (500px), Y: 40 -> 40.
            // Планируем, дуга очень мягкая и плавная.
            { x: 2300, y: 40,   duration: 0.95, boostHeight: 10, rotationSpeed: 1.05 },

            // 8. Резкий взмыв в небо
            // X: 2300 -> 2700, Y: 40 -> -170. Сильный прыжок!
            { x: 2700, y: -170, duration: 0.65, boostHeight: 10, rotationSpeed: 0.25 },

            // 9. Долгий полет высоко в небе
            // X: 2700 -> 3200 (500px), Y: -170 -> -210.
            { x: 3200, y: -210, duration: 0.7, boostHeight: -100, rotationSpeed: 0.08 },

            // 10. Плавный подъем еще выше
            // Y: -210 -> -270.
            { x: 3500, y: -270, duration: 0.45, boostHeight: 10, rotationSpeed: 0.15 },

            // 11. Затяжное падение вниз (Свечой)
            // X: 3500 -> 4100 (600px), Y: -270 -> -100 (Вниз на 170px).
            // Делаем отрицательный буст для тяжелого падения
            { x: 4100, y: -100, duration: 1.1, boostHeight: -10, rotationSpeed: 0.1 },

            // 12. Короткий отскок от земли
            // X: 4100 -> 4200 (Всего 100px!), Y: -100 -> -160.
            // Это должна быть резкая, молниеносная реакция (0.2 сек)
            { x: 4300, y: -160, duration: 0.35, boostHeight: -10, rotationSpeed: 1.4 },

            // 13. ФИНИШ! Глубоко внизу
            // X: 4200 -> 4600 (400px), Y: -160 -> -10. Падаем в победную точку!
            { x: 4600, y: -10,  duration: 0.5, boostHeight: -20,  rotationSpeed: 1.1 }
        ];
                // ДЛЯ УДОБСТВА: Нарисуем эти точки на экране, чтобы ты видел, куда он летит
        // ==========================================
        // ЧЕКПОИНТЫ С МНОЖИТЕЛЯМИ

// ==========================================
        // ЧЕКПОИНТЫ (Минималистичный дизайн)
        // ==========================================
        const checkpointLabels = [
            '+2',  // точка 1
            'x2',  // точка 2
            '+3',  // точка 3
            '+10', // точка 4
            '🚀',  // точка 5
            'x2',  // точка 6
            '+3',  // точка 7
            '+3',  // точка 8
            'x2',  // точка 9
            'x2',  // точка 10
            '+3',  // точка 11
            '/2',  // точка 12
            'x2',  // точка 13
        ];

        // Обязательно создаем массив, чтобы мы могли удалять их при сборе самолетом
        const checkpointObjects = [];

        flightPath.forEach((pt, index) => {
            const label = checkpointLabels[index] ?? String(index + 1);

            const isRocket = label === '🚀';
            const isPenalty = label.startsWith('/');

            let displayObject;

            if (isRocket) {
                // --- РАКЕТА ---
                // Используем картинку. Если у ракеты есть огонь сзади, он уже нарисован.
                displayObject = new PIXI.Sprite({ texture: rocketTex });
                displayObject.anchor.set(0.5);
                // Подгони размер, чтобы она не была гигантской
                displayObject.scale.set(0.2); 
                
                // На скрине ракеты летят ровно влево, поэтому не наклоняем
                displayObject.rotation = 0; 
                
            } else {
                // --- МНОЖИТЕЛИ И ПЛЮСЫ (Плоский текст) ---
                // На скрине: x2, +3 - белые. /2 - красные. Без градиентов!
                const fillColor = isPenalty ? '#ff4444' : '#ffffff';
                
                displayObject = new PIXI.Text({
                    text: label,
                    style: {
                        fontFamily: 'softhyphen', // Поменяй на 'Arial Black', если нужно толще
                        fontSize: isPenalty ? 35 : 25, // Очень аккуратный размер
                        fontWeight: '900', // Максимально жирный (Extra Bold)
                        fill: fillColor,
                        // На скрине обводка темно-серая/черная, без размытых теней
                        stroke: { color: '#222222', width: 6 }, 
                        align: 'center'
                    }
                });
                displayObject.anchor.set(0.5);
            }

            // Ставим объект на точку маршрута
            displayObject.position.set(pt.x, pt.y);
            // Ставим поверх облаков, но под самолетом
            displayObject.zIndex = 5; 

            //gameContainer.addChild(displayObject);

            // Сохраняем в массив, чтобы можно было с ним взаимодействовать
            checkpointObjects.push(displayObject);
        });

                // ==========================================
        // ОБЪЕКТЫ НА КАРТЕ
        // ==========================================

        // Типы объектов:
        // 'cloud1'   — облако тип 1
        // 'cloud2'   — облако тип 2  
        // 'rocket'   — ракета
        // 'bonus_10' — коэффициент +10
        // 'bonus_x2' — коэффициент x2
        // 'bonus_4'  — коэффициент +4
        // 'bonus_3'  — коэффициент +3
        // 'bonus_d2' — коэффициент /2

// ==========================================
        // ОБЪЕКТЫ НА КАРТЕ (Органичная расстановка)
        // ==========================================

const mapObjects = [
    // ==========================================
    // ЗОНА 1: ВЗЛЕТ И НАЧАЛО (X: 0 -> 1200)
    // Самолет только оторвался, даем первые легкие бонусы
    // ==========================================
    { type: 'cloud2',   x: 100,  y: 50  },
    { type: 'cloud2',   x: 160,  y: -100  },
    { type: 'cloud2',   x: 270,  y: -280  },
    { type: 'cloud1',   x: 700,  y: -250 },
    { type: 'bonus_3',  x: 600,  y: -100 },
    { type: 'bonus_x2', x: 900,  y: -200 }, // Первый серьезный множитель после взлета
    { type: 'cloud2',   x: 800,  y: 150  },
    { type: 'bonus_4',  x: 950,  y: -50  },
    { type: 'bonus_10', x: 1100, y: -250 }, // Высоко в небе
    { type: 'rocket',   x: 1200, y: 250   },
    { type: 'cloud2',   x: 1000, y: -170  },
    { type: 'bonus_4',  x: 650,  y: -150  },
    { type: 'cloud2',   x: 1300, y: -100  },
    

    // ==========================================
    // ЗОНА 2: ПЕРВАЯ "ВОЛНА" (X: 1200 -> 2200)
    // Расставляем объекты "зигзагом"
    // ==========================================
    { type: 'bonus_x2', x: 1350, y: -350 }, // Вверху
    { type: 'bonus_d2', x: 1400, y: 50   }, // Внизу (ловушка)
    { type: 'cloud1',   x: 1500, y: -500 },
    { type: 'cloud2',   x: 1100, y: -130  },
    { type: 'cloud2',   x: 2300, y: -130  },
    { type: 'cloud2',   x: 1500, y: -170  },
    { type: 'bonus_10', x: 1600, y: -150 },
    { type: 'bonus_x2', x: 1750, y: -50  }, 
    { type: 'rocket',   x: 1850, y: -400 },
    { type: 'bonus_4',  x: 1950, y: -450 },
    { type: 'bonus_10', x: 2100, y: 100  }, // Рискованный бонус у земли
    { type: 'bonus_x2', x: 2200, y: -250 },

    // ==========================================
    // ЗОНА 3: ОПАСНЫЙ УЧАСТОК (X: 2200 -> 3200)
    // Много ракет, но в центре — жирные иксы
    // ==========================================
    { type: 'cloud2',   x: 2300, y: 100  },
    { type: 'rocket',   x: 2400, y: -100 },
    { type: 'bonus_x2', x: 2500, y: -280 }, // Цель!
    { type: 'rocket',   x: 2600, y: -450 },
    { type: 'bonus_10', x: 2750, y: -50  },
    { type: 'bonus_x2', x: 2900, y: -350 },
    { type: 'bonus_d2', x: 3000, y: -150 },
    { type: 'cloud1',   x: 3600, y: 200  },
    { type: 'cloud2',   x: 3500, y: -170  },
    { type: 'bonus_10', x: 3100, y: -400 },
    { type: 'cloud1',   x: 3200, y: 100  },

    // ==========================================
    // ЗОНА 4: КОРИДОР МНОЖИТЕЛЕЙ (X: 3200 -> 4200)
    // Идеальное место, чтобы "набить" баланс
    // ==========================================
    { type: 'bonus_x2', x: 3350, y: -100 },
    { type: 'bonus_x2', x: 3500, y: -300 },
    { type: 'bonus_x2', x: 3650, y: -150 },
    { type: 'cloud2',   x: 3700, y: -170  },
    { type: 'bonus_10', x: 3800, y: -50  },
    { type: 'bonus_x2', x: 3950, y: -350 },
    { type: 'bonus_10', x: 4200, y: -50  },
    { type: 'bonus_x2', x: 2950, y: -250 },
    { type: 'bonus_4',  x: 4050, y: 0    },
    { type: 'bonus_10', x: 4150, y: -250 },
    { type: 'rocket',   x: 4200, y: -500 },

    // ==========================================
    // ЗОНА 5: ПРЕДФИНАЛЬНЫЙ ТРЮК (X: 4200 -> 4800)
    // Резкие перепады высоты
    // ==========================================
    { type: 'cloud2',   x: 4300, y: -100  },
    { type: 'bonus_d2', x: 4400, y: -100 }, 
    { type: 'bonus_d2', x: 3700, y: -400 }, 
    { type: 'bonus_x2', x: 4500, y: -450 }, // Очень высоко!
    { type: 'bonus_x2', x: 4650, y: 50   }, // Очень низко!
    { type: 'bonus_10', x: 4750, y: -250 },
    { type: 'cloud1',   x: 4800, y: -550 },

    // ==========================================
    // ФИНАЛЬНАЯ ПРЯМАЯ: ГРАД БОНУСОВ (X: 4800 -> 5300)
    // Максимальная плотность перед островом
    // ==========================================
    { type: 'bonus_x2', x: 4850, y: -150 },
    { type: 'bonus_10', x: 4920, y: -300 },
    { type: 'bonus_x2', x: 5000, y: -100 },
    { type: 'bonus_10', x: 5080, y: -400 },
    { type: 'bonus_x2', x: 5150, y: -200 },
    { type: 'bonus_4',  x: 5220, y: -50  },
    { type: 'rocket',   x: 5280, y: -350 }, // Последнее препятствие

    // Декоративные облака за финишем
    { type: 'cloud1',   x: 5400, y: -200 },
    { type: 'cloud2',   x: 5600, y: -250 },
    { type: 'cloud1',   x: 5800, y: -100 }
];

        // Рендер объектов (заглушки — замени на свои текстуры)
        const objectColors = {
            cloud1:   0xffffff,
            cloud2:   0xddddff,
            rocket:   0xff6600,
            bonus_10: 0xffdd00,
            bonus_x2: 0xff00ff,
            bonus_4:  0x00ffff,
            bonus_3:  0x00ff88,
            bonus_d2: 0xff4444,
        };

        const objectLabels = {
            cloud1:   '☁',
            cloud2:   '☁',
            rocket:   '🚀',
            bonus_10: '+10',
            bonus_x2: 'x2',
            bonus_4:  '+4',
            bonus_3:  '+3',
            bonus_d2: '/2',
        };

        // Включаем сортировку, чтобы облака были позади, а бонусы впереди
// Включаем сортировку по слоям (чтобы облака всегда были позади)
        gameContainer.sortableChildren = true;

// ОБЯЗАТЕЛЬНО: объявляем массив ПЕРЕД циклом
        const collectibleItems = []; 

        gameContainer.sortableChildren = true;

        mapObjects.forEach(obj => {
            const container = new PIXI.Container();
            container.position.set(obj.x, obj.y);

            const isCloud  = obj.type.startsWith('cloud');
            const isBonus  = obj.type.startsWith('bonus');
            const isRocket = obj.type === 'rocket';

            // 1. КАРТИНКИ (Облака и Ракеты)
            if (isCloud || isRocket) {
                let texToUse = cloud1Tex; 
                if (obj.type === 'cloud2' && typeof cloud2Tex !== 'undefined') texToUse = cloud2Tex;
                if (isRocket) texToUse = rocketTex; 

                const sprite = new PIXI.Sprite({ texture: texToUse });
                sprite.anchor.set(0.5);

                if (isCloud) {
                    sprite.scale.set(0.05);
                    sprite.alpha = 1.0; 
                    container.zIndex = 1; 
                } else if (isRocket) {
                    sprite.scale.set(0.2); 
                    sprite.rotation = 0; 
                    container.zIndex = 1; 
                }

                container.addChild(sprite);
            }

            // 2. БОНУСЫ (Плоский текст)
            if (isBonus) {
                const val = obj.type.split('_')[1];
                let textStr = "";
                let isPenalty = false;
                
                if (val === 'x2') {
                    textStr = 'x2';
                } else if (val === 'd2') {
                    textStr = '/2';
                    isPenalty = true; 
                } else {
                    textStr = '+' + val; 
                }

                const fillColor = isPenalty ? '#ff4444' : '#ffffff';
                
                const label = new PIXI.Text({
                    text: textStr,
                    style: {
                        fontFamily: 'LuckiestGuy', 
                        fontSize: isPenalty ? 35 : 25,
                        fontWeight: '900',
                        fill: fillColor,
                        stroke: { color: '#222222', width: 6 },
                        align: 'center'
                    }
                });
                
                label.anchor.set(0.5);
                container.addChild(label);
                container.zIndex = 1; 
            }

            // === САМОЕ ВАЖНОЕ: ЗАПИСЫВАЕМ В МАССИВ ДЛЯ КОЛЛИЗИЙ ===
            // Сохраняем только бонусы и ракеты (облака собирать не нужно)
            if (isBonus || isRocket) {
                collectibleItems.push({
                    sprite: container, // Сам объект на сцене
                    type: obj.type,    // Тип (чтобы знать, что дать игроку)
                    collected: false   // Флаг, что еще не собрали
                });
            }

            gameContainer.addChild(container);
        });


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
/**
 * Автоматический перелет самолета с учетом индивидуальных настроек каждой точки
 * @param {PIXI.Sprite} plane - Объект самолета
 * @param {Object} targetPoint - Объект со всеми настройками точки прилета
 */
const flySegmentAsync = (plane, targetPoint) => {
    return new Promise((resolve) => {
        const startX = plane.x;
        const startY = plane.y;
        
        // Читаем настройки из целевой точки (если их нет - ставим дефолтные)
        const targetX = targetPoint.x;
        const targetY = targetPoint.y;
        const duration = targetPoint.duration || 1.0;      // Время полета в секундах
        const boostHeight = targetPoint.boostHeight || 150; // Насколько высоко подкинет (парабола)
        const rotSpeed = targetPoint.rotationSpeed || 0.2; // Скорость задирания носа
        
        let progress = 0;
        let lastX = startX;
        let lastY = startY;

        // Если на старте перелета нужен звук - проигрываем
        if (targetPoint.sound) playSound(targetPoint.sound);

        const flyTicker = (ticker) => {
            if (plane.destroyed) return app.ticker.remove(flyTicker);

            progress += ticker.deltaTime / (duration * 60);

            if (progress >= 1) {
                // ПРИЛЕТЕЛИ ИДЕАЛЬНО В ТОЧКУ
                plane.position.set(targetX, targetY);
                app.ticker.remove(flyTicker);
                
                focusCameraOnTarget(plane, true); 
                resolve(); 
            } else {
                // --- МАТЕМАТИКА ТРАЕКТОРИИ ---
                const currentX = startX + (targetX - startX) * progress;
                const linearY = startY + (targetY - startY) * progress;
                
                // ПАРАБОЛА (Дуга прыжка, умноженная на ИНДИВИДУАЛЬНЫЙ boostHeight)
                const parabola = 4 * progress * (1 - progress);
                const currentY = linearY - (boostHeight * parabola);

                // --- НАКЛОН НОСА САМОЛЕТА ---
                const dx = currentX - lastX;
                const dy = currentY - lastY;
                
                if (dx !== 0 || dy !== 0) {
                    let targetAngle = Math.atan2(dy, dx);
                    plane.rotation += (targetAngle - plane.rotation) * rotSpeed; 
                }

                plane.position.set(currentX, currentY);
                lastX = currentX;
                lastY = currentY;

                // Камера следит за самолетом
                if (typeof focusCameraOnTarget === 'function') {
                    focusCameraOnTarget(plane, false, plane.x); 
                }
            }
        };

        app.ticker.add(flyTicker);
    });
};

/**
 * Непрерывный полет по массиву точек (сплайновая интерполяция)
 * Самолет не останавливается на точках, а пролетает сквозь них.
 * @param {PIXI.Sprite} plane - Объект самолета
 * @param {Array} path - Массив объектов {x, y, duration, smooth}
 * @param {Function} onCheckpoint - Колбэк, вызываемый при прохождении каждой точки
 * @returns {Promise} Разрешается, когда самолет достигает последней точки
 */
const flyContinuousAsync = (plane, path, onCheckpoint) => {
    return new Promise((resolve) => {
        if (!path || path.length === 0) return resolve();

        const points = [{ x: plane.x, y: plane.y, duration: 0, smooth: true }, ...path];
        
        let currentSegment = 0;
        let progress = 0;
        let lastX = plane.x;
        let lastY = plane.y;

        const flyTicker = (ticker) => {
            if (plane.destroyed) return app.ticker.remove(flyTicker);

            if (currentSegment >= points.length - 1) {
                app.ticker.remove(flyTicker);
                resolve();
                return;
            }

            const p0 = points[currentSegment];
            const p1 = points[currentSegment + 1];
            
            const duration = p1.duration || 1.0; 

            progress += ticker.deltaTime / (duration * 60);

            if (progress >= 1) {
                plane.position.set(p1.x, p1.y);
                lastX = p1.x;
                lastY = p1.y;
                
                if (onCheckpoint) onCheckpoint(currentSegment + 1, p1);

                currentSegment++;
                progress = (p1.smooth !== false) ? progress - 1 : 0; 
                
            } else {
                const p_minus1 = points[Math.max(0, currentSegment - 1)];
                const p2 = points[Math.min(points.length - 1, currentSegment + 2)];

                const t = progress;
                const t2 = t * t;
                const t3 = t2 * t;

                const currentX = 0.5 * (
                    (2 * p0.x) +
                    (-p_minus1.x + p1.x) * t +
                    (2 * p_minus1.x - 5 * p0.x + 4 * p1.x - p2.x) * t2 +
                    (-p_minus1.x + 3 * p0.x - 3 * p1.x + p2.x) * t3
                );

                const currentY = 0.5 * (
                    (2 * p0.y) +
                    (-p_minus1.y + p1.y) * t +
                    (2 * p_minus1.y - 5 * p0.y + 4 * p1.y - p2.y) * t2 +
                    (-p_minus1.y + 3 * p0.y - 3 * p1.y + p2.y) * t3
                );

                const dx = currentX - lastX;
                const dy = currentY - lastY;
                
                if (dx !== 0 || dy !== 0) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist >= 0.5) {
                        const targetAngle = Math.atan2(dy, dx);
                        plane.rotation += (targetAngle - plane.rotation) * 0.15;
                    }
                }

                plane.position.set(currentX, currentY);
                lastX = currentX;
                lastY = currentY;

                if (typeof focusCameraOnTarget === 'function') {
                    focusCameraOnTarget(plane, false, plane.x); 
                }
            }
        };

        app.ticker.add(flyTicker);
    });
};
// ==========================================
// ИГРОВОЙ ЦИКЛ FLAPPY BIRD
// ==========================================
// ==========================================
// ИГРОВОЙ ЦИКЛ FLAPPY BIRD
// ==========================================
app.ticker.add((ticker) => {
    // Физика работает ТОЛЬКО когда управление у игрока
    if (gameState !== 'PLAYING') return; 

    // 1. ДВИЖЕНИЕ ВПЕРЕД
    plane.x += FORWARD_SPEED * ticker.deltaTime;

    // 2. ГРАВИТАЦИЯ
    planeVelocityY += GRAVITY * ticker.deltaTime;
    plane.y += planeVelocityY * ticker.deltaTime;

    // 3. ОГРАНИЧЕНИЕ ВЫСОТЫ
    if (plane.y > FLOOR_Y) {
        // Скользим по полу
        plane.y = FLOOR_Y;
        planeVelocityY = 0;
        plane.rotation += (-20 * (Math.PI / 180) - plane.rotation) * 0.2;
    } else if (plane.y < CEILING_Y) {
        // Бьемся об потолок
        plane.y = CEILING_Y;
        planeVelocityY = 0;
    } else {
        // Наклон в полете
        const baseAngle = -20 * (Math.PI / 180);
        const targetRotation = baseAngle + (planeVelocityY * 0.04);
        plane.rotation += (targetRotation - plane.rotation) * 0.15;
    }

    // 4. ПРОВЕРКА КОЛЛИЗИЙ (Сбора объектов)
    for (let i = 0; i < collectibleItems.length; i++) {
        const item = collectibleItems[i];
        if (item.collected) continue;

        const dx = plane.x - item.sprite.x;
        const dy = plane.y - item.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Расстояние столкновения (можно подстроить)
        if (distance < 80) {
            item.collected = true;
            item.sprite.visible = false;
            handleCollision(item.type, item.sprite.x, item.sprite.y);
        }
    }

    // 5. КОНЕЦ ИГРЫ (Остров впереди)
    if (plane.x >= endIsland.x - 200) {
        gameState = 'GAMEOVER'; // Отключаем физику
        finishGame(); // Запускаем скрипт посадки
    }
});

// ==========================================
// ЛОГИКА СБОРА БОНУСОВ И ШТРАФОВ
// ==========================================
function handleCollision(type, x, y) {
    if (type === 'rocket' || type === 'bonus_d2') {
        playSound(type === 'rocket' ? explosion : wrong);
        spawnOneShotAnimation(type === 'rocket' ? animBoom : animEffect, x, y, 1.5);
        if (type === 'bonus_d2') currentBalance = Math.floor(currentBalance / 2);
    } else {
        playSound(bonus);
        spawnOneShotAnimation(animEffect, x, y, 1.0);
        const val = type.split('_')[1];
        if (val === 'x2') currentBalance *= 2;
        else currentBalance += parseInt(val) * 50;
    }
    
    planeMoneyText.text = currentBalance + " EUR";
    //planeMoneyText.scale.set(1.5);
    //setTimeout(() => planeMoneyText.scale.set(1), 150);
}


// ==========================================
// УПРАВЛЕНИЕ (КНОПКА FLY)
// ==========================================
// ==========================================
// УПРАВЛЕНИЕ (КНОПКА FLY)
// ==========================================
flyButton.eventMode = 'static'; 

flyButton.on('pointerdown', async () => {
    // Если игра окончена или самолет сейчас в процессе авто-взлета — игнорируем клик
    if (gameState === 'GAMEOVER' || gameState === 'TAKEOFF') return;

    // Анимация нажатия кнопки
    pressButton(flyButton);

    if (gameState === 'START') {
        // --- ПЕРВЫЙ ТАП: ЗАПУСК СЦЕНАРИЯ ВЗЛЕТА ---
        gameState = 'TAKEOFF';
        playSound(samolet, 0.5);
        
        console.log("РАЗГОН...");
        // 1. Увеличил разгон: едем по земле чуть дольше (300px за 1.8 сек)
        await moveAsync(plane, plane.x + 300, plane.y, 1.8);
        
        console.log("МЯГКИЙ ОТРЫВ ОТ ЗЕМЛИ!");
        // 2. Длинный и плавный взлет
        await new Promise(resolve => {
            const startX = plane.x;
            const startY = plane.y;
            const targetX = startX + 600; // Летим далеко вперед (полого)
            const targetY = startY - 180; // Набираем не слишком большую высоту
            let progress = 0;
            
            const durationSec = 2.2; // Увеличили время полета в 2 с лишним раза!
            const baseAngle = -20 * (Math.PI / 180); // Исходный угол картинки
            
            const takeoffTicker = (t) => {
                progress += t.deltaTime / (durationSec * 60);
                
                if (progress >= 1) {
                    plane.position.set(targetX, targetY);
                    app.ticker.remove(takeoffTicker);
                    resolve();
                } else {
                    // S-образная кривая (Sine Ease-In-Out).
                    // Начинает плавно, ускоряется в середине, и плавно тормозит в конце.
                    const easeY = 0.5 * (1 - Math.cos(Math.PI * progress)); 
                    
                    plane.x = startX + (targetX - startX) * progress; // Линейно вперед
                    plane.y = startY + (targetY - startY) * easeY;    // Плавно вверх
                    
                    // Анимация носа: задираем нос в середине взлета, потом выравниваем
                    // Math.sin даст нам дугу (0 -> 1 -> 0)
                    const noseLift = Math.sin(progress * Math.PI) * 0.25; 
                    plane.rotation = baseAngle - noseLift; 
                }
            };
            app.ticker.add(takeoffTicker);
        });

        // 3. ОТДАЕМ УПРАВЛЕНИЕ ИГРОКУ!
        console.log("УПРАВЛЕНИЕ ПЕРЕДАНО ИГРОКУ!");
        gameState = 'PLAYING';
        
        // Даем малюсенький импульс вверх (-1 вместо -2), 
        // чтобы переход от плавной анимации к гравитации был бесшовным
        planeVelocityY = -1; 
        
    } else if (gameState === 'PLAYING') {
        // --- ПОСЛЕДУЮЩИЕ ТАПЫ: FLAPPY BIRD ПРЫЖОК ---
        planeVelocityY = LIFT;
    }
});



        // ==========================================
        // КОНЕЦ ИГРЫ (Посадка и показ UI)
        // ==========================================
// ==========================================
// КОНЕЦ ИГРЫ (Посадка и показ UI)
// ==========================================
// ==========================================
// КОНЕЦ ИГРЫ (Посадка и цепочка UI)
// ==========================================
        async function finishGame() {
            console.log("ПОСАДКА НА КОРАБЛЬ!");

            await landOnShipAsync(plane, endIsland.x, endIsland.y, 100);
            await wait(500);

            flyButton.visible = false; 
            endButton.visible = true;



            flyButton.eventMode = 'none';
            endButton.eventMode = 'static';

            endButton.on("pointerdown" , async ()=>{
                endButton.visible = false;
                                // Параметры: Сумма, Кнопка=false, Таймер=2500мс, ПропускАнимации=false
                await showWinPlaque(currentBalance, false, 2500, false);

                // ЭТАП 2: Телефон
                await new Promise(resolve => {
                    showPhoneAnimation(currentBalance , resolve); 
                });
                showWinPlaque(currentBalance, true, 0, true);
            
            } , 200)
            // ЭТАП 1: Показываем победу (Анимация ВКЛ).

            // ЭТАП 3: Мгновенное появление плашки победы УЖЕ С КНОПКОЙ.
            // Параметры: Сумма, Кнопка=true, Таймер=0 (навсегда), ПропускАнимации=TRUE!
            
        }


        // ==========================================
        // ПЕРЕХОДЫ
        // ==========================================

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
 * Скриптовая анимация посадки самолета на корабль
 * @param {PIXI.Sprite} plane - Самолет
 * @param {number} landingX - Точка касания палубы по X
 * @param {number} landingY - Точка касания палубы по Y (высота палубы)
 */
/**
 * Кинематографичная посадка самолета на палубу корабля
 * @param {PIXI.Sprite} plane - Самолет
 * @param {number} deckX - Координата X точки касания палубы
 * @param {number} deckY - Координата Y высоты палубы
 * @param {number} rollDistance - Сколько пикселей самолет прокатится по палубе до полной остановки
 */
/**
 * Кинематографичная посадка самолета на палубу корабля (С учетом наклона картинки)
 * @param {PIXI.Sprite} plane - Самолет
 * @param {number} deckX - Координата X точки касания палубы
 * @param {number} deckY - Координата Y высоты палубы
 * @param {number} rollDistance - Сколько пикселей самолет прокатится по палубе до полной остановки
 */
const landOnShipAsync = (plane, deckX, deckY, rollDistance = 100) => {
    return new Promise((resolve) => {
        const startX = plane.x;
        const startY = plane.y;
        
        // Точка полной остановки в конце палубы
        const stopX = deckX + rollDistance; 
        
        let progress = 0;
        const totalDuration = 3.8; // 3 секунды на всю посадку
        const touchDownPoint = 0.4; // 40% времени на спуск, 60% на торможение

        // --- ВАЖНО: БАЗОВЫЙ УГОЛ САМОЛЕТА НА ЗЕМЛЕ ---
        // Так как картинка нарисована под углом, -20 градусов - это его "ровное" положение
        const baseGroundAngle = -20 * (Math.PI / 180); 

        const landingTicker = (ticker) => {
            if (plane.destroyed) return app.ticker.remove(landingTicker);

            progress += ticker.deltaTime / (totalDuration * 60);

            if (progress >= 1) {
                // --- ПОЛНАЯ ОСТАНОВКА ---
                plane.position.set(stopX, deckY);
                plane.rotation = baseGroundAngle; // Жестко ставим на 2 колеса
                app.ticker.remove(landingTicker);
                resolve(); 
            } else {
                // ==========================================
                // МАТЕМАТИКА ПЛАВНОЙ ПОСАДКИ
                // ==========================================
                
                if (progress < touchDownPoint) {
                    // --- ФАЗА 1: СНИЖЕНИЕ ПО ПАРАБОЛЕ ---
                    const t = progress / touchDownPoint;
                    const easeY = t * t * (3 - 2 * t); // Smoothstep
                    const easeX = t; 
                    
                    plane.x = startX + (deckX - startX) * easeX;
                    plane.y = startY + (deckY - startY) * easeY;
                    
                    // --- МАГИЯ НОСА (Flare effect) ---
                    if (t < 0.7) {
                        // Опускаем нос по вектору снижения (но учитывая базовый наклон картинки!)
                        const flightAngle = Math.atan2(deckY - startY, deckX - startX);
                        // Прибавляем к вектору полета базовый угол картинки
                        const targetAngle = flightAngle + baseGroundAngle;
                        plane.rotation += (targetAngle - plane.rotation) * 0.1;
                    } else {
                        // Задираем нос ВВЕРХ перед касанием (flare). 
                        // Поднимаем нос на 15 градусов выше базового положения (-20 + 15 = -5)
                        const flareAngle = baseGroundAngle + (15 * Math.PI / 180); 
                        plane.rotation += (flareAngle - plane.rotation) * 0.15;
                    }

                } else {
                    // --- ФАЗА 2: ТОРМОЖЕНИЕ ПО ПАЛУБЕ ---
                    const t = (progress - touchDownPoint) / (1 - touchDownPoint);
                    
                    // ДОЛГОЕ ЗАМЕДЛЕНИЕ (Cubic Ease-Out)
                    const easeX = 1 - Math.pow(1 - t, 3);
                    
                    plane.x = deckX + rollDistance * easeX;
                    plane.y = deckY; // Едет по прямой
                    
                    // --- ВЫРАВНИВАНИЕ НА ДВА КОЛЕСА ---
                    // Как только шасси коснулись палубы, самолет падает на базовый угол (-20 градусов)
                    // Эффект легкого "клевка" вперед при торможении (инерция)
                    const brakeDive = Math.sin(t * Math.PI) * (5 * Math.PI / 180); // Клюет на 5 градусов
                    
                    // Целевой угол: Базовый (-20) + Клевок от тормозов
                    const targetAngle = baseGroundAngle + brakeDive;
                    plane.rotation += (targetAngle - plane.rotation) * 0.2;
                }

                // Камера продолжает следить
                if (typeof focusCameraOnTarget === 'function') {
                    focusCameraOnTarget(plane, false, plane.x); 
                }
            }
        };

        app.ticker.add(landingTicker);
    });
};
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

            // Базовый зум для вписывания игры в экран (Contain)
            const baseZoom = Math.min(sw / GAME_WIDTH, sh / GAME_HEIGHT);
            const finalScale = baseZoom * cameraZoom;

            // 1. ИГРОВЫЕ СЛОИ (Строго по центру)
            cameraLayers.forEach(layer => {
                layer.scale.set(finalScale);
                
                // sw/2 и sh/2 - это ИДЕАЛЬНЫЙ физический центр экрана
                layer.position.set(
                    sw / 2 - (cameraX * finalScale * layer.parallaxFactor),
                    sh / 2 - (cameraY * finalScale * layer.parallaxFactor)
                );
            });

            // 2. UI СЛОЙ (Строго по центру)
            let uiScale = sh / GAME_HEIGHT;
            const ar = sw / sh;
            if (ar < 0.53) uiScale *= (ar / 0.53);

            uiOverlayContainer.scale.set(uiScale);
            uiOverlayContainer.position.set(sw / 2, sh / 2);


            uiOverlayContainer.scale.set(uiScale);
            uiOverlayContainer.position.set(sw / 2, sh / 2);

            // ВЫЧИСЛЯЕМ ПОЛОВИНУ ВИДИМОЙ ВЫСОТЫ В КООРДИНАТАХ UI
            const halfH = (sh / 2) / uiScale;

            // --- ПРИВЯЗКА КНОПОК К НИЖНЕМУ КРАЮ ---
            // Ставим кнопки в самый низ (halfH) и отступаем вверх на 180 пикселей
            flyButton.position.set(0, halfH - 180);
            endButton.position.set(0, halfH - 180);

            // --- ПРИВЯЗКА ЛОГОТИПА К ВЕРХНЕМУ КРАЮ ---
            // Ставим логотип в самый верх (-halfH) и отступаем вниз на 120 пикселей
            logo.position.set(0, -halfH + 120);
            
            // ... (здесь твой UI-адаптив) ...
        }
        

        window.addEventListener('resize', resize);
        resize();


        // ==========================================
        // СЮДА ПИШЕМ ИГРОВУЮ ЛОГИКУ
        // ==========================================



        // Пример: создаём анимацию
        // const idleFrames = import.meta.glob('./assets/Idle/*.webp', { eager: true, import: 'default' });
        // const animIdle = await createAnimFromFolder(idleFrames, 0.25, true);

        // Пример: шаги игры
        // const gameSteps = [
        //     async function step0() { ... },
        //     async function step1() { ... },
        // ];


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