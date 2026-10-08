import './style.css';
import * as PIXI from 'pixi.js';

import backgroundIMG from './assets/background.jpg';
import ledIMG from'./assets/led.webp';
import cashoutIMG from'./assets/cashout.webp';
import playbuttonIMG from'./assets/playbutton.webp';
import balanceImg from'./assets/balance.webp';
import logoImg from'./assets/logo.webp';
import ledbonusIMG from './assets/ledbonus.webp';
import getbonusIMG from './assets/getbonus.webp';
import euro500IMG from './assets/500EUR.jpg';
import dnoIMG from './assets/dno.jpg';
import kruchokIMG from './assets/kruchok.webp';
import fishIMG from './assets/fish.webp';
import handIMG from './assets/Hand.webp';
import penguienIMG from './assets/penguienW/Girl_00002.webp';
import cranMachineIMG from './assets/cranmachine.webp';
import cranIMG from './assets/cran.webp';
import euro100IMG from './assets/100eur.jpeg';
import clickMP3 from './assets/click.mp3';
import cranMP3 from './assets/cran.mp3';
import transMP3 from './assets/transition.mp3';
import getMP3 from './assets/get.mp3';
import collectMP3 from './assets/collect.mp3';
import helicMP3 from './assets/helic.mp3';
import winMP3 from './assets/hugewin.mp3';
import ledMP3 from './assets/led.mp3';
import avatarIMG from './assets/download.png';




const getAssetPath = (src) => (src && src.default) ? src.default : src;

const loadTextureDirectly = (src) => {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(PIXI.Texture.from(img));
        img.onerror = (err) => reject(new Error("Failed to load image"));
        img.src = getAssetPath(src);
    });
};

const STORE_URL = "https://play.google.com/store/apps/details?id=com.your.game"; 

// ==========================================================
// БАЗОВОЕ РАЗРЕШЕНИЕ ИГРЫ (Основа - вертикальный телефон)
// Вся ваша игра (от логотипа до кнопок) должна укладываться в эту рамку.
// ==========================================================
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920; 

function openStore() {
    PIXI.Ticker.shared.stop(); 

    // 1. Узнаем, с какого устройства сидит пользователь (iOS или Android)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 2. Достаем нужную ссылку из вклеенного конфига
    let finalUrl = "";
    if (typeof buildConfig !== "undefined") {
        // Берем ссылку под нужную платформу
        finalUrl = isIOS ? buildConfig.appStoreUrl : buildConfig.googlePlayUrl;
        
        // Предохранитель: если менеджер забыл вписать ссылку для iOS, берем Android, и наоборот
        if (!finalUrl) {
            finalUrl = buildConfig.googlePlayUrl || buildConfig.appStoreUrl;
        }
    } else {
        // Фоллбэк для режима разработки (когда вы запускаете npm run dev и buildConfig еще не вклеен)
        finalUrl = "https://play.google.com/store/apps/details?id=com.your.game"; 
    }

    // 3. Стандартная логика редиректа для сетей
    if (typeof window.FbPlayableAd !== 'undefined') window.FbPlayableAd.onCTAClick();
    
    if (typeof mraid !== "undefined") {
        if (mraid.open) mraid.open(finalUrl);
        else window.open(finalUrl, "_blank");
    } else {
        window.open(finalUrl, "_blank");
    }
}



// ==========================================
// МЕНЕДЖЕР ЗВУКОВЫХ ЭФФЕКТОВ И ПАУЗЫ
// ==========================================

let isGameMuted = false;

// Хранилище для всех звуков, которые звучат прямо сейчас
const activeSounds = new Set(); 

function playSound(soundUrl, volume = 1.0) {
    if (isGameMuted) return; 

    const sfx = new Audio(soundUrl);
    sfx.volume = volume;
    
    // 1. Добавляем звук в список активных
    activeSounds.add(sfx);

    // 2. Когда звук закончится, удаляем его из списка (очистка памяти)
    sfx.onended = () => {
        activeSounds.delete(sfx);
    };

    // Запускаем звук
    sfx.play().catch(e => {
        console.warn("Звук заблокирован", e);
        activeSounds.delete(sfx); // Если ошибка, тоже удаляем
    });
}

// Выключаем игру и ВСЕ текущие звуки
function pauseGame() {
    isGameMuted = true;
    PIXI.Ticker.shared.stop(); 
    
    // Проходимся по всем звукам, которые играют прямо сейчас, и глушим их!
    activeSounds.forEach(sfx => {
        sfx.pause();
    });
}

// Включаем игру при возвращении
function resumeGame() {
    isGameMuted = false;
    PIXI.Ticker.shared.start(); 
    
    // Возобновляем звуки с того же места, где они остановились
    activeSounds.forEach(sfx => {
        sfx.play().catch(() => {});
    });
}

// 1. СЛУШАТЕЛЬ БРАУЗЕРА 
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pauseGame();
    } else {
        resumeGame();
    }
});

// 2. СЛУШАТЕЛЬ MRAID
if (typeof mraid !== "undefined") {
    mraid.addEventListener("viewableChange", (isViewable) => {
        if (isViewable) {
            resumeGame();
        } else {
            pauseGame();
        }
    });
}


const iceFramesRaw = import.meta.glob('./assets/icew/*.webp', { eager: true, import: 'default' });

const penguienFramesRaw = import.meta.glob('./assets/penguienW/*.webp', { eager: true, import: 'default' });

const penguienSortedKeys = Object.keys(penguienFramesRaw).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
});

const penguienFrameUrls = penguienSortedKeys.map(key => penguienFramesRaw[key]);


const helic1FramesRaw = import.meta.glob('./assets/helic1/*.webp', { eager: true, import: 'default' });

const helic2FramesRaw = import.meta.glob('./assets/helic2/*.webp', { eager: true, import: 'default' });


const helic1SortedKeys = Object.keys(helic1FramesRaw).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
});

const helic2SortedKeys = Object.keys(helic2FramesRaw).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
});

const helic1FrameUrls = helic1SortedKeys.map(key => helic1FramesRaw[key]);

const helic2FrameUrls = helic2SortedKeys.map(key => helic2FramesRaw[key]);

// 2. Сортируем ключи, чтобы кадр 10.png не встал перед 2.png
const sortedKeys = Object.keys(iceFramesRaw).sort((a, b) => {
    // Вытаскиваем числа из названий файлов для правильной сортировки
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
});

// 3. Создаем массив ссылок на отсортированные картинки
const iceFrameUrls = sortedKeys.map(key => iceFramesRaw[key]);






const init = async () => {
    try {
        
        await document.fonts.ready;

        await PIXI.Assets.load({
            alias: 'softhyphen',
            src: 'data:font/woff2;charset=utf-8;base64,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'
            });

            



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


        const motionBlur = new PIXI.BlurFilter();
        motionBlur.strengthX = 0; // Изначально размытия нет
        motionBlur.strengthY = 0;

        const [backgroundTex , ledTex, cashoutTex , playbuttonTex ,  logoTex , ledbonusTex , getBonusTex , euro500Tex , seaBedTex , kruchokTex , fishTex , handTex , penguienTex , cranTex , cranMachineTex , balanceTex , euro100Tex , avatarTex] = await Promise.all([
            loadTextureDirectly(backgroundIMG), loadTextureDirectly(ledIMG),
            loadTextureDirectly(cashoutIMG), loadTextureDirectly(playbuttonIMG),
            loadTextureDirectly(logoImg),
            loadTextureDirectly(ledbonusIMG), loadTextureDirectly(getbonusIMG),
            loadTextureDirectly(euro500IMG) , loadTextureDirectly(dnoIMG),
            loadTextureDirectly(kruchokIMG), loadTextureDirectly(fishIMG),
            loadTextureDirectly(handIMG) , loadTextureDirectly(penguienIMG),
            loadTextureDirectly(cranIMG) , loadTextureDirectly(cranMachineIMG),
            loadTextureDirectly(balanceImg), loadTextureDirectly(euro100IMG),
            loadTextureDirectly(avatarIMG)

        ]);

        // 1. ФОН (Остается отдельно)
        const backgroundSprite = new PIXI.Sprite({ texture: backgroundTex });
        backgroundSprite.anchor.set(0.5);
        app.stage.addChild(backgroundSprite);

        const seaBackgroundSprite = new PIXI.Sprite({ texture: seaBedTex });
        seaBackgroundSprite.anchor.set(0.5);
        app.stage.addChild(seaBackgroundSprite);
        seaBackgroundSprite.visible = false;

        // 2. ЕДИНЫЙ ИГРОВОЙ КОНТЕЙНЕР ДЛЯ ВСЕГО
        const gameContainer = new PIXI.Container();
        app.stage.addChild(gameContainer);

        const seaBedContainer = new PIXI.Container();
        app.stage.addChild(seaBedContainer);
        seaBedContainer.visible = false;


        const uiOverlayContainer = new PIXI.Container();
        app.stage.addChild(uiOverlayContainer);

        // ==========================================================
        // РАССТАНОВКА (Координата 0,0 - это строгий ЦЕНТР вашей игры)
        // Верх экрана это примерно Y = -900, Низ экрана это Y = 900
        // ==========================================================

        const ledSprite = new PIXI.Sprite({ texture: ledTex });
        ledSprite.anchor.set(0.5);
        ledSprite.scale.set(1.3);
        ledSprite.position.set(200, 340); // Пингвин/Лунка строго по центру
        gameContainer.addChild(ledSprite);

        const logoSprite = new PIXI.Sprite({ texture: logoTex });
        logoSprite.anchor.set(0.5, 0.5);
        logoSprite.position.set(-200, -700); // Сильно вверх
        logoSprite.scale.set(0.6);
        uiOverlayContainer.addChild(logoSprite);

        const balanceSprite = new PIXI.Sprite({ texture: balanceTex });
        balanceSprite.anchor.set(0.5, 0.5);
        balanceSprite.position.set(300, -700); // Сильно вверх
        balanceSprite.scale.set(0.6);


        function createHelicopterWithHook(textures, scaleValue) {
            const container = new PIXI.Container();
            container.scale.set(scaleValue);

            // 1. КРЮК (Добавляется первым, чтобы быть ПОЗАДИ вертолета)
            const hook = new PIXI.Sprite({ texture: kruchokTex });
            hook.anchor.set(0.5, 0); // Якорь СВЕРХУ, чтобы Y=0 был началом троса
            hook.position.set(0, -1000); // Прячем внутри вертолета
            hook.scale.set(1.5); // Масштаб крюка (настройте, если он мелкий)
            container.addChild(hook);

            // 2. ВЕРТОЛЕТ (Анимация)
            const heli = new PIXI.AnimatedSprite(textures);
            heli.anchor.set(0.5, 0.5);
            heli.play();
            container.addChild(heli);

            // 3. МАСКА ДЛЯ КРЮКА (Обрезает всё, что выше пуза вертолета)
            const mask = new PIXI.Graphics();
            // Координаты: X, Y, Ширина, Высота
            // Y = 20 означает, что крюк будет виден только начиная с 20 пикселей ниже центра вертолета
            mask.rect(-300, 20, 600, 1500); 
            mask.fill(0xffffff);
            container.addChild(mask);
            
            // Применяем маску к крюку
            hook.mask = mask;

            // Сохраняем ссылку на крюк внутри контейнера, чтобы мы могли его двигать
            container.hook = hook;

            return container;
        }

        // Создаем первый вертолет
        const helic1Textures = await Promise.all(helic1FrameUrls.map(url => loadTextureDirectly(url)));
        const helicContainer1 = createHelicopterWithHook(helic1Textures, 0.6);
        helicContainer1.position.set(850, -50);
        gameContainer.addChild(helicContainer1);

        // Создаем второй вертолет
        const helic2Textures = await Promise.all(helic2FrameUrls.map(url => loadTextureDirectly(url)));
        const helicContainer2 = createHelicopterWithHook(helic2Textures, 0.6);
        helicContainer2.position.set(880, 0);
        gameContainer.addChild(helicContainer2);






        //const explosion = new PIXI.AnimatedSprite(iceTextures);

        uiOverlayContainer.addChild(balanceSprite);

        const cranMachineSprite = new PIXI.Sprite({ texture: cranMachineTex });
        cranMachineSprite.anchor.set(0.5, 0.5);
        cranMachineSprite.position.set(-190, -150);
        cranMachineSprite.scale.set(0.8);

        gameContainer.addChild(cranMachineSprite);

        const cranSprite = new PIXI.Sprite({ texture: cranTex });
        cranSprite.anchor.set(0.5, 0.5);
        cranSprite.position.set(-200, -640);
        cranSprite.scale.set(0.8);
        gameContainer.addChild(cranSprite);

        // ==========================================
        // МАСКА ДЛЯ КРАНА (Чтобы скрыть верхние тросы)
        // ==========================================
        const cranMask = new PIXI.Graphics();
        
        // Координаты: X, Y, Ширина, Высота.
        // X = -250 (чуть левее крана), Ширина = 150
        // Y = -400 (ЭТО ЧИСЛО ВАМ НУЖНО НАСТРОИТЬ, чтобы оно совпало с краем стрелы)
        cranMask.rect(-400, -600, 850, 1200);

        cranMask.rotation = Math.PI / 2.7; // Например, 45 градусов
        
        // ВРЕМЕННАЯ КРАСНАЯ ЗАЛИВКА ДЛЯ НАСТРОЙКИ:
        cranMask.fill({ color: 0xff0000, alpha: 0.5 });
        
        
        gameContainer.addChild(cranMask);
        
        // Применяем маску к тросам крана
        cranSprite.mask = cranMask;

        // Как только настроите Y, удалите строку с .fill() 
        // или сделайте alpha: 0


        const cashoutSprite = new PIXI.Sprite({ texture: cashoutTex });
        cashoutSprite.anchor.set(0.5, 0.5);
        cashoutSprite.position.set(-180, 820); // Сильно вниз
        cashoutSprite.scale.set(0.53);
        uiOverlayContainer.addChild(cashoutSprite);

        const playButtonSprite = new PIXI.Sprite({ texture: playbuttonTex });
        playButtonSprite.anchor.set(0.5, 0.5);
        playButtonSprite.position.set(180, 820); // Сильно вниз
        playButtonSprite.scale.set(0.53);
        uiOverlayContainer.addChild(playButtonSprite);

        const penguienSprite = new PIXI.Sprite({ texture: penguienTex });
        penguienSprite.anchor.set(0.5, 0.5);
        penguienSprite.position.set(60, 80); // Сильно вниз
        penguienSprite.scale.set(3);
        penguienSprite.eventMode = 'none';
        gameContainer.addChild(penguienSprite);


        const kruchokSprite = new PIXI.Sprite({ texture: kruchokTex });
        kruchokSprite.anchor.set(0.5 , 0.5);
        kruchokSprite.position.set(0 , -500);
        kruchokSprite.scale.set(2.1);
        seaBedContainer.addChild(kruchokSprite);

        const caughtFish = new PIXI.Sprite({ texture: fishTex });
        caughtFish.visible = false;


        const disclaimer = new PIXI.Text("for illustrative purposes only" , {
            fontFamily: 'softhyphen',
            fontSize: 52,
            fontWeight: 'normal',
            fill: '#000000',
            stroke: { color: '#ffffff', width: 6 },
            align: 'center',
            alpha: 0.6 // чтобы не отвлекало от игры
        });

// Размещаем внизу по центру
        disclaimer.anchor.set(0.5, 1);
        disclaimer.x = 0;
        disclaimer.y = 910 
        //uiOverlayContainer.addChild(disclaimer);




    // ============================================
    // ПЕРЕМЕННЫЕ ДЛЯ ДЕНЕГ (изменяются независимо)
    // ============================================
    let balanceValue = 0;    // текущий баланс
    let cashoutValue = 0;    // текущий кешаут

    let balanceTarget = 0;   // цель для плавного счёта
    let cashoutTarget = 0;

    // ============================================
    // СТИЛЬ ТЕКСТА (общий для всех кнопок)
    // ============================================
    const moneyTextStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 118,
        fontWeight: 'bold',
        fill: '#101280',
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 6,
        dropShadowDistance: 2,
        stroke: { color: '#0e0801', width: 0 }
    });

    const buttonLabelStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 152,
        fontWeight: 'bold',
        fill: '#101280',
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 6,
        dropShadowDistance: 2,
        stroke: { color: '#000408', width: 0 }
    });

    const GetBonusButtonLabelStyle = new PIXI.TextStyle({
        fontFamily: 'softhyphen',
        fontSize: 100,
        fontWeight: 'bold',
        fill: '#1e1f7e',
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 6,
        dropShadowDistance: 2,
        stroke: { color: '#b5d8fa', width: 0 }
    });

    // ============================================
    // ТЕКСТ "PLAY" НА КНОПКЕ PLAY
    // ============================================
    const playButtonText = new PIXI.Text({ text: getT('play'), style: buttonLabelStyle });
    playButtonText.anchor.set(0.5);
    playButtonText.position.set(0, -50 ); // Центр спрайта кнопки
    playButtonSprite.addChild(playButtonText);





    const claimButtonText = new PIXI.Text({ text: getT('claim'), style: buttonLabelStyle });
    playButtonText.anchor.set(0.5);
    playButtonText.position.set(0, -50); // Центр спрайта кнопки
    playButtonSprite.addChild(playButtonText);

    // ============================================
    // ТЕКСТ СУММЫ НА КНОПКЕ CASHOUT

    const cashoutGuideText = new PIXI.Text({ text: getT('cashout'), style: moneyTextStyle });
    cashoutGuideText.anchor.set(0.5);
    cashoutGuideText.scale.set(0.8);
    cashoutGuideText.position.set(0, -120);
    cashoutSprite.addChild(cashoutGuideText);
    // ============================================
    const cashoutText = new PIXI.Text({ text: '0 €', style: moneyTextStyle });
    cashoutText.anchor.set(0.5);
    cashoutText.position.set(0, 10);
    cashoutSprite.addChild(cashoutText);

    // ============================================
    // ТЕКСТ СУММЫ НА БАЛАНСЕ
    // ============================================
    const balanceText = new PIXI.Text({ text: '0 €', style: moneyTextStyle });
    balanceText.anchor.set(0.5);
    balanceText.position.set(0, 0); // чуть ниже центра спрайта баланса
    balanceSprite.addChild(balanceText);

    const tickerContainer = new PIXI.Container();

    createLiveTicker(uiOverlayContainer);

    // ============================================
    // ПЛАВНЫЙ СЧЁТЧИК (тикер обновляет каждый кадр)
    // ============================================
    const LERP_SPEED = 0.08; // скорость сглаживания (0.05 = медленно, 0.15 = быстро)

    app.ticker.add(() => {
        // Плавно тянем текущее значение к целевому
        if (Math.abs(balanceTarget - balanceValue) > 0.5) {
            balanceValue += (balanceTarget - balanceValue) * LERP_SPEED;
            balanceText.text = Math.round(balanceValue) + '€';
        } else if (balanceValue !== balanceTarget) {
            balanceValue = balanceTarget;
            balanceText.text = Math.round(balanceValue) + '€';
        }

        if (Math.abs(cashoutTarget - cashoutValue) > 0.5) {
            cashoutValue += (cashoutTarget - cashoutValue) * LERP_SPEED;
            cashoutText.text = Math.round(cashoutValue) + '€';
        } else if (cashoutValue !== cashoutTarget) {
            cashoutValue = cashoutTarget;
            cashoutText.text = Math.round(cashoutValue) + '€';
        }
    });

    // ============================================
    // МЕТОД: Добавить к балансу (с пружиной)
    // ============================================
    function addBalance(amount) {
        balanceTarget += amount;
        springBounceText(balanceText);
    }

    // ============================================
    // МЕТОД: Добавить к кешауту (с пружиной)
    // ============================================
    function addCashout(amount) {
        cashoutTarget += amount;
        springBounceText(cashoutText);
    }

    // ============================================
    // ПРУЖИНА НА ТЕКСТЕ
    // ============================================
    function springBounceText(textObj) {
        // Убиваем предыдущий тикер если он ещё крутится
        if (textObj._springTicker) {
            app.ticker.remove(textObj._springTicker);
            textObj._springTicker = null;
        }

        const baseScale = 1.0;
        let velocity = 0.35;   // начальный импульс (сила пружины)
        let current = 1.35;    // начальный масштаб (выпрыгивает до 1.35)
        const stiffness = 0.3; // жёсткость пружины
        const damping = 0.65;  // затухание (0 = вечно, 1 = мгновенно)

        const springTicker = (time) => {
            const force = (baseScale - current) * stiffness;
            velocity = (velocity + force) * damping;
            current += velocity;

            textObj.scale.set(current);

            // Останавливаем когда всё успокоилось
            if (Math.abs(velocity) < 0.001 && Math.abs(current - baseScale) < 0.001) {
                textObj.scale.set(baseScale);
                app.ticker.remove(springTicker);
                textObj._springTicker = null;
            }
        };

        textObj._springTicker = springTicker;
        app.ticker.add(springTicker);
    }



        const iceTextures = await Promise.all(iceFrameUrls.map(url => loadTextureDirectly(url)));

        const penguienTextures = await Promise.all(penguienFrameUrls.map(url => loadTextureDirectly(url)));



        //const uiOverlayContainer = new PIXI.Container();
        //app.stage.addChild(uiOverlayContainer);


        const blurFilter = new PIXI.BlurFilter();
        blurFilter.strength = 10; // Сила размытия


        function getT(key) {
            if (typeof buildConfig === "undefined") {
                const fallback = { 
                    "win": "WIN", 
                    "install": "INSTALL NOW", 
                    "disclaimer": "For illustrative purposes only",
                    "claim": "CLAIM",
                    "cashout": "CASH OUT",
                    "welcome": "WELCOME BONUS",
                    "play" : "PLAY",

                };
                return fallback[key] || "TEXT_ERROR";
            }

            const lang = buildConfig.language || "EN";
            
            if (buildConfig.translations && buildConfig.translations[lang]) {
                return buildConfig.translations[lang][key] || key; // Если ключа нет, вернет само название ключа
            }
            
            // Дефолтные значения для EN (Английский)
            const fallback = { 
                "win": "WIN", 
                "install": "INSTALL NOW", 
                "disclaimer": "For illustrative purposes only",
                "claim": "CLAIM",
                "cashout": "CASH OUT",
                "welcome": "WELCOME BONUS",
                "play" : "PLAY",
            };
            return fallback[key] || "TEXT_ERROR";
        }


        function showWelcomeBonus() {

            gameContainer.filters = [blurFilter];
            backgroundSprite.filters = [blurFilter];

            const ledbonusSprite = new PIXI.Sprite({ texture: ledbonusTex });
            ledbonusSprite.anchor.set(0.5, 0.5);
            ledbonusSprite.position.set(0 , 0); // Сильно вниз
            ledbonusSprite.scale.set(0);


            const welcomeButtonText = new PIXI.Text({ text: getT('welcome'), style: GetBonusButtonLabelStyle });
            welcomeButtonText.anchor.set(0.5);
            welcomeButtonText.position.set(0, -150); // Центр спрайта кнопки
            ledbonusSprite.addChild(welcomeButtonText);



            const getbonusSprite = new PIXI.Sprite({ texture: getBonusTex });


            const welcomeMoneyButtonText = new PIXI.Text({ text: '1500€', style: buttonLabelStyle});
            welcomeMoneyButtonText.anchor.set(0.5);
            welcomeMoneyButtonText.fontSize = 230;
            welcomeMoneyButtonText.position.set(0, 30); // Цент
            ledbonusSprite.addChild(welcomeMoneyButtonText);

            const claimButtonText = new PIXI.Text({ text: getT('claim'), style: moneyTextStyle});
            claimButtonText.anchor.set(0.5);
            claimButtonText.fontSize = 230;
            claimButtonText.position.set(0, -30); // Цент
            getbonusSprite.addChild(claimButtonText);

            getbonusSprite.anchor.set(0.5, 0.5);
            getbonusSprite.position.set(0 , 210); // Сильно вниз
            getbonusSprite.scale.set(0);


            
            uiOverlayContainer.addChild(ledbonusSprite);
            uiOverlayContainer.addChild(getbonusSprite);
            playBounce(ledbonusSprite , 0.8 , 0.75);
            playBounce(getbonusSprite , 0.8 , 0.55);

            getbonusSprite.eventMode = 'static';

            const tutorialHand = showTutorialHand(600, 800, getbonusSprite.x + 100 , getbonusSprite.y + 70);




            getbonusSprite.on('pointerdown', () => {
                pressButton(getbonusSprite, () => {
                    ledbonusSprite.visible = false;
                    getbonusSprite.visible = false;
                    tutorialHand.visible = false;
                    playSound(clickMP3);
                    playIceExplosion(0, 0); // Не забудьте передать координаты взрыву!
                    
                    setTimeout(() => {
                        spawnMoney(0, 0);

                    }, 500);

                    setTimeout(() => {
                        playSound(collectMP3);
                    }, 1900);

                    // КАМЕРА ПАДАЕТ ВНИЗ
                    setTimeout(() => {
                        uiOverlayContainer.visible = false;
                        transitionToSeaBed(gameContainer, seaBedContainer, backgroundSprite, seaBackgroundSprite);
                        
                        // ПРАВИЛЬНАЯ АНИМАЦИЯ КРЮЧКА (Без setTimeout внутри тикера)
                        let hookTimer = 0;
                        const moveDown = (time) => {
                            kruchokSprite.position.y += 2 * time.deltaTime; // Скорость крючка
                            hookTimer += time.deltaTime;
                            
                            // Останавливаем через ~90 кадров (1.5 секунды)
                            if (hookTimer >= 90) {
                                app.ticker.remove(moveDown);
                            }
                        };
                        app.ticker.add(moveDown);
                        
                    }, 2800);

                    // ПОЯВЛЕНИЕ РЫБ (Через 2.5 секунды, когда камера уже под водой)
                    setTimeout(() => {
                        // Аргументы: x, y, направление(1=вправо, -1=влево), масштаб, текст, скорость
                        
                        // Мелкие рыбки плывут быстро
                        spawnSingleFish(-2200, -200,  1, 0.3, "5x",  35.5); // Слева направо (вверху)
                        spawnSingleFish( 2200, -100, -1, 0.4, "3x",  45.0); // Справа налево
                        
                        // Средние рыбки
                        spawnSingleFish(-1900,  100,  1, 0.5, "10x", 43.8);
                        spawnSingleFish(-2200,  -600,  1, 0.5, "10x", 53.8); 
                        spawnSingleFish( 2200,  250, -1, 0.6, "25x", 48.2);
                        spawnSingleFish( -1700,  -250, 1, 0.6, "25x", 35.2); 
                        
                        // Гигантская рыба плывет медленно по самому дну
                        spawnSingleFish(-2200,  450,  1, 0.65, "100x", 40.6);

                        spawnSingleFish(-2600,  850,  1, 0.65, "200x", 40.6); 

                    }, 2500);


                    setTimeout(()=>{
                        uiOverlayContainer.visible = true;
                        transitionToSeaBed(seaBedContainer , gameContainer , seaBackgroundSprite , backgroundSprite);
                        const tutorialHand = showTutorialHand(600, 800, playButtonSprite.x , playButtonSprite.y);
                        playButtonSprite.eventMode = 'static';
                        playButtonSprite.cursor = 'pointer';

                        playButtonSprite.on('pointerdown', ()=>{
                        pressButton(playButtonSprite , ()=>{
                            playButtonSprite.eventMode = 'none';
                            playSound(clickMP3);
                            tutorialHand.visible = false;
                            penguienStartFishingAnimation()

                        });
                    });





                    } , 5000);

                });



                
                gameContainer.filters = []; 
                console.log("Бонус забран!");
            });

        }


        // ==========================================
// UI: ПЛАШКА LIVE WINS (ФЕЙКОВЫЙ ОНЛАЙН)
// ==========================================
// ==========================================
// UI: ПЛАШКА LIVE WINS (ГРАДИЕНТ И ИКОНКА)
// ==========================================
function createLiveTicker(parentContainer) {
    
    tickerContainer.position.set(0, -600); 

    const bgWidth = 1000;
    const bgHeight = 65;

    // 1. ФОН (Градиент от прозрачного к синему и обратно к прозрачному)
    const bg = new PIXI.Graphics();
    
    // В PixiJS v8 градиенты создаются так:
    const fillGradient = new PIXI.FillGradient(0, 0, bgWidth, 0); 
    // Точки градиента: (позиция 0-1, цвет)
    fillGradient.addColorStop(0, 0x0088ff);    // Левый край (синий)
    fillGradient.addColorStop(0.5, 0x0088ff);  // Центр (синий)
    fillGradient.addColorStop(1, 0x0088ff);    // Правый край (синий)
    
    // Рисуем плашку
    bg.rect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);
    bg.fill(fillGradient);
    
    // Плавное растворение по краям (Маска прозрачности)
    // Чтобы сделать края полностью прозрачными, как на скриншоте
    const alphaGradient = new PIXI.Graphics();
    const alphaFill = new PIXI.FillGradient(0, 0, bgWidth, 0);
    alphaFill.addColorStop(0, 0x000000);   // Прозрачный (черный для маски)
    alphaFill.addColorStop(0.2, 0xffffff); // Видимый
    alphaFill.addColorStop(0.8, 0xffffff); // Видимый
    alphaFill.addColorStop(1, 0x000000);   // Прозрачный
    alphaGradient.rect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);
    alphaGradient.fill(alphaFill);
    
    tickerContainer.addChild(bg);
    tickerContainer.addChild(alphaGradient);
    bg.mask = alphaGradient; // Применяем маску к синему фону
    
    // Делаем весь фон полупрозрачным
    bg.alpha = 0.7;

    // 2. ИКОНКА ЮЗЕРА (Спрайт)
    // Используем загруженную текстуру avatarTex
    const avatar = new PIXI.Sprite({ texture: avatarTex });
    avatar.anchor.set(0.5);
    avatar.scale.set(1); // Настройте масштаб вашей иконки
    avatar.position.set(-bgWidth / 2 + 50, 0);
    
    // Базовый цвет (красный)
    avatar.tint = 0xff5555; 
    
    tickerContainer.addChild(avatar);

    // Стили текста
    const nameStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 34, fill: '#ffffff', fontWeight: 'bold' });
    const winStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 34, fill: '#42f554', fontWeight: '900' });
    const staticStyle = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 30, fill: '#80c8ff', fontWeight: 'bold' });

    // 3. ДИНАМИЧНЫЙ ТЕКСТ
    const dynamicTextContainer = new PIXI.Container();
    dynamicTextContainer.position.set(-bgWidth / 2 + 90, 0);
    tickerContainer.addChild(dynamicTextContainer);

    const nameText = new PIXI.Text({ text: "Pink Outsand", style: nameStyle });
    nameText.anchor.set(0, 0.5);
    
    const winText = new PIXI.Text({ text: "+€2504.00", style: winStyle });
    winText.anchor.set(0, 0.5);
    winText.position.set(nameText.width + 15, 0); 

    dynamicTextContainer.addChild(nameText);
    dynamicTextContainer.addChild(winText);

    // 4. СТАТИЧНЫЙ ТЕКСТ
    const liveWinsText = new PIXI.Text({ text: "Live wins", style: staticStyle });
    liveWinsText.anchor.set(0.5, 0.5);
    liveWinsText.position.set(100, 0);
    tickerContainer.addChild(liveWinsText);

    const onlineText = new PIXI.Text({ text: "Online: 11489", style: staticStyle });
    onlineText.anchor.set(1, 0.5); 
    onlineText.position.set(bgWidth / 2 - 40, 0);
    tickerContainer.addChild(onlineText);

    parentContainer.addChild(tickerContainer);

    // ==========================================
    // ЛОГИКА ФЕЙКОВЫХ ДАННЫХ
    // ==========================================
    const fakeNames = ["LuckyDove85", "SnowKing99", "IceFisher", "JackpotHunter", "PenguinPro", "BigWin22", "FrostyBite"];
    
    // Палитра цветов для перекраски аватарки
    const avatarColors = [0xff5555, 0x55ff55, 0x5555ff, 0xffff55, 0xff55ff, 0x55ffff, 0xffaa00];
    
    let onlineCount = 11489;

    function updateTickerData() {
        let fadeOutProgress = 0;
        
        const fadeOutTicker = (time) => {
            fadeOutProgress += time.deltaTime / 15;
            dynamicTextContainer.alpha = 1 - fadeOutProgress;
            dynamicTextContainer.position.y = -(fadeOutProgress * 20);

            if (fadeOutProgress >= 1) {
                app.ticker.remove(fadeOutTicker);
                
                // --- НОВЫЕ ДАННЫЕ И ЦВЕТА ---
                nameText.text = fakeNames[Math.floor(Math.random() * fakeNames.length)];
                winText.text = "+€" + (Math.random() * 5000 + 50).toFixed(2);
                winText.position.x = nameText.width + 15; 
                
                // Меняем цвет иконки (tint)
                avatar.tint = avatarColors[Math.floor(Math.random() * avatarColors.length)];

                onlineCount += Math.floor(Math.random() * 11) - 3;
                onlineText.text = "Online: " + onlineCount;

                let fadeInProgress = 0;
                dynamicTextContainer.position.y = 20;

                const fadeInTicker = (time) => {
                    fadeInProgress += time.deltaTime / 15;
                    dynamicTextContainer.alpha = fadeInProgress;
                    dynamicTextContainer.position.y = 20 - (fadeInProgress * 20);

                    if (fadeInProgress >= 1) {
                        dynamicTextContainer.alpha = 1;
                        dynamicTextContainer.position.y = 0;
                        app.ticker.remove(fadeInTicker);
                    }
                };
                app.ticker.add(fadeInTicker);
            }
        };
        app.ticker.add(fadeOutTicker);
    }

    setInterval(updateTickerData, 9000);
}

// Переменная для остановки спавна (если понадобится)
        let isSpawningFish = false;
/**
         * Плавно меняет зум камеры игрового мира
         * @param {number} targetZoom - Конечный масштаб (например 0.65)
         * @param {number} durationSeconds - Длительность в секундах
         * @param {Function} onComplete - Колбэк по завершении
         */
function animateCameraZoom(targetZoom, durationSeconds, onComplete) {
    const startZoom = cameraZoom;
    let progress = 0;

    const zoomTicker = (time) => {
        progress += time.deltaTime / (durationSeconds * 60);

        if (progress >= 1) {
            cameraZoom = targetZoom;
            app.ticker.remove(zoomTicker);
            resize(); 
            if (onComplete) onComplete();
        } else {
            const ease = 1 - Math.pow(1 - progress, 3);
            // Просто плавно меняем зум
            cameraZoom = startZoom + (targetZoom - startZoom) * ease;
            resize(); 
        }
    };
    app.ticker.add(zoomTicker);
}


function penguienStartFishingAnimation() {
            // 1. Прячем статичного пингвина
            penguienSprite.visible = false;

            setTimeout(()=>{
                getMoneyFromFish(8);
            } , 1000);
            

            // 2. Создаем анимированного
            const animatedPenguin = new PIXI.AnimatedSprite(penguienTextures);
            animatedPenguin.anchor.set(0.5, 0.5);
            animatedPenguin.position.set(penguienSprite.x, penguienSprite.y);
            animatedPenguin.scale.set(penguienSprite.scale.x);
            
            animatedPenguin.animationSpeed = 0.25;
            animatedPenguin.loop = false; 

            gameContainer.addChild(animatedPenguin);
            animatedPenguin.play();

            const animDurationSeconds = (penguienTextures.length / animatedPenguin.animationSpeed) / 60;

            const holeX = 230; 
            const startY = 1300; 
            const targetY = 950; 

            pullUpFish(holeX, startY, targetY, animDurationSeconds, () => {
                const originMachineX = cranMachineSprite.position.x;
                const originMachineY = cranMachineSprite.position.y;
                const originCranX = cranSprite.position.x;
                const originCranY = cranSprite.position.y;


                setTimeout(() => {
                    

                    

                    moveAndScale(cranMachineSprite, 0, -200, 1, 1, () => {
                        setTimeout(() => {
                        animateCameraZoom(0.94, 3, () => {
                                console.log("Камера отдалена!");
                                setTimeout(() => {  }, 500);
                            });
                        } , 1000);
                    });
                    setTimeout(()=>{
                            getMoneyFromFish(13);
                            struggleFish(caughtFish, 1);
                        } , 2000);
                    
                    playSound(cranMP3);

                    moveAndScale(cranSprite, 0, -800, 1, 1, () => {
                        animateCrane(cranSprite, cranSprite.position.y + 620, 2, 2, () => {
                            

                            
                            
                            setTimeout(() => {
                                // Возвращаем машину
                                moveAndScale(cranMachineSprite, originMachineX, originMachineY, 0.8, 0.8, () => {});


                                
                                // Возвращаем кран И ЗАПУСКАЕМ ВЕРТОЛЕТЫ
                                
                                moveAndScale(cranSprite, originCranX, originCranY, 0.8, 0.8, () => {
                                    
                                    // ЭТАП 1: ПЕРВЫЙ ВЕРТОЛЕТ
                                    const helic1OriginX = helicContainer1.x;
                                    const helic1OriginY = helicContainer1.y;
                                    const helicOffset = 1300; 
                                    const hookScale = helicContainer1.hook.scale.x;
                                    setTimeout(()=>{
                                         getMoneyFromFish(18);
                                         struggleFish(caughtFish, 1);
                                    } , 3100);

                                    setTimeout(()=>{
                                        
                                        animateCameraZoom(0.89, 3, () => {
                                        console.log("Камера отдалена!");
                                        setTimeout(() => {  }, 2500);
                                    });
                                    } , 2500);

                                    playSound(helicMP3);
                                    setTimeout(() => {playSound(helicMP3);  }, 4500);

                                    moveAndScale(helicContainer1, caughtFish.x, caughtFish.y - helicOffset, 0.6, 2.0, () => {
                                        
                                        moveAndScale(helicContainer1.hook, 0, 100, hookScale, 2.0, () => {
                                            const liftDist1 = 200;
                                            const fishScale = Math.abs(caughtFish.scale.x);

                                            strainHelicopter(helicContainer1, 1.5);
                                            
                                            setTimeout(()=>{
                                                getMoneyFromFish(7);
                                                struggleFish(caughtFish, 1);
                                            } , 4300);

                                            

                                            

                                            moveAndScale(helicContainer1.hook, 0, -1400, hookScale, 3);
                                            moveAndScale(caughtFish, caughtFish.x, caughtFish.y - liftDist1, fishScale, 1, () => {
                                                
                                                //moveAndScale(helicContainer1.hook, 0, 0, hookScale, 0.5); 
                                                moveAndScale(helicContainer1, helic1OriginX, helic1OriginY, 0.6, 1.5, () => {
                                                    
                                                    // ЭТАП 2: ВТОРОЙ ВЕРТОЛЕТ
                                                    const helic2OriginX = helicContainer2.x;
                                                    const helic2OriginY = helicContainer2.y;

                                                    moveAndScale(helicContainer2, caughtFish.x, caughtFish.y - helicOffset, 0.6, 1.0, () => {
                                                        moveAndScale(helicContainer2.hook, 0, 100, hookScale, 1.0, () => {
                                                            const liftDist2 = 350;
                                                            const fastPull = 0.5;  // ОЧЕНЬ БЫСТРО (0.5 сек вместо 2.0)

                                                            strainHelicopter(helicContainer2, fastPull);
                                                            moveAndScale(helicContainer2.hook, 0, 0, hookScale, 2.0);
                                                            moveAndScale(caughtFish, caughtFish.x, caughtFish.y - liftDist2, fishScale, 2.0, () => {
                                                                
                                                                
                                                            });

                                                            setTimeout(() => { moveAndScale(helicContainer2 , helicContainer2.x , helicContainer2.y - 600 , 0.6 , 1.3)}, 100);
                                                  
                                                            });
                                                            setTimeout(()=>{
                                                                addCashout(30000);
                                                                playSound(winMP3)
                                                                playIceExplosion(0 , 0 , true);
                                                                gameContainer.filters = [blurFilter];
                                                                backgroundSprite.filters = [blurFilter];
                                                                const installButtonStyle = new PIXI.TextStyle({
                                                                
                                                                fontFamily: 'softhyphen', // Ваш загруженный шрифт
                                                                fontSize: 100, 
                                                                fontWeight: 'bold',
                                                                // Сочный градиент от белого к желтому/золотому
                                                                fill: '#012b08', 
                                                                stroke: { color: '#ffffff', width: 0 }, // Толстая коричнево-золотая обводка

                                                                letterSpacing: 5, // Немного раздвинем буквы для читаемости
                                                            });

// --- ТЕКСТ WIN ---
                                                                const welcomeButtonText = new PIXI.Text({ text: getT('win'), style: GetBonusButtonLabelStyle });
                                                                welcomeButtonText.anchor.set(0.5);
                                                                welcomeButtonText.position.set(0, -270);
                                                                uiOverlayContainer.addChild(welcomeButtonText);

// --- СУММА ---
                                                                const welcomeMoneyButtonText = new PIXI.Text({ text: '€33,321', style: GetBonusButtonLabelStyle });
                                                                welcomeMoneyButtonText.anchor.set(0.5);
                                                                welcomeMoneyButtonText.style.fontSize = 190; // Меняем через стиль для надежности
                                                                welcomeMoneyButtonText.position.set(0, 50);
                                                                uiOverlayContainer.addChild(welcomeMoneyButtonText);

                                                                // --- КНОПКА КАРТИНКА ---
                                                                const getbonusSprite = new PIXI.Sprite({ texture: getBonusTex });
                                                                getbonusSprite.anchor.set(0.5);
                                                                getbonusSprite.scale.set(1);
                                                                getbonusSprite.position.set(0, 450); // Чуть опустил, чтобы не жалось к тексту
                                                                getbonusSprite.eventMode = 'static';
                                                                getbonusSprite.cursor = 'pointer';
                                                                uiOverlayContainer.addChild(getbonusSprite);

                                                                // --- ТЕКСТ НА КНОПКЕ (INSTALL NOW) ---
                                                                const claimButtonText = new PIXI.Text({ text: getT('install'), style: installButtonStyle });
                                                                claimButtonText.scale.set(0.85); 
                                                                claimButtonText.anchor.set(0.5);
                                                                
                                                                claimButtonText.position.set(0, 0); // Позиция внутри спрайта кнопки
                                                                getbonusSprite.addChild(claimButtonText);

                                                                // --- ЭФФЕКТ ПУЛЬСАЦИИ ТЕКСТА (чтобы точно кликнули) ---


                                                                // Клик по всей кнопке
                                                                getbonusSprite.on('pointerdown', () => {
                                                                    pressButton(getbonusSprite, openStore);
                                                                });
                                                                
                                                                claimButtonText.position.set(0, -30); // Цент
                                                                getbonusSprite.addChild(claimButtonText);

                                                                playButtonSprite.filters = [blurFilter];
                                                                cashoutSprite.filters = [blurFilter];
                                                                balanceSprite.filters = [blurFilter];
                                                                logoSprite.filters = [blurFilter];
                                                                tickerContainer.filters = [blurFilter];
                                                                

                                                                claimButtonText.eventMode = 'static';




                                                                claimButtonText.on('pointerdown', () => {
                                                                    openStore();
                                                                });
                                                                    




                                                            } , 2000);
                                                            
                                                            setTimeout(()=>{
                                                                animateCameraZoom(0.62, 1.5, () => {
                                                                console.log("Камера отдалена!");
                                                                
                                                                setTimeout(() => {}, 500);
                                                            } , 2600);
                                                            } , 900)

                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            }, 500);
                        });

                        setTimeout(() => {
                            struggleFish(caughtFish, 1);
                            moveAndScale(caughtFish, caughtFish.x, caughtFish.y - 10, 1, 2);
                        }, 1000);
                    });
                }, 200);
            });
        }


        // Функция "натуги" (вертолет трясется от тяжелой рыбы)
// Функция "натуги" (вертолет трясется и медленно поднимается вверх)
        // liftAmount - на сколько пикселей вертолет поднимется за время анимации (например, -100)
        function strainHelicopter(heliContainer, durationSeconds, liftAmount = -200) {
            const startX = heliContainer.position.x;
            const startY = heliContainer.position.y;
            let timer = 0;

            const strainTicker = (time) => {
                timer += time.deltaTime / 60; // Секунды
                const progress = timer / durationSeconds; // От 0 до 1

                if (progress >= 1) {
                    // Анимация закончена, фиксируем новую высоту
                    heliContainer.position.set(startX, startY + liftAmount);
                    app.ticker.remove(strainTicker);
                } else {
                    // 1. Мелкая, быстрая вибрация (Тряска)
                    const shakeIntensity = 4; // Сила тряски
                    const shakeX = Math.sin(timer * 60) * shakeIntensity;
                    const shakeY = Math.cos(timer * 70) * shakeIntensity;

                    // 2. Плавный подъем вверх (Ease-Out)
                    // Чем больше progress, тем выше вертолет
                    const ease = 1 - Math.pow(1 - progress, 2);
                    const currentLift = liftAmount * ease;

                    // Применяем позицию = Старт + Подъем + Тряска
                    heliContainer.position.x = startX + shakeX;
                    heliContainer.position.y = startY + currentLift + shakeY;
                }
            };
            
            app.ticker.add(strainTicker);
        }


        // Функция тряски (сопротивления) рыбы
        function struggleFish(fishSprite, durationSeconds, onComplete) {
            let timer = 0;
            
            // Запоминаем изначальный угол и позицию X, чтобы вернуть их в норму в конце
            const startRotation = fishSprite.rotation;
            const startX = fishSprite.position.x;

            const struggleTicker = (time) => {
                timer += time.deltaTime / 60; // Переводим кадры в секунды

                if (timer >= durationSeconds) {
                    // Время вышло: возвращаем рыбу в ровное положение
                    fishSprite.rotation = startRotation;
                    fishSprite.position.x = startX;
                    
                    app.ticker.remove(struggleTicker);
                    
                    if (onComplete) onComplete(); // Вызываем действие после тряски
                } else {
                    // ---- НАСТРОЙКИ ТРЯСКИ ----
                    // Скорость биения (чем больше число, тем быстрее дергается)
                    const shakeSpeed = 15; 
                    
                    // Угол отклонения (0.15 радиан = примерно 8.5 градусов)
                    const shakeAngle = 0.05; 
                    
                    // Смещение по оси X (дерганье влево-вправо на 3 пикселя)
                    const shakeOffsetX = 2; 

                    // Применяем математику (синус и косинус для хаотичности)
                    fishSprite.rotation = startRotation + Math.sin(timer * shakeSpeed) * shakeAngle;
                    
                    // Чтобы тряска казалась более "живой", X дергается чуть на другой частоте (shakeSpeed * 1.3)
                    fishSprite.position.x = startX + Math.cos(timer * shakeSpeed * 1.3) * shakeOffsetX;
                }
            };

            app.ticker.add(struggleTicker);
        }


        function animateCrane(cranObj, targetYDown, durationDown, durationUp, onComplete) {
            const startY = cranObj.position.y;
            let progress = 0;
            let isGoingDown = true;

            const craneTicker = (time) => {
                // Выбираем длительность в зависимости от того, опускаем или поднимаем
                const currentDuration = isGoingDown ? durationDown : durationUp;
                progress += time.deltaTime / (currentDuration * 60);

                if (progress >= 1) {
                    if (isGoingDown) {
                        // Фаза спуска закончена, сразу начинаем поднимать
                        isGoingDown = false;
                        progress = 0;
                    } else {
                        // Фаза подъема закончена
                        cranObj.position.y = startY; // Возвращаем на точную исходную
                        app.ticker.remove(craneTicker);
                        
                        if (onComplete) onComplete();
                    }
                } else {
                    // Плавное движение
                    const ease = 1 - Math.pow(1 - progress, 3); 
                    
                    if (isGoingDown) {
                        // Едем вниз
                        cranObj.position.y = startY + (targetYDown - startY) * ease;
                    } else {
                        // Едем вверх (от нижней точки к стартовой)
                        cranObj.position.y = targetYDown + (startY - targetYDown) * ease;
                    }
                }
            };

            app.ticker.add(craneTicker);
        }



        // Универсальная функция: Передвинуть и Увеличить
        function moveAndScale(object, targetX, targetY, targetScale, durationSeconds, onComplete) {
            const startX = object.position.x;
            const startY = object.position.y;
            
            // Сохраняем начальные масштабы и их знаки (вдруг объект отзеркален)
            const startScaleX = Math.abs(object.scale.x);
            const startScaleY = Math.abs(object.scale.y);
            const signX = Math.sign(object.scale.x) || 1;
            const signY = Math.sign(object.scale.y) || 1;

            let progress = 0;

            const animTicker = (time) => {
                progress += time.deltaTime / (durationSeconds * 60);

                if (progress >= 1) {
                    object.position.set(targetX, targetY);
                    object.scale.set(targetScale * signX, targetScale * signY);
                    app.ticker.remove(animTicker);
                    
                    if (onComplete) onComplete(); // Вызываем callback в конце
                } else {
                    // Плавное движение (Ease-Out)
                    const ease = 1 - Math.pow(1 - progress, 3);
                    
                    // Двигаем
                    object.position.x = startX + (targetX - startX) * ease;
                    object.position.y = startY + (targetY - startY) * ease;
                    
                    // Увеличиваем (Lerp от стартового масштаба к целевому)
                    const currentScaleX = startScaleX + (targetScale - startScaleX) * ease;
                    const currentScaleY = startScaleY + (targetScale - startScaleY) * ease;
                    
                    // Применяем масштаб с учетом изначального отзеркаливания
                    object.scale.set(currentScaleX * signX, currentScaleY * signY);
                }
            };

            app.ticker.add(animTicker);
        }

        function pullUpFish(startX, startY, targetY, durationSeconds, onComplete) {
            
            caughtFish.visible = true;
            caughtFish.anchor.set(0.5, 0.5);

            
            // 1. УМЕНЬШАЕМ МАСШТАБ (Подберите идеальный, например 0.6 или 0.8)
            caughtFish.scale.set(0.8); 
            
            caughtFish.position.set(startX, startY);
            gameContainer.addChild(caughtFish);

            // 2. МАГИЯ МАСКИ: Создаем прямоугольник, который обрежет рыбу
            // Рыба будет видна только внутри этого прямоугольника.
            const waterMask = new PIXI.Graphics();
            
            // Координаты маски: (X, Y, Ширина, Высота)
            // Мы рисуем маску от самого верха экрана (-1000) до линии воды (примерно Y = 380).
            // Всё, что ниже Y = 380, будет невидимым (скрыто подо льдом).
            waterMask.rect(-1000, -1000, 2000, 1430); 
            //waterMask.fill(0x4fffff); // Цвет не важен, это маска

            waterMask.fill({ color: 0xff0000, alpha: 0.5 }); 
            
            gameContainer.addChild(waterMask);
            
            // Применяем маску к нашей рыбе!
            caughtFish.mask = waterMask;

            let progress = 0;
            const pullTicker = (time) => {
                progress += time.deltaTime / (durationSeconds * 60);

                if (progress >= 1) {
                    caughtFish.position.y = targetY;
                    app.ticker.remove(pullTicker);
                    
                    // Маску можно удалить после анимации, если рыба улетела
                    // waterMask.destroy(); 
                    
                    if (onComplete) onComplete();
                } else {
                    // Плавно поднимаем рыбу
                    const ease = 1 - Math.pow(1 - progress, 3);
                    caughtFish.position.y = startY + (targetY - startY) * ease;
                }
            };

            app.ticker.add(pullTicker);
        }
        function startFishing(){

        }


        function spawnSingleFish(x, y, direction, scale, text, speed) {
            const fishGroup = new PIXI.Container();
            fishGroup.position.set(x, y);

            // 1. Спрайт рыбы
            const fish = new PIXI.Sprite({ texture: fishTex });
            fish.anchor.set(0.5);

            if (direction === 1) {
                // ---- ПЛЫВЕТ ВПРАВО ----
                fish.rotation = Math.PI / 2; // Поворачиваем носом вправо (90 градусов)
                
                // В PixiJS у повернутого на 90° объекта ось X отвечает за верх/низ (пузо/спина).
                // Если при движении ВПРАВО рыба плывет ПУЗОМ КВЕРХУ, 
                // просто добавьте минус перед первым scale: fish.scale.set(-scale, scale);
                fish.scale.set(scale, scale); 

            } else {
                // ---- ПЛЫВЕТ ВЛЕВО ----
                fish.rotation = -Math.PI / 2; // Поворачиваем носом влево (-90 градусов)
                
                // Если при движении ВЛЕВО рыба плывет ПУЗОМ КВЕРХУ, 
                // просто добавьте минус перед первым scale: fish.scale.set(-scale, scale);
                fish.scale.set(-scale, scale); // Я сразу поставил минус, так как обычно именно тут рыба переворачивается
            }

            fish.scale.x = fish.scale.x * (-1);
            

            // Отзеркаливаем картинку, если рыба плывет влево
            //fish.scale.set(direction === 1 ? scale : -scale, scale);

            // 2. Текст
            const textStyle = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 150 * scale,
                fontWeight: '900',
                fill: '#ffffff',
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 4,
                dropShadowDistance: 2
            });
            const textSprite = new PIXI.Text({ text: text, style: textStyle });
            textSprite.anchor.set(0.5);

            // Собираем
            fishGroup.addChild(fish);
            fishGroup.addChild(textSprite);
            seaBedContainer.addChild(fishGroup);

            // 3. Анимация движения
            const moveTicker = (time) => {
                // Двигаем рыбу
                fishGroup.position.x += speed * direction * time.deltaTime;

                // Если рыба уплыла далеко за край экрана (1000 или -1000) - удаляем её
                if ((direction === 1 && fishGroup.position.x > 2300) || 
                    (direction === -1 && fishGroup.position.x < -2300)) {
                    app.ticker.remove(moveTicker);
                    fishGroup.destroy({ children: true });
                }
            };
            
            app.ticker.add(moveTicker);
        }


    function showTutorialHand(startX, startY, targetX, targetY) {
            // 1. Создаем спрайт руки
            const hand = new PIXI.Sprite({ texture: handTex });

            hand.rotation = Math.PI / -4

            hand.eventMode = 'none';
            
            // ВАЖНО: Для руки якорь лучше ставить не в центр (0.5), 
            // а туда, где находится кончик указательного пальца на картинке.
            // Обычно это левый верхний угол (0.2, 0.1) или около того. 
            // Пока поставим центр, но вы можете подстроить под вашу картинку.
            hand.anchor.set(0.5, 0.5); 
            
            hand.position.set(startX, startY);
            
            const baseScale = 0.4; // Базовый размер руки
            hand.scale.set(baseScale);
            
            // Добавляем поверх всего (в uiOverlayContainer)
            uiOverlayContainer.addChild(hand); 

            // 2. Настройки времени
            let timer = 0;
            const moveDuration = 0.2;  // 1 секунда на полет до точки
            const pulseDuration = 30.0; // 3 секунды пульсации
            const totalDuration = moveDuration + pulseDuration;

            // 3. Анимация
            const handTicker = (time) => {
                timer += time.deltaTime / 60; // Считаем время в секундах

                if (timer < moveDuration) {
                    // ---- ФАЗА 1: Движение ----
                    const progress = timer / moveDuration;
                    
                    // Ease-Out (Плавное торможение в конце)
                    const ease = 1 - Math.pow(1 - progress, 3);
                    
                    hand.position.x = startX + (targetX - startX) * ease;
                    hand.position.y = startY + (targetY - startY) * ease;
                    
                } else if (timer < totalDuration) {
                    // ---- ФАЗА 2: Пульсация (Клик) ----
                    hand.position.set(targetX, targetY); // Фиксируем ровно в цели
                    
                    // Математика пульсации (Синусоида)
                    const pulseSpeed = 12; // Скорость биения (чем больше, тем быстрее)
                    const pulseAmount = 0.1; // Сила увеличения/уменьшения
                    
                    // Math.sin дает плавную волну от -1 до 1
                    const pulse = Math.sin((timer - moveDuration) * pulseSpeed) * pulseAmount;
                    
                    // Применяем пульсацию к масштабу
                    hand.scale.set(baseScale + pulse);
                    
                } else {
                    // ---- ФАЗА 3: Завершение ----
                    // Удаляем руку, когда время вышло
                    app.ticker.remove(handTicker);
                    hand.destroy();
                }
            };

            app.ticker.add(handTicker);
            
            // Возвращаем объект руки, чтобы мы могли удалить её досрочно при клике
            return hand; 
        }

        function moveAndShrink(object, targetX, targetY, durationSeconds) {
            const startX = object.position.x;
            const startY = object.position.y;
            const startScale = object.scale.x;
            
            // Граница перехода от движения к уменьшению (на 70% прогресса)
            const splitPoint = 0.7; 
            let progress = 0;
            
            const animTicker = (time) => {
                progress += time.deltaTime / (durationSeconds * 60);
                
                if (progress >= 1) {
                    object.position.set(targetX, targetY);
                    object.scale.set(0);
                    app.ticker.remove(animTicker);
                    object.destroy(); // Удаляем объект после завершения
                } 
                else if (progress < splitPoint) {
                    // ФАЗА 1: Только движение
                    // Пересчитываем прогресс внутри этой фазы (от 0 до 1)
                    const phaseProgress = progress / splitPoint;
                    
                    const currentX = startX + (targetX - startX) * phaseProgress;
                    const currentY = startY + (targetY - startY) * phaseProgress;
                    
                    object.position.set(currentX, currentY);
                } 
                else {
                    // ФАЗА 2: Только уменьшение
                    // Пересчитываем прогресс для этой фазы (от 0 до 1)
                    const phaseProgress = (progress - splitPoint) / (1 - splitPoint);
                    
                    // Объект уже стоит в targetX, targetY, теперь просто уменьшаем масштаб
                    object.scale.set(startScale * (1 - phaseProgress));
                }
            };
            
            app.ticker.add(animTicker);
        }
function getMoneyFromFish(count) {
            if (!caughtFish || caughtFish.destroyed) {
                console.warn("Попытка получить деньги с уничтоженной рыбы");
                return;
            }

            const startX = caughtFish.x;
            const startY = caughtFish.y;

            // =====================================
            // НАСТРОЙКА ВРЕМЕНИ СПАВНА
            // =====================================
            // Мы хотим, чтобы все деньги (неважно, 5 их или 50) 
            // вылетели примерно за 1 секунду (1000 мс).
            const totalDurationMs = 1900; 
            
            // Вычисляем интервал: чем больше купюр, тем меньше миллисекунд между ними.
            const intervalMs = totalDurationMs / count; 
            
            // Чтобы не было слишком медленно, когда купюр мало, установим максимум:
            const safeInterval = Math.min(intervalMs, 150); // Максимум 150 мс

            for (let i = 0; i < count; i++) {
                
                // Задержка теперь динамическая!
                setTimeout(() => {
                    const money = new PIXI.Sprite({ texture: euro100Tex });
                    money.anchor.set(0.5, 0.5);
                    
                    money.position.set(startX, startY - 700);
                    money.scale.set(0);
                    uiOverlayContainer.addChild(money);
                    
                    addCashout(100);
                    playSound(getMP3, 0.3);
                    
                    playBounce(money, 0.3, 0.5);
                    
                    setTimeout(() => {
                        if (money && !money.destroyed) {
                            moveAndShrink(money, cashoutSprite.x, cashoutSprite.y, 0.35);
                        }
                    }, 200); // Здесь можно оставить фикс: купюра висит 0.2 сек перед полетом
                    
                }, i * safeInterval); // <--- Используем динамический интервал!
            }
        }

        function spawnMoney(centerX, centerY) {
            const xoffset = 120; // Дистанция между купюрами по X
            const yoffset = -60; // Дистанция между купюрами по Y

            // Позиции для трех купюр: 
            // i=0 (лево), i=1 (центр), i=2 (право)
            const positions = [
                { x: centerX - xoffset, y: centerY - yoffset }, // Слева-сверху
                { x: centerX,           y: centerY },           // Центр
                { x: centerX + xoffset, y: centerY + yoffset }  // Справа-снизу
            ];

            for (let i = 0; i < 3; i++) {
                // Задержка: первая (0мс), вторая (300мс), третья (600мс)
                setTimeout(() => {
                    const money = new PIXI.Sprite({ texture: euro500Tex });
                    money.anchor.set(0.5, 0.5);
                    
                    // Берем координаты из массива
                    money.position.set(positions[i].x, positions[i].y); 
                    
                    money.scale.set(0);
                    uiOverlayContainer.addChild(money);
                    
                    // Запускаем Bounce (передаем масштаб 1.1 как третий аргумент)
                    playBounce(money, 0.6, 1.1);
                    setTimeout(()=>{
                        moveAndShrink(money , balanceSprite.x , balanceSprite.y , 0.6);
                        addBalance(500);
                        
                    }, 1000);
                }, i * 300); 
            }


        }
        function transitionToSeaBed(oldScene, newScene, oldBg, newBg, onComplete) {
            const startY = oldScene.position.y;
            const bgStartY = oldBg.position.y; 
            const moveDistance = 1200; 
            let progress = 0;
            const duration = 0.23; 

            oldScene.filters = [motionBlur];
            oldBg.filters = [motionBlur];
            newScene.visible = true;
            newBg.visible = true;
            playSound(transMP3);

            newScene.position.y = startY + moveDistance;
            newBg.position.y = bgStartY + moveDistance;

            const transitionTicker = (time) => {
                progress += time.deltaTime / (duration * 60);

                if (progress >= 1) {
                    oldScene.visible = false;
                    oldBg.visible = false; 
                    oldScene.filters = []; 
                    oldBg.filters = []; 
                    newScene.position.y = startY; 
                    newBg.position.y = bgStartY; 
                    app.ticker.remove(transitionTicker);
                    

                    if (onComplete) onComplete(); 
                    
                } else {
                    const easedProgress = progress * progress; 
                    const currentOffset = moveDistance * easedProgress;
                    oldScene.position.y = startY - currentOffset;
                    oldBg.position.y = bgStartY - currentOffset;
                    newScene.position.y = (startY + moveDistance) - currentOffset;
                    newBg.position.y = (bgStartY + moveDistance) - currentOffset;
                    motionBlur.strengthY = Math.abs(500 * Math.sin(progress * Math.PI));
                }
            };
            app.ticker.add(transitionTicker);
        }


function playIceExplosion(x, y, keepAlive = false) {
            const explosion = new PIXI.AnimatedSprite(iceTextures);

            playSound(ledMP3);
            
            explosion.anchor.set(0.5);
            explosion.position.set(x, y);
            explosion.scale.set(2);
            
            explosion.loop = false;
            explosion.animationSpeed = 0.35;

            gameContainer.addChild(explosion);
            explosion.play();

            explosion.onComplete = () => {
                // В любом случае останавливаемся на последнем кадре
                explosion.gotoAndStop(explosion.totalFrames - 1);
                
                // ЕСЛИ НУЖНО ОСТАВИТЬ ЭФФЕКТ (keepAlive = true)
                if (keepAlive) {
                    // Просто выходим из функции, ничего не удаляя
                    console.log("Эффект застыл на экране");
                    return; 
                }

                // ИНАЧЕ: Запускаем стандартное плавное затухание
                let timer = 0;
                const fadeDuration = 2.5; 
                
                const fadeTicker = (time) => {
                    timer += time.deltaTime / (fadeDuration * 60);
                    
                    if (timer >= 1) {
                        explosion.destroy(); 
                        app.ticker.remove(fadeTicker);
                    } else {
                        explosion.alpha = 1 - timer;
                        explosion.scale.set(explosion.scale.x + 0.001);
                    }
                };
                
                app.ticker.add(fadeTicker);
            };
        }

        function pressButton(object, callback) {
            const originalScale = object.scale.x;
            const pressedScale = originalScale * 0.9; // Уменьшаем на 10%
            
            let progress = 0;
            const duration = 0.15; // 0.15 сек на всё нажатие
            
            // Удаляем предыдущий тикер, если кнопка нажимается быстро несколько раз
            app.ticker.remove(object._pressTicker);

            const pressTicker = (time) => {
                progress += time.deltaTime / (duration * 60);
                
                if (progress <= 0.5) {
                    // Первая половина: уменьшаемся
                    const t = progress / 0.5;
                    object.scale.set(originalScale + (pressedScale - originalScale) * t);
                } else if (progress < 1) {
                    // Вторая половина: возвращаемся
                    const t = (progress - 0.5) / 0.5;
                    object.scale.set(pressedScale + (originalScale - pressedScale) * t);
                } else {
                    // Завершение
                    object.scale.set(originalScale);
                    app.ticker.remove(pressTicker);
                    object._pressTicker = null;
                    
                    // Вызываем действие (например, открытие стора) после анимации
                    if (callback) callback();
                }
            };

            object._pressTicker = pressTicker;
            app.ticker.add(pressTicker);
    }

        function playBounce(object, duration , scale) {
            let progress = 0;
            const finalScale = scale; // Итоговый масштаб (например, 0.55)
            
            object.scale.set(0);

            const tickFn = (time) => {
                progress += time.deltaTime / (duration * 60);
                
                if (progress >= 1) {
                    object.scale.set(finalScale);
                    app.ticker.remove(tickFn);
                } else {
                    // Математика пружины (Ease-Out-Back)
                    // Чем больше overshoot, тем сильнее объект будет "выпрыгивать" за пределы finalScale
                    const overshoot = 2.0; 
                    const t = progress - 1;
                    // Вычисляем кривую от 0 до ~1.2 и обратно к 1
                    const ease = (t * t * ((overshoot + 1) * t + overshoot) + 1);
                    
                    // Применяем кривую к нашему финальному масштабу
                    object.scale.set(finalScale * ease);
                }
            };
            app.ticker.add(tickFn);
        }

        function fadeIn(object, duration) {
            object.alpha = 0;
            const ticker = (delta) => {
                object.alpha += 0.05;
                if (object.alpha >= 1) app.ticker.remove(ticker);
            };
            app.ticker.add(ticker);
        }

        showWelcomeBonus();
        

        // ==========================================================
        // АДАПТИВ: ЖЕСТКАЯ КАМЕРА
        // ==========================================================
        let cameraZoom = 1; // <--- НОВАЯ ПЕРЕМЕННАЯ ДЛЯ ЗУМА
        let bgZoom = 2

function resize() {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    app.renderer.resize(sw, sh);

    const scaleX = sw / GAME_WIDTH;
    const scaleY = sh / GAME_HEIGHT;
    const baseZoom = Math.min(scaleX, scaleY);

    // 1. Игровой мир (зумится через cameraZoom)
    gameContainer.scale.set(baseZoom * cameraZoom);
    seaBedContainer.scale.set(baseZoom * cameraZoom);
    gameContainer.position.set(sw / 2, sh / 2);
    seaBedContainer.position.set(sw / 2, sh / 2);

    // 2. ФОНЫ
    const bgScale = Math.max(sw / backgroundSprite.texture.width, sh / backgroundSprite.texture.height);
    
    // === ИСПРАВЛЕНИЕ ТУТ ===
    // Умножаем на cameraZoom, чтобы фон уменьшался вместе с контейнером.
    // 1.55 — это ваш запас, чтобы при минимальном зуме (0.65) не было дырок.
    backgroundSprite.scale.set(bgScale * 1.75 * cameraZoom); 
    backgroundSprite.position.set(sw / 2, sh / 2);

    // Подводный фон обычно оставляют статичным (bgScale), 
    // чтобы создать эффект глубины, но если нужно — тоже добавьте * cameraZoom
    const seaBgScale = Math.max(sw / seaBackgroundSprite.texture.width, sh / seaBackgroundSprite.texture.height);
    seaBackgroundSprite.scale.set(seaBgScale);
    seaBackgroundSprite.position.set(sw / 2, sh / 2);

    // ============================================
    // УМНЫЙ UI (оставляем без изменений)
    // ============================================
    let uiScale = scaleY;
    const aspectRatio = sw / sh;
    if (aspectRatio < 0.53) {
        uiScale *= (aspectRatio / 0.53);
    }

    uiOverlayContainer.scale.set(uiScale);
    uiOverlayContainer.position.set(sw / 2, sh / 2);

    const halfH = (sh / 2) / uiScale;
    let padX = 210; 
    if (aspectRatio < 0.5) padX = 220;

    const padYBottom = 180; 
    const padYTop = 180;    

    cashoutSprite.position.set(-padX, halfH - padYBottom);
    playButtonSprite.position.set( padX, halfH - padYBottom);
    logoSprite.position.set(-100 - padX, -(halfH - padYTop));
    balanceSprite.position.set(10 + padX, -(halfH - padYTop));
    disclaimer.position.set(0 , halfH - padYBottom + 150)
}

        window.addEventListener('resize', resize);
        resize();
        
    } catch (e) {
        alert("Playable Error: " + e.message);
        console.error(e);
    }
};

init();