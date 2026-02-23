const COLS = 10;
const ROWS = 20;

const SHAPES = [
    [],
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[2, 2], [2, 2]], // O
    [[0, 3, 3], [3, 3, 0], [0, 0, 0]], // S
    [[4, 4, 0], [0, 4, 4], [0, 0, 0]], // Z
    [[5, 0, 0], [5, 5, 5], [0, 0, 0]], // J
    [[0, 0, 6], [6, 6, 6], [0, 0, 0]], // L
    [[0, 7, 0], [7, 7, 7], [0, 0, 0]]  // T
];

const LOLCATS = [
    null,
    '#00f0f0', // cyan
    '#f0f000', // yellow
    '#00f000', // green
    '#f00000', // red
    '#0000f0', // blue
    '#f0a000', // orange
    '#a000f0'  // purple
];

class Tetris {
    constructor(ctx, scoreEl, levelEl, onGameOver) {
        this.ctx = ctx;
        this.scoreEl = scoreEl;
        this.levelEl = levelEl;
        this.onGameOver = onGameOver;

        this.grid = this.createGrid(COLS, ROWS);
        this.BLOCK_SIZE = this.ctx.canvas.width / COLS;
        this.score = 0;
        this.level = 1;
        this.lines = 0;

        this.gameOver = false;

        // Spawn first piece
        this.piece = this.randomPiece();
        this.spawn();
    }

    createGrid(c, r) {
        return Array.from({ length: r }, () => new Array(c).fill(0));
    }

    randomPiece() {
        const typeId = Math.floor(Math.random() * 7) + 1;
        const matrix = SHAPES[typeId];
        return {
            matrix,
            pos: { x: 0, y: 0 },
            id: typeId
        };
    }

    spawn() {
        this.piece.pos.y = 0;
        this.piece.pos.x = Math.floor(COLS / 2) - Math.floor(this.piece.matrix[0].length / 2);

        if (this.collide()) {
            this.gameOver = true;
            this.onGameOver();
        }
    }

    collide() {
        const m = this.piece.matrix;
        const o = this.piece.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (this.grid[y + o.y] && this.grid[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    merge() {
        this.piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.grid[y + this.piece.pos.y][x + this.piece.pos.x] = value;
                }
            });
        });
    }

    rotate(dir) {
        const pos = this.piece.pos.x;
        let offset = 1;
        this.rotateMatrix(this.piece.matrix, dir);
        while (this.collide()) {
            this.piece.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.piece.matrix[0].length) {
                this.rotateMatrix(this.piece.matrix, -dir);
                this.piece.pos.x = pos;
                return false;
            }
        }
        return true;
    }

    rotateMatrix(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    moveDir(dir) {
        this.piece.pos.x += dir;
        if (this.collide()) {
            this.piece.pos.x -= dir;
            return false;
        }
        return true;
    }

    drop() {
        this.piece.pos.y++;
        if (this.collide()) {
            this.piece.pos.y--;
            this.merge();
            this.spawn();
            this.clearLines();
            return true;
        }
        return false;
    }

    clearLines() {
        let linesCleared = 0;
        outer: for (let y = this.grid.length - 1; y >= 0; --y) {
            for (let x = 0; x < this.grid[y].length; ++x) {
                if (this.grid[y][x] === 0) {
                    continue outer;
                }
            }
            const row = this.grid.splice(y, 1)[0].fill(0);
            this.grid.unshift(row);
            ++y;
            linesCleared++;
        }
        if (linesCleared > 0) {
            AudioController.clear();
            this.lines += linesCleared;
            this.score += linesCleared * 10 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.scoreEl.innerText = this.score;
            this.levelEl.innerText = this.level;
        }
    }

    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.ctx.fillStyle = LOLCATS[value];
                    const px = (x + offset.x) * this.BLOCK_SIZE;
                    const py = (y + offset.y) * this.BLOCK_SIZE;
                    this.ctx.fillRect(px, py, this.BLOCK_SIZE, this.BLOCK_SIZE);

                    this.ctx.strokeStyle = '#222';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(px, py, this.BLOCK_SIZE, this.BLOCK_SIZE);

                    // Simple face drawing for Lolcat theme
                    this.ctx.fillStyle = '#fff';
                    // ears
                    this.ctx.beginPath();
                    this.ctx.moveTo(px + 4, py + 8);
                    this.ctx.lineTo(px + 8, py + 4);
                    this.ctx.lineTo(px + 12, py + 8);
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.moveTo(px + 18, py + 8);
                    this.ctx.lineTo(px + 22, py + 4);
                    this.ctx.lineTo(px + 26, py + 8);
                    this.ctx.fill();

                    // eyes
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(px + 8, py + 12, 4, 4);
                    this.ctx.fillRect(px + 18, py + 12, 4, 4);

                    // nose
                    this.ctx.fillStyle = '#ff6699';
                    this.ctx.fillRect(px + 13, py + 18, 4, 3);
                }
            });
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawMatrix(this.grid, { x: 0, y: 0 });
        this.drawMatrix(this.piece.matrix, this.piece.pos);
    }
}
