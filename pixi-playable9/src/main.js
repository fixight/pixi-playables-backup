import './style.css';
import * as PIXI from 'pixi.js';
import cube1IMG from './assets/cube1.webp'
import cube2IMG from './assets/cube2.webp'
import neonPlaqueIMG from './assets/neonPlaque.webp'
import cubePlaque from './assets/cubePlaque.webp'
import collectWin from './assets/collectWin.webp'
import cashOutIMG from './assets/cashOut.png'
import goButtonIMG from './assets/goButton.png'
import drop from './assets/drop.mp3'
import money from './assets/money.wav'
import electroSound from './assets/electro.mp3'
import hookIMG from './assets/hook.png'
import ropeIMG from './assets/rope.png'





// ==========================================
// ГЛОБАЛЬНАЯ РАЗБЛОКИРОВКА АУДИО (iOS / Android)
// ==========================================
let isAudioUnlocked = false;


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
//const getAssetPath = (src) => (src && src.default) ? src.default : src;



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
// АУДИО (СОВМЕСТИМОСТЬ С IOS MUTE SWITCH)
// ==========================================
//let isAudioUnlocked = false;

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

let firstTouchTime = 0; // Время, когда игрок впервые нажал на экран

// Заменяем твой playSound на этот
const pendingSounds = [];

function playSound(soundUrl, volume = 1.0) {
    if (isGameMuted || !soundUrl) return;

    if (!isAudioUnlocked) {
        // Кладём в очередь — сыграем сразу после разблокировки
        pendingSounds.push({ soundUrl, volume });
        return;
    }

    _playNow(soundUrl, volume);
}

function _playNow(soundUrl, volume) {
    const sfx = new Audio(soundUrl);
    sfx.volume = volume;
    activeSounds.add(sfx);
    sfx.onended = () => activeSounds.delete(sfx);
    sfx.onerror  = () => activeSounds.delete(sfx);
    sfx.play().catch(e => {
        console.warn("Звук заблокирован", e);
        activeSounds.delete(sfx);
    });
}

// Вспомогательная функция для проигрывания
function playSfx(sfx) {
    activeSounds.add(sfx);
    sfx.onended = () => activeSounds.delete(sfx);
    sfx.onerror = () => activeSounds.delete(sfx);

    sfx.play().catch(e => {
        console.warn("Звук заблокирован", e);
        activeSounds.delete(sfx);
    });
}

// Предзагружает и кэширует звук в браузере (без воспроизведения)
function preloadAudio(url) {
    const audio = new Audio();
    audio.src = url;
    audio.preload = 'auto'; // Заставляем браузер скачать файл в память
    audio.load();
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


        const [cube1Tex , cube2Tex , neonPlaqueTex , cubePlaqueTex , collectWinTex , goButtonTex , cashOutTex , hookTex , ropeTex] = await Promise.all([
            loadTextureDirectly(cube1IMG),
            loadTextureDirectly(cube2IMG),
            loadTextureDirectly(neonPlaqueIMG),
            loadTextureDirectly(cubePlaque),
            loadTextureDirectly(collectWin),
            loadTextureDirectly(goButtonIMG),
            loadTextureDirectly(cashOutIMG),
            loadTextureDirectly(hookIMG),
            loadTextureDirectly(ropeIMG),
        ]);

        preloadAudio(drop); // Твой звук падения/удара

        // ------------------------------------------
        // КАМЕРА
        // ------------------------------------------




        /** Слои с параллаксом. parallaxFactor: 0 = статичный, 1 = обычный мир */
        const cameraLayers = [];

        function createLayer(parallaxFactor) {
            const layer = new PIXI.Container();
            layer.parallaxFactor = parallaxFactor;
            app.stage.addChild(layer);
            cameraLayers.push(layer);
            return layer;
        }
        const bgContainer      = createLayer(0.0); 
        // ------------------------------------------
        // СЛОИ (пример структуры — замени под свою игру)
        // ------------------------------------------
        const gameContainer    = createLayer(1.0); // Игровой мир
        const uiOverlayContainer = new PIXI.Container(); // UI поверх всего
        app.stage.addChild(uiOverlayContainer);





        const backgroundFrames = import.meta.glob('./assets/background/*.webp', { eager: true, import: 'default' });
        // Загружаем кадры электричества
        const electroFrames = import.meta.glob('./assets/electro/*.webp', { eager: true, import: 'default' });
        const animElectroBase = await createAnimFromFolder(electroFrames, 0.4, false); // false, так как будем проигрывать по разу
        animElectroBase.visible = false; // Прячем шаблон

        const fallFrames = import.meta.glob('./assets/fall/*.webp', { eager: true, import: 'default' });
        const animFallBase = await createAnimFromFolder(fallFrames, 0.4, false); // false = проиграть один раз
        animFallBase.visible = false;

        const burstFrames = import.meta.glob('./assets/burst/*.webp', { eager: true, import: 'default' });
        const animburstBase = await createAnimFromFolder(burstFrames, 0.4, false); // false = проиграть один раз
        animburstBase.visible = false;

        const progressFrames = import.meta.glob('./assets/scoreBar/*.webp', { eager: true, import: 'default' });
        const animProgressBar = await createAnimFromFolder(progressFrames, 0.4, false); // false = проиграть один раз
        animProgressBar.visible = false;

        const logoFrames = import.meta.glob('./assets/logo/*.webp', { eager: true, import: 'default' });
        const animLogo = await createAnimFromFolder(logoFrames, 0.4, false); // false = проиграть один раз
        animLogo.visible = false;
        
        let spawnPosition = -1000;

        const animBackground = await createAnimFromFolder(backgroundFrames, 0.4, true);
        animBackground.scale.set(0.7);
        animBackground.play();
        bgContainer.addChild(animBackground);

const firstCube = new PIXI.Sprite({ texture: cube1Tex });
        firstCube.anchor.set(0.5);
        firstCube.scale.set(0.3);
        
        // --- ПРОЦЕНТНАЯ ПРИВЯЗКА К НИЗУ ЭКРАНА ---
        // Вычисляем Y: самый низ (GAME_HEIGHT / 2) минус 12% от общей высоты
        const bottomY = GAME_HEIGHT / 2;
        const startYPosition = bottomY - (GAME_HEIGHT * 0.12);
        
        firstCube.position.set(0, startYPosition);
        gameContainer.addChild(firstCube);

        // НЕ ЗАБУДЬТЕ ТАКЖЕ ОБНОВИТЬ СТАРТОВУЮ ЦЕЛЬ КАМЕРЫ!
        // Камера должна с самого начала смотреть на этот куб

        let cameraX = 0;
        let cameraY = startYPosition; 
        let targetCameraY = startYPosition;
        let cameraZoom = 4;
        let currentCameraTicker = null;

            // ==========================================
        // НИЖНЯЯ ПАНЕЛЬ (КНОПКИ)
        // ==========================================
        const footerContainer = new PIXI.Container();
        footerContainer.zIndex = 100; // Поверх башни, но под финальным экраном
        uiOverlayContainer.addChild(footerContainer);

        // Группа, в которой лежат обе кнопки (чтобы легко масштабировать их вместе)
        const buttonsGroup = new PIXI.Container();
        footerContainer.addChild(buttonsGroup);

    // Заданные тобой множители по порядку (для 1-го, 2-го, ... 6-го блока)
    const MULTIPLIERS = [3.0, 4.0, 15.0, 25.0, 50.0, 60.0];

    // Суммы выигрыша за каждый из 6 блоков, чтобы в сумме вышло ровно 45.628
    // Я разбил их по нарастающей, чтобы было красиво
    const WINS = [1200, 2400, 5000, 10000, 12000, 15028]; 
    let currentWinSum = 0; // Текущая накопленная сумма


        // ==========================================
    // ЛОГОТИП
    // ==========================================
        // Так как это анимированный спрайт, создаем его через твой клонатор или напрямую
        const logoContainer = new PIXI.Container();
        logoContainer.zIndex = 800;
        uiOverlayContainer.addChild(logoContainer);

        const logoAnim = new PIXI.AnimatedSprite(animLogo.textures);
        logoAnim.anchor.set(0.5);
        logoAnim.animationSpeed = 0.4;
        logoAnim.loop = true; // Обычно логотипы крутятся бесконечно
        logoAnim.play();
        logoContainer.addChild(logoAnim);

    // ==========================================
    // ПРОГРЕСС-БАР (Вертикальный слева)
    // ==========================================


        // --- КНОПКА CASH OUT (Слева) ---
        const cashOutBtn = new PIXI.Sprite({ texture: cashOutTex });
        cashOutBtn.anchor.set(0.5);
        cashOutBtn.position.set(-290, 0); // Сдвигаем влево от центра
        cashOutBtn.scale.set(0.9);
        cashOutBtn.eventMode = 'static';
        cashOutBtn.cursor = 'pointer';
        // По клику на Cash Out можно сразу открывать стор
        cashOutBtn.on('pointerdown', openStore); 
        buttonsGroup.addChild(cashOutBtn);

        // Текст CASH OUT (Сверху)
        const cashOutTitle = new PIXI.Text({ 
            text: getT("cashout"), 
            style: { fontFamily: 'softhyphen', fontSize: 60, fill: '#ffffff' } 
        });
        cashOutTitle.anchor.set(0.5);
        cashOutTitle.position.set(0, -25);
        cashOutBtn.addChild(cashOutTitle);

        // Текст баланса (Снизу)
        let currentCash = 0;
        const cashOutAmount = new PIXI.Text({ 
            text: "0.00 EUR", 
            style: { fontFamily: 'softhyphen', fontSize: 45, fontWeight: 'bold', fill: '#cccccc' } 
        });
        cashOutAmount.anchor.set(0.5);
        cashOutAmount.position.set(0, 30);
        cashOutBtn.addChild(cashOutAmount);

        // --- КНОПКА GO (Справа) ---
        const goBtn = new PIXI.Sprite({ texture: goButtonTex });
        goBtn.anchor.set(0.5);
        goBtn.position.set(290, 0); // Сдвигаем вправо от центра
        goBtn.scale.set(0.9);
        goBtn.eventMode = 'static';
        goBtn.cursor = 'pointer';
        buttonsGroup.addChild(goBtn);

        // Текст GO
        const goText = new PIXI.Text({ 
            text: getT("go").toUpperCase(), 
            style: { 
                fontFamily: 'softhyphen', 
                fontSize: 70, 
                fill: '#ffffff',
                dropShadow: { color: '#000000', alpha: 0.3, distance: 3, blur: 2 }
            } 
        });
        goText.anchor.set(0.5);
        goBtn.addChild(goText);

        // Логика клика по кнопке GO (СБРОС КУБИКА)
        goBtn.on('pointerdown', () => {
            // Вызываем твою функцию сброса кубика
            if (typeof dropCube === 'function') {
                dropCube();
                //showEndScreen();
            }
            
            // Анимация нажатия (вдавливание)
            goBtn.scale.set(0.85);
            setTimeout(() => goBtn.scale.set(0.9), 100);
        });


        // ==========================================
        // ПРОГРЕСС-БАР
        // ==========================================
        const progressContainer = new PIXI.Container();
        progressContainer.zIndex = 90;
        uiOverlayContainer.addChild(progressContainer);

        const progressBar = new PIXI.AnimatedSprite(animProgressBar.textures);
        progressBar.anchor.set(0.5);
        progressBar.gotoAndStop(0); // Пустой бар на старте
        progressContainer.addChild(progressBar);
        // Настройки шагов
        const TOTAL_STEPS = 6; // Сколько всего блоков/попаданий нужно для 100%
        let currentStep = 0;   // Текущий шаг
        let targetFrame = 0;   // Кадр, на котором нужно остановиться

        const isPortraitNow = window.innerWidth < window.innerHeight;

                    // В портрете расстояние 500, в ландшафте — 250 (так как экран узкий по высоте)
        const gap = isPortraitNow ? 0 : 0;


        const myCube = spawnSwingingCube(650); // Куб опустится до Y=500 и будет там качаться

        let towerStack = [firstCube]; // Массив всей башни, начинаем с первого куба
        let currentSwingingCube = myCube; // Ссылка на тот куб, который сейчас качается
        let isDropping = false; // Блокировка клика, пока куб падает

        // Запускаем проверку каждые 2 секунды
        setInterval(() => {
            // Проходим по всем кубам, которые уже стоят в башне
            towerStack.forEach((block, index) => {
                
                // Добавляем элемент случайности (шанс 30%, что этот блок ударит током сейчас)
                if (Math.random() < 0.35) {
                    
                    // Делаем небольшую случайную задержку для каждого блока, 
                    // чтобы они не вспыхивали все одновременно как гирлянда
                    setTimeout(() => {
                        playElectroOnBlock(block);
                        
                        // Опционально: звук электричества (играем редко, чтобы не шумело)
                        // if(index === towerStack.length - 1) playSound(electroSfx, 0.2);
                    }, Math.random() * 1000);
                }
            });
        }, 1000); // Повторяем каждые 3 секунды


        

        
        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen; // Весь экран кликабелен



        
// ==========================================
        // 1. БЕСКОНЕЧНЫЙ ФОН (TILING SPRITE)
        // ==========================================
        // Вместо PIXI.Sprite используем PIXI.TilingSprite
        // Изначально задаем ему размер 100x100, в resize() мы растянем его на весь экран
// Указываем конечные кадры для каждого из 6 шагов
// Шаг 1 до 7, Шаг 2 до 12, и так далее...
const FRAME_STEPS = [7, 12, 17, 21, 25, progressBar.totalFrames - 1];
//let currentStep = 0;

function addProgress() {
    // Если мы уже прошли все 6 шагов, выходим
    if (currentStep >= FRAME_STEPS.length) return;

    // Берем целевой кадр из нашего ручного списка
    const targetFrame = FRAME_STEPS[currentStep];
    currentStep++;
    
    // Запускаем проигрывание
    progressBar.play();

    // Следим за сменой кадров
    progressBar.onFrameChange = () => {
        // Если текущий кадр достиг или перешагнул цель
        if (progressBar.currentFrame >= targetFrame) {
            
            progressBar.stop(); // Останавливаем
            progressBar.currentFrame = targetFrame; // Точно фиксируем на кадре
            progressBar.onFrameChange = null; // Отключаем слушатель

            // --- ЭФФЕКТ "УДАРА" ПРИ ЗАПОЛНЕНИИ ---
            const baseScale = 1.5; // Твой базовый масштаб прогресс-бара
            let elapsed = 0;
            
            const punchTicker = (ticker) => {
                elapsed += ticker.deltaTime / 60;
                
                if (elapsed < 0.15) {
                    // Резко увеличиваем (0.3 - сила удара)
                    progressBar.scale.set(baseScale + (elapsed / 0.15) * 0.3);
                } else if (elapsed < 0.3) {
                    // Плавный возврат в норму
                    progressBar.scale.set(baseScale + 0.3 - ((elapsed - 0.15) / 0.15) * 0.3);
                } else {
                    progressBar.scale.set(baseScale);
                    app.ticker.remove(punchTicker);
                    
                    // ПРОВЕРКА: Если это был последний (6-й) сегмент
                    if (currentStep === FRAME_STEPS.length) {
                        console.log("ПРОГРЕСС ПОЛНОСТЬЮ ЗАПОЛНЕН!");
                        // Показываем плашку или финальный экран
                        // showNeonPlaque();
                    }
                }
            };
            app.ticker.add(punchTicker);
        }
    };
}


        /**
     * Обновляет сумму на кнопке Cash Out
     * @param {number} newAmount - Новая сумма
     */
    function updateCashOutAmount(newAmount) {
        // Убеждаемся, что текстовый объект существует
        if (typeof cashOutAmount !== 'undefined' && cashOutAmount) {
            
            playSound(money);
            // Запускаем эффект накрутки цифр, чтобы они не менялись резко
            const startVal = parseFloat(cashOutAmount.text) || 0;
            const duration = 0.5; // 0.5 секунды на накрутку
            let elapsed = 0;

            // Если анимация уже идет, удаляем её
            if (cashOutAmount._moneyTicker) {
                app.ticker.remove(cashOutAmount._moneyTicker);
            }

            const ticker = (t) => {
                elapsed += t.deltaTime / 60;
                
                if (elapsed >= duration) {
                    // Конец анимации
                    cashOutAmount.text = `${newAmount.toLocaleString('ru-RU')} EUR`;
                    app.ticker.remove(ticker);
                    cashOutAmount._moneyTicker = null;
                } else {
                    // Плавный набор
                    const easeOut = 1 - Math.pow(1 - (elapsed / duration), 3);
                    const currentVal = Math.floor(startVal + (newAmount - startVal) * easeOut);
                    cashOutAmount.text = `${currentVal.toLocaleString('ru-RU')} EUR`;
                }
            };

            cashOutAmount._moneyTicker = ticker;
            app.ticker.add(ticker);
            
            // Легкий эффект пульсации кнопки CASH OUT при начислении
            if (typeof cashOutBtn !== 'undefined' && cashOutBtn) {
                cashOutBtn.scale.set(1.0); // Увеличиваем кнопку
                setTimeout(() => {
                    if (!cashOutBtn.destroyed) cashOutBtn.scale.set(0.9); // Возвращаем обратно
                }, 150);
            }
        }
    }
        /**
 * Создает эффект взрыва над кубом и всплывающий текст множителя
 * @param {number} x - X координата центра куба
 * @param {number} y - Y координата (центр куба)
 * @param {number} multiplier - Значение множителя (например 3.0)
 */
function playBurstAnimation(x, y, multiplier) {
    const burstContainer = new PIXI.Container();
    burstContainer.position.set(x, y - 200); // Спавним НАД кубом (-200 пикселей)
    burstContainer.zIndex = 1700; // Поверх всего
    gameContainer.addChild(burstContainer);

    // 1. АНИМАЦИЯ ВЗРЫВА
    const burst = new PIXI.AnimatedSprite(animburstBase.textures);
    burst.anchor.set(0.5);
    burst.scale.set(0.35); // Крупный взрыв
    burst.animationSpeed = 0.5;
    burst.loop = false;

// Правильно:
    burst.onComplete = () => {
        burst.destroy();
    };
    
    // Делаем эффект свечения, если взрыв темноват (опционально)
    burst.blendMode = 'add'; 
    burstContainer.addChild(burst);

    // 2. ТЕКСТ МНОЖИТЕЛЯ
    const multText = new PIXI.Text({
        text: `X${multiplier.toFixed(1)}`, // Формат "X3.0"
        style: {
            fontFamily: 'softhyphen', // Или твой шрифт
            fontSize: 50,
            fill: '#1100ff', // Чисто белый текст
            fontStyle: 'italic', // Наклонный, как на скрине
            stroke: { 
                color: '#ffffff', // Синяя тень (имитация неона)
                alpha: 0.9, 
                width: 3,
                
            }
        }
    });
    multText.anchor.set(0.5);
    multText.scale.set(0); // Начинаем с нуля для анимации
    burstContainer.addChild(multText);

    // 3. АНИМАЦИИ (Тикер)
    burst.gotoAndPlay(0); // Запускаем взрыв
    
    let elapsed = 0;
    const burstTicker = (ticker) => {
        const dt = ticker.deltaTime / 60;
        elapsed += dt;

        // Пружинное появление текста (0.0 -> 0.3 сек)
        if (elapsed <= 0.3) {
            const p = elapsed / 0.3;
            // Overshoot: текст увеличивается до 1.2, потом сжимается до 1.0
            const ease = p < 1 ? p * p * (3 - 2 * p) * 1.2 : 1; 
            multText.scale.set(ease);
        } else if (elapsed > 0.3 && elapsed < 0.8) {
            // Текст висит и чуть-чуть ползет вверх
            multText.y -= 30 * dt;
        } else if (elapsed >= 0.8) {
            // Растворение
            const p = (elapsed - 0.8) / 0.3;
            multText.alpha = 1 - p;
            multText.x += 150 * dt; // Ускоряется вверх при исчезновении
            
            // Как только текст исчез — удаляем всё
            if (p >= 1) {
                app.ticker.remove(burstTicker);
                burstContainer.destroy({ children: true });
            }
        }
    };
    app.ticker.add(burstTicker);
}


function showEndScreen(finalAmount) {
    uiOverlayContainer.sortableChildren = true;
    
    const endContainer = new PIXI.Container();
    endContainer.zIndex = 500; 
    
    endContainer.eventMode = 'static';
    endContainer.cursor = 'pointer';
    endContainer.on('pointerdown', openStore); 
    
    uiOverlayContainer.addChild(endContainer);

    // ==========================================
    // 1. ФОН И СВЕЧЕНИЕ
    // ==========================================
    const dimmer = new PIXI.Graphics();
    dimmer.rect(-5000, -5000, 10000, 10000);
    dimmer.fill({ color: 0x000000, alpha: 0.85 });
    endContainer.addChild(dimmer);

    const bgGlow = new PIXI.Graphics();
    bgGlow.circle(0, 0, 400);
    bgGlow.fill({ color: 0x0055ff, alpha: 0.5 });
    bgGlow.filters = [new PIXI.BlurFilter(100)];
    bgGlow.blendMode = 'add';
    endContainer.addChild(bgGlow);

    // ==========================================
    // 2. ОБЩИЙ КОНТЕЙНЕР ДЛЯ КОНТЕНТА (Центровка)
    // ==========================================
    const totalWrapper = new PIXI.Container();
    // Оставляем в 0,0, так как uiOverlayContainer уже центрирован в resize()
    endContainer.addChild(totalWrapper);

    // --- ГРУППА КУБА ---
    const mainGroup = new PIXI.Container();
    // Поднимаем куб чуть выше центральной точки
    mainGroup.position.set(0, -180); 
    totalWrapper.addChild(mainGroup);

    const cubePlaque = new PIXI.Sprite({ texture: cubePlaqueTex });
    cubePlaque.anchor.set(0.5);
    cubePlaque.scale.set(0.8); 
    mainGroup.addChild(cubePlaque);

    // ГРАДИЕНТ ТЕКСТА
    const amountGradient = new PIXI.FillGradient({
        type: 'linear', 
        start: { x: 0, y: 0 }, 
        end: { x: 0, y: 1 },   
        textureSpace: 'local',
        colorStops: [
            { offset: 0, color: '#ffffff' }, 
            { offset: 1, color: '#ade4ff' }  
        ]
    });

    const amountStyle = new PIXI.TextStyle({ 
        fontFamily: 'softhyphen', 
        fontSize: 75,
        fill: amountGradient,
        align: 'center',
        dropShadow: { color: '#002266', alpha: 1, distance: 4, blur: 2 }
    });

    const amountText = new PIXI.Text({ text: getT("win").toUpperCase() + " 0 €", style: amountStyle });
    amountText.anchor.set(0.5);
    // Позиция текста внутри синей плашки
    amountText.position.set(0, 220); 
    mainGroup.addChild(amountText);

    // --- ГРУППА КНОПКИ ---
    const btnGroup = new PIXI.Container();
    // Опускаем кнопку ниже центральной точки
    btnGroup.position.set(0, 380); 
    totalWrapper.addChild(btnGroup);

    const btnGlow = new PIXI.Graphics();
    btnGlow.roundRect(-300, -80, 600, 160, 50);
    btnGlow.fill({ color: 0x00aaff, alpha: 0.6 });
    btnGlow.filters = [new PIXI.BlurFilter(40)];
    btnGlow.blendMode = 'add';
    btnGroup.addChild(btnGlow);

    const collectBtn = new PIXI.Sprite({ texture: collectWinTex });
    collectBtn.anchor.set(0.5);
    collectBtn.scale.set(0.85); 
    btnGroup.addChild(collectBtn);

    const btnText = new PIXI.Text({ 
        text: getT("collect_win"), 
        style: { 
            fontFamily: 'softhyphen', 
            fontSize: 70, 
            fill: '#0044cc', 
            align: 'center' 
        } 
    });
    btnText.anchor.set(0.5);
    // Убираем странный сдвиг -21, ставим ровно по центру кнопки
    btnText.position.set(-25 , -5);
    btnGroup.addChild(btnText);

    // ==========================================
    // 3. АНИМАЦИИ
    // ==========================================
    mainGroup.scale.set(0);
    btnGroup.scale.set(0);
    
    let elapsed = 0;
    const countDuration = 1.5; 
    let currentDisplayCount = 0;

    const animTicker = (ticker) => {
        const dt = ticker.deltaTime / 60;
        elapsed += dt;

        // Появление Куба
        if (elapsed < 0.5) {
            const p = elapsed / 0.5;
            const ease = 1 - Math.pow(1 - p, 3);
            mainGroup.scale.set(ease * 1.0);
        } else {
            // Левитация (теперь внутри своей позиции -180)
            //mainGroup.y = -180 + Math.sin((elapsed - 0.5) * 3) * 15;
        }

        // Появление Кнопки
        if (elapsed > 0.3 && elapsed < 0.8) {
            const p = (elapsed - 0.3) / 0.5;
            const ease = 1 - Math.pow(1 - p, 3);
            btnGroup.scale.set(ease * 1.0);
        } else if (elapsed >= 0.8) {
            btnGroup.scale.set(1.0)
            btnGlow.alpha = 0.4 + Math.abs(Math.sin(elapsed * 4)) * 0.4;
        }

        // Счётчик
        if (elapsed > 0.5 && elapsed <= 0.5 + countDuration) {
            const p = (elapsed - 0.5) / countDuration;
            const easeOut = 1 - Math.pow(1 - p, 3);
            const newVal = Math.floor(finalAmount * easeOut);
            if (newVal !== currentDisplayCount) {
                currentDisplayCount = newVal;
                amountText.text = getT("win").toUpperCase()+ ' ' + `${currentDisplayCount.toLocaleString('de-DE')} €`;
            }
        } else if (elapsed > 0.5 + countDuration) {
            amountText.text = getT("win").toUpperCase()+ ' ' + `${finalAmount.toLocaleString('de-DE')} €`;
        }

        bgGlow.alpha = 0.5 + Math.sin(elapsed * 2) * 0.1;
    };
    app.ticker.add(animTicker);
    
    // ==========================================
    // 4. УМНЫЙ АДАПТИВ (RESIZE)
    // ==========================================
    const onEndResize = () => {
        const sw = window.innerWidth;
        const sh = window.innerHeight;
        const uiScale = uiOverlayContainer.scale.y;
        
        const swUI = sw / uiScale;
        const shUI = sh / uiScale;

        // Если экран очень узкий (телефон), сжимаем всю группу целиком
        // 900 - это примерная ширина контента
        const contentWidth = 900;
        if (swUI < contentWidth) {
            totalWrapper.scale.set(swUI / contentWidth * 0.9);
        } else {
            totalWrapper.scale.set(1.0);
        }

        // Центрируем Wrapper в контейнере (на случай, если что-то сбилось)
        totalWrapper.position.set(0, 0);
    };
    window.addEventListener('resize', onEndResize);
    onEndResize();
}

/**
 * Показывает неоновую плашку с текстом
 * @param {string} message - Текст на плашке
 * @param {number} displayTimeMs - Время отображения в миллисекундах (например 3000)
 */
function showNeonPlaque(message = "NEURAL\nOVERLOAD\nDETECTED", displayTimeMs = 2500) {
    const plaqueContainer = new PIXI.Container();
    
    // Ставим в центр UI контейнера
    plaqueContainer.zIndex = 1000; 
    uiOverlayContainer.addChild(plaqueContainer);

    // 1. СПРАЙТ ПЛАШКИ
    const bg = new PIXI.Sprite({ texture: neonPlaqueTex });
    bg.anchor.set(0.5);
    bg.scale.set(0.8); // Подбери нужный масштаб
    plaqueContainer.addChild(bg);

    // 2. ТЕКСТ
    const style = new PIXI.TextStyle({
        fontFamily: 'softhyphen', // Твой шрифт
        fontSize: 82,
        fontWeight: 'bold',
        fill: '#0044cc', // Темно-синий цвет как на скрине
        align: 'center',
        lineHeight: 105,
        // Можно добавить легкое свечение самому тексту
        dropShadow: { color: '#ffffff', blur: 10, distance: 0, alpha: 0.5 }
    });

    const text = new PIXI.Text({ text: message.toUpperCase(), style: style });
    text.anchor.set(0.5);
    text.position.set(0, 0); // Центрируем на плашке
    plaqueContainer.addChild(text);

    // 3. АНИМАЦИЯ ПОЯВЛЕНИЯ (Пружинка)
    plaqueContainer.scale.set(0);
    let time = 0;
    const appearTicker = (ticker) => {
        time += ticker.deltaTime / 60;
        if (time < 0.5) {
            const t = time / 0.5;
            // Эффект Overshoot (вылетает чуть больше и возвращается)
            const ease = 1 - Math.pow(1 - t, 3); 
            plaqueContainer.scale.set(ease * 1.1); 
        } else if (time < 0.7) {
            const t = (time - 0.5) / 0.2;
            plaqueContainer.scale.set(1.1 - (0.1 * t)); // Возврат к 1.0
        } else {
            app.ticker.remove(appearTicker);
        }
    };
    app.ticker.add(appearTicker);

    // 4. ЛОГИКА ЗАКРЫТИЯ ЧЕРЕЗ N СЕКУНД
    setTimeout(() => {
        let fadeTime = 0;
        const fadeTicker = (ticker) => {
            fadeTime += ticker.deltaTime / (0.3 * 60); // Исчезает за 0.3 сек
            if (fadeTime >= 1) {
                app.ticker.remove(fadeTicker);
                plaqueContainer.destroy({ children: true });
            } else {
                plaqueContainer.alpha = 1 - fadeTime;
                plaqueContainer.scale.set(1 - fadeTime * 0.2); // Слегка уменьшается при уходе
            }
        };
        app.ticker.add(fadeTicker);
    }, displayTimeMs);
}
        /**
 * Запускает эффект электричества на конкретном блоке
 * @param {PIXI.Sprite} block - Объект куба из towerStack
 */
function playElectroOnBlock(block) {
    if (!block || block.destroyed) return;

    // Создаем клон из текстур базовой анимации
    const electro = new PIXI.AnimatedSprite(animElectroBase.textures);

    //playSound(electroSound);
    
    electro.anchor.set(0.5);
    // Делаем чуть больше самого блока, чтобы эффект "выходил" за края
    electro.scale.set(1.5 / block.parent.scale.x); 
    
    electro.animationSpeed = 0.5;
    electro.loop = false;

    // Важно: добавляем как CHILD блока, чтобы эффект двигался вместе с ним
    block.addChild(electro);
    
    electro.gotoAndPlay(0);

    // Удаляем эффект после завершения кадра
    electro.onComplete = () => {
        electro.destroy();
    };
}

/**
 * Создает эффект приземления куба
 * @param {number} x - координата по горизонтали
 * @param {number} y - координата стыка кубов
 */
function playFallAnimation(x, y) {
    const effect = new PIXI.AnimatedSprite(animFallBase.textures);
    effect.anchor.set(0.5, 0.5); 
    effect.position.set(x, y);
    
    // Масштабируем эффект под размер куба (0.3 - твой текущий масштаб куба)
    effect.scale.set(0.2); 
    
    effect.animationSpeed = 0.5;
    effect.loop = false;
    effect.zIndex = 150; // Поверх кубов
    
    gameContainer.addChild(effect);
    effect.gotoAndPlay(0);
    
    effect.onComplete = () => {
        effect.destroy();
    };
}     
        
    /**
     * Создает куб на мягкой веревке
     * @param {number} playHeight - Y координата, где должен висеть куб (например, -400 для верха экрана)
     */

/**
 * Создает куб на дизайнерской V-образной веревке
 * @param {number} playHeight - Y координата центра куба
 */
function spawnSwingingCube(playHeight = -600) {
    // 1. КОНТЕЙНЕР-КРАН (Основа, едет только по Y)
    const crane = new PIXI.Container();
    crane.scale.set(0.75);
    crane.position.set(0, spawnPosition); 
    spawnPosition -= 200;
    gameContainer.addChild(crane);

    // 2. КРЮК (Просто висит в центре crane, не вращается)
    const hook = new PIXI.Sprite({ texture: hookTex });
    hook.anchor.set(0.5);
    hook.position.set(0 , 240);
    hook.scale.set(0.8);
    crane.addChild(hook);

    // 3. МАЯТНИК (Контейнер, который вращается вокруг крюка)
    const pendulum = new PIXI.Container();
    crane.addChild(pendulum);

    pendulum.addChild(hook);

    // --- ФИЗИЧЕСКИЕ ПАРАМЕТРЫ ---
    const ropeLength = 360; // МАТЕМАТИЧЕСКАЯ длина (расстояние от крюка до центра куба)

    // 4. ДИЗАЙНЕРСКАЯ ВЕРЕВКА (Треугольник)
    const visualRope = new PIXI.Sprite({ texture: ropeTex });
    visualRope.anchor.set(0.5, 0); // Привязываем верхушку треугольника к крюку
    
    // Масштабируем веревку так, чтобы она выглядела красиво
    // Она НЕ зависит от ropeLength, ты настраиваешь её размер тут один раз
    visualRope.scale.set(0.4); 
    visualRope.position.set(0, 260); // Небольшой сдвиг вниз от центра крюка
    pendulum.addChild(visualRope);

    // 5. САМ КУБ
    const cube = new PIXI.Sprite({ texture: cube2Tex });
    cube.anchor.set(0.5);
    cube.scale.set(0.4);
    
    // КУБ ВСЕГДА НАХОДИТСЯ НА КОНЦЕ МАТЕМАТИЧЕСКОЙ ВЕРЕВКИ
    cube.position.set(0, ropeLength); 
    pendulum.addChild(cube);

    // Параметры анимации
    let time = 0;
    const swingSpeed = 0.06;    
    const maxAngle = 0.25;       
    const descendSpeed = 0.08; 

    const swingTicker = (t) => {
        if (cube.destroyed || crane.destroyed) return app.ticker.remove(swingTicker);

        const dt = t.deltaTime;
        time += swingSpeed * dt;

        // --- 1. РАСКАЧИВАНИЕ ---
        // Вращаем маятник (в котором лежат visualRope и куб)
        const targetRotation = Math.sin(time) * maxAngle;
        pendulum.rotation = targetRotation;

        // --- 2. ПЛАВНЫЙ СПУСК ---
        // Математика спуска использует ropeLength, чтобы куб остановился точно в playHeight
        const targetCraneY = playHeight - (ropeLength * Math.cos(pendulum.rotation));
        crane.y += (targetCraneY - crane.y) * descendSpeed * dt;

        // --- 3. НАКЛОН КУБА ---
        // Делаем куб чуть "тяжелее", чтобы он смотрел вниз
        cube.rotation = -pendulum.rotation * 0.4;
    };

    app.ticker.add(swingTicker);

    // Сохраняем ссылки для dropCube
    cube._swingTicker = swingTicker;
    cube._crane = crane;

    return cube;
}
function dropCube() {
        if (isDropping || !currentSwingingCube) return;
        isDropping = true;

        const cube = currentSwingingCube;
        
        // 1. Останавливаем раскачивание
        app.ticker.remove(cube._swingTicker);

        // 2. Переводим координаты в мировые
        const globalPos = cube.getGlobalPosition();
        const localPos = gameContainer.toLocal(globalPos);

        gameContainer.addChild(cube);
        cube.position.set(localPos.x, localPos.y);
        cube.rotation = 0; 
        cube.scale.set(0.31);

        // 3. Удаляем кран
        cube._crane.destroy();

        // 4. ОПРЕДЕЛЯЕМ ЦЕЛЬ (Без "магнитов", просто берем Y-координату крыши)
        const targetCube = towerStack[towerStack.length - 1];
        const targetDropY = targetCube.y - targetCube.height * 0.8; // Уровень крыши

        // 5. Запускаем честное вертикальное падение
        const fallSpeed = 15; 
        
        const fallTicker = (t) => {
            // Куб летит ТОЛЬКО по оси Y (строго вниз)
            cube.y += fallSpeed * t.deltaTime;

            // ПРОВЕРКА ВЫСОТЫ (Приземление)
            if (cube.y >= targetDropY) {

                animateCamera(cameraX , cameraY - 100 , cameraZoom , 1);
                
                app.ticker.remove(fallTicker);
                playSound(drop);

                // Фиксируем Y (X оставляем там, куда он упал!)
                cube.y = targetDropY; 
                
                // 1. АНИМАЦИЯ ПРИЗЕМЛЕНИЯ
                playFallAnimation(cube.x, cube.y + cube.height / 2);

                // 2. СЧИТАЕМ БЛОК И ЗАПУСКАЕМ ВЗРЫВ
                const stepIndex = towerStack.length - 1; 
                const currentMult = MULTIPLIERS[stepIndex] || 1.0; 
                playBurstAnimation(cube.x, cube.y + 100, currentMult);

                // 3. ОБНОВЛЯЕМ UI
                const winAmount = WINS[stepIndex] || 0;
                currentWinSum += winAmount;
                updateCashOutAmount(currentWinSum); 
                addProgress();

                // 4. ДОБАВЛЯЕМ В БАШНЮ
                towerStack.push(cube); 
                
                // 5. ЛОГИКА ЭТАПОВ ИГРЫ
                if (towerStack.length === 3) {
                    let messageText = getT("neural_overload").toUpperCase(); 

                    // 2. Заменяем ВСЕ пробелы на переносы строки (\n)
                    messageText = messageText.replace(/ /g, '\n');

                    // 3. Вызываем
                    showNeonPlaque(messageText, 2500);
                }

                if (towerStack.length === 7) {
                    console.log("ПОСТРОЕНО 6 БЛОКОВ. ИГРА ОКОНЧЕНА!");
                    isDropping = true; 
                    targetCameraY = cube.y;
                    
                    setTimeout(() => {
                        showEndScreen(45628); 
                    }, 1000);

                } else {
                    isDropping = false;
                    targetCameraY = cube.y;

                    const isPortraitNow = window.innerWidth < window.innerHeight;
                    const gap = isPortraitNow ? 90 : 90;
                    const nextY = cube.y - gap; 
                    
                    currentSwingingCube = spawnSwingingCube(nextY);
                }
            }
        };
        app.ticker.add(fallTicker);
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
// ==========================================
        // RESIZE / АДАПТИВ
        // ==========================================
function resize() {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            app.renderer.resize(sw, sh);

            const isPortrait = sw < sh;

            // ==========================================
            // 1. АДАПТИВ ИГРОВОГО МИРА (КАМЕРА)
            // ==========================================
            let baseZoom;
            if (isPortrait) {
                baseZoom = Math.min(sw / GAME_WIDTH, sh / GAME_HEIGHT);
            } else {
                baseZoom = (sh / GAME_HEIGHT) * 1.5; 
            }

            const finalScale = baseZoom * cameraZoom;

            // Вычисляем половину высоты экрана в игровых координатах (без зума)
            const screenHalfHeightInGame = (sh / 2) / finalScale;

            // --- РАЗНОЕ СМЕЩЕНИЕ КАМЕРЫ ДЛЯ ПОРТРЕТА И ЛАНДШАФТА ---
            let verticalOffset;
            
            if (isPortrait) {
                // В ПОРТРЕТЕ кнопки занимают много места (например, нижние 30-35% экрана)
                // Смещаем камеру вверх сильнее, чтобы куб не перекрывался огромным UI футером.
                verticalOffset = -screenHalfHeightInGame * 0.475; 
            } else {
                // В ЛАНДШАФТЕ кнопки прижаты к самому низу
                // Смещаем камеру меньше, чтобы куб опустился почти к краю экрана.
                verticalOffset = -screenHalfHeightInGame * 0.35; 
            }

            cameraLayers.forEach(layer => {
                layer.scale.set(finalScale);
                layer.position.set(
                    sw / 2 - (cameraX * finalScale * layer.parallaxFactor),
                    sh / 2 - ((cameraY + verticalOffset) * finalScale * layer.parallaxFactor)
                );
            });
            // ... (дальше твой обычный код UI)

            if (typeof backgroundSprite !== 'undefined') {
                backgroundSprite.width = GAME_WIDTH * 3;
                backgroundSprite.height = GAME_HEIGHT * 3;
            }

            // ==========================================
            // 2. АДАПТИВ UI СЛОЯ
            // ==========================================
            let uiScale = sh / GAME_HEIGHT;
            const ar = sw / sh;
            if (ar < 0.53) uiScale *= (ar / 0.53);

            uiOverlayContainer.scale.set(uiScale);
            uiOverlayContainer.position.set(sw / 2, sh / 2);

            const halfH = (sh / 2) / uiScale;
            const halfW = (sw / 2) / uiScale;
            const swUI = sw / uiScale;        
            const shUI = sh / uiScale; // Полная высота экрана в UI-координатах

            // ==========================================
            // 3. РАССТАНОВКА ЭЛЕМЕНТОВ UI
            // ==========================================

            // --- ЛОГОТИП ---
            if (typeof logoContainer !== 'undefined') {
                if (isPortrait) {
                    logoContainer.position.set(halfW - 250, -halfH + 220);
                    logoContainer.scale.set(0.8); 
                } else {
                    logoContainer.position.set(-halfW + 350, -halfH + 350);
                    logoContainer.scale.set(1.2); 
                }
            }

            // --- ПРОГРЕСС-БАР ---
            if (typeof progressContainer !== 'undefined') {
                progressContainer.position.set(halfW - 120, 0);

                if (swUI < 1000) {
                    const pScale = (swUI / 1000) * 1.05;
                    progressContainer.scale.set(pScale);
                } else {
                    progressContainer.scale.set(1.1); 
                }
            }

            // ==========================================
            // 4. ФУТЕР (ПРОЦЕНТНЫЙ ОТСТУП СНИЗУ)
            // ==========================================
            if (typeof footerContainer !== 'undefined') {
                // Ставим базовый контейнер футера в самый низ экрана
                footerContainer.position.set(0, halfH);
                
                if (typeof buttonsGroup !== 'undefined') {
                    // --- ПРОЦЕНТНЫЙ ПОДЪЕМ КНОПОК ---
                    // 0.15 = 15% от высоты экрана снизу. 
                    // Если хочешь выше, сделай 0.20 (20%). Если ниже — 0.10 (10%).
                    const liftPercent = isPortrait ? 0.1 : 0.1; 
                    const yOffset = -shUI * liftPercent; 
                    
                    // Поднимаем группу кнопок
                    buttonsGroup.position.set(0, yOffset);

                    // --- МАСШТАБИРОВАНИЕ ---
                    const BUTTONS_TOTAL_WIDTH = 1300; 
                    if (swUI < BUTTONS_TOTAL_WIDTH) {
                        const scaleDown = (swUI / BUTTONS_TOTAL_WIDTH) * 1.2;
                        buttonsGroup.scale.set(scaleDown);
                    } else {
                        buttonsGroup.scale.set(1.2); 
                    }

                    // --- РАССТОЯНИЕ МЕЖДУ КНОПКАМИ ---
                    // Разносим кнопки шире в ландшафте, и сужаем в портрете
                    if (typeof cashOutBtn !== 'undefined' && typeof goBtn !== 'undefined') {
                        const btnSpacing = isPortrait ? 260 : 350; 
                        cashOutBtn.position.set(-btnSpacing, 0);
                        goBtn.position.set(btnSpacing, 0);
                    }
                }
            }
        } // Конец resize

        // Запускаем ресайз при загрузке и при каждом повороте экрана
        window.addEventListener('resize', resize);
        resize();

    } catch (e) {
        console.error('Playable Init Error:', e);
    }
}; // Конец init
        




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