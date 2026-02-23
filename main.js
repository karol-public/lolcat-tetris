const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverScreen = document.getElementById('game-over-screen');

const pauseBtn = document.getElementById('pause-btn');
const pauseScreen = document.getElementById('pause-screen');
const resumeBtn = document.getElementById('resume-btn');
const catPopup = document.getElementById('cat-popup');
const catPopupImg = document.getElementById('cat-popup-img');

const MEMES = [
    'https://cataas.com/cat/says/MUCH%20SKILL?fontSize=40&fontColor=yellow',
    'https://cataas.com/cat/says/LOLBAT?fontSize=50&fontColor=cyan',
    'https://cataas.com/cat/says/COMBO?fontSize=60&fontColor=magenta'
];

let tetris;
let inputHandler;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationId;
let isPaused = false;
let lastLines = 0;

function togglePause() {
    if (tetris && !tetris.gameOver) {
        isPaused = !isPaused;
        if (isPaused) {
            cancelAnimationFrame(animationId);
            pauseScreen.classList.remove('hidden');
        } else {
            pauseScreen.classList.add('hidden');
            lastTime = performance.now();
            update();
        }
    }
}

function update(time = 0) {
    if (tetris.gameOver || isPaused) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    // dynamic difficulty
    dropInterval = Math.max(100, 1000 - (tetris.level - 1) * 120);

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        tetris.drop();
        dropCounter = 0;
    }

    if (tetris.lines > lastLines) {
        const cleared = tetris.lines - lastLines;
        lastLines = tetris.lines;
        if (cleared >= 2) {
            // show meme popup for combo!
            catPopupImg.src = MEMES[Math.floor(Math.random() * MEMES.length)];
            catPopup.classList.remove('hidden');
            setTimeout(() => {
                catPopup.classList.add('hidden');
            }, 2000);
        }
    }

    tetris.draw();
    animationId = requestAnimationFrame(update);
}

function startGame() {
    AudioController.init();
    startBtn.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    if (inputHandler) {
        inputHandler.destroy();
    }
    cancelAnimationFrame(animationId);
    isPaused = false;
    pauseScreen.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    lastLines = 0;

    tetris = new Tetris(ctx, nextCtx, scoreEl, levelEl, () => {
        AudioController.gameover();
        gameOverScreen.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        if (inputHandler) inputHandler.destroy();
        cancelAnimationFrame(animationId);
    });

    inputHandler = new InputHandler(document.body,
        () => { if (!isPaused && tetris.moveDir(-1)) AudioController.move(); },
        () => { if (!isPaused && tetris.moveDir(1)) AudioController.move(); },
        () => { if (!isPaused && tetris.rotate(1)) AudioController.rotate(); },
        () => { if (!isPaused) { tetris.drop(); AudioController.drop(); } },
        () => { if (!isPaused) { tetris.hardDrop(); AudioController.clear(); } }
    );

    tetris.scoreEl.innerText = '0';
    tetris.levelEl.innerText = '1';

    lastTime = performance.now();
    update();
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);
