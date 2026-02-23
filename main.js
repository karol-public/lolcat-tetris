const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverScreen = document.getElementById('game-over-screen');

let tetris;
let inputHandler;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationId;

function update(time = 0) {
    if (tetris.gameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        tetris.drop();
        dropCounter = 0;
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

    tetris = new Tetris(ctx, scoreEl, levelEl, () => {
        AudioController.gameover();
        gameOverScreen.classList.remove('hidden');
        if (inputHandler) inputHandler.destroy();
        cancelAnimationFrame(animationId);
    });

    // adjust speed based on level
    dropInterval = Math.max(100, 1000 - (tetris.level - 1) * 100);

    inputHandler = new InputHandler(document.body,
        () => { if (tetris.moveDir(-1)) AudioController.move(); },
        () => { if (tetris.moveDir(1)) AudioController.move(); },
        () => { if (tetris.rotate(1)) AudioController.rotate(); },
        () => { tetris.drop(); AudioController.drop(); }
    );

    tetris.scoreEl.innerText = '0';
    tetris.levelEl.innerText = '1';

    lastTime = performance.now();
    update();
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
