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
    constructor(ctx, nextCtx, scoreEl, levelEl, onGameOver) {
        this.ctx = ctx;
        this.nextCtx = nextCtx;
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
        this.nextPiece = this.randomPiece();
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

    drawNextPiece() {
        if (!this.nextCtx) return;
        this.nextCtx.clearRect(0, 0, this.nextCtx.canvas.width, this.nextCtx.canvas.height);
        const bSize = 20; // 80 / 4 loosely
        const m = this.nextPiece.matrix;
        const offsetX = (4 - m[0].length) / 2;
        const offsetY = (4 - m.length) / 2;

        this.drawMatrix(m, { x: offsetX, y: offsetY }, this.nextCtx, bSize);
    }

    spawn() {
        this.piece = this.nextPiece;
        this.nextPiece = this.randomPiece();
        this.drawNextPiece();

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

    hardDrop() {
        let dropDistance = 0;
        while (!this.collide()) {
            this.piece.pos.y++;
            dropDistance++;
        }
        this.piece.pos.y--; // step back up 1, to original valid spot

        this.score += dropDistance * 2; // bonus points for hard drop
        this.scoreEl.innerText = this.score;

        this.merge();
        this.spawn();
        this.clearLines();
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

    drawMatrix(matrix, offset, targetCtx = this.ctx, bSize = this.BLOCK_SIZE, isGhost = false) {
        targetCtx.save();
        if (isGhost) targetCtx.globalAlpha = 0.3;

        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    targetCtx.fillStyle = LOLCATS[value];
                    const px = (x + offset.x) * bSize;
                    const py = (y + offset.y) * bSize;
                    targetCtx.fillRect(px, py, bSize, bSize);

                    targetCtx.strokeStyle = '#222';
                    targetCtx.lineWidth = 2;
                    targetCtx.strokeRect(px, py, bSize, bSize);

                    if (!isGhost && bSize >= 20) {
                        // Simple face drawing for Lolcat theme
                        const scale = bSize / 30; // 30 is default BLOCK_SIZE
                        targetCtx.fillStyle = '#fff';

                        targetCtx.beginPath();
                        targetCtx.moveTo(px + 4 * scale, py + 8 * scale);
                        targetCtx.lineTo(px + 8 * scale, py + 4 * scale);
                        targetCtx.lineTo(px + 12 * scale, py + 8 * scale);
                        targetCtx.fill();

                        targetCtx.beginPath();
                        targetCtx.moveTo(px + 18 * scale, py + 8 * scale);
                        targetCtx.lineTo(px + 22 * scale, py + 4 * scale);
                        targetCtx.lineTo(px + 26 * scale, py + 8 * scale);
                        targetCtx.fill();

                        targetCtx.fillStyle = '#000';
                        targetCtx.fillRect(px + 8 * scale, py + 12 * scale, 4 * scale, 4 * scale);
                        targetCtx.fillRect(px + 18 * scale, py + 12 * scale, 4 * scale, 4 * scale);

                        targetCtx.fillStyle = '#ff6699';
                        targetCtx.fillRect(px + 13 * scale, py + 18 * scale, 4 * scale, 3 * scale);
                    }
                }
            });
        });
        targetCtx.restore();
    }

    collideGhost(pos) {
        const m = this.piece.matrix;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (this.grid[y + pos.y] && this.grid[y + pos.y][x + pos.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    getGhostPos() {
        const ghostPos = { x: this.piece.pos.x, y: this.piece.pos.y };
        while (!this.collideGhost({ x: ghostPos.x, y: ghostPos.y + 1 })) {
            ghostPos.y++;
        }
        return ghostPos;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawMatrix(this.grid, { x: 0, y: 0 });

        const ghostPos = this.getGhostPos();
        this.drawMatrix(this.piece.matrix, ghostPos, this.ctx, this.BLOCK_SIZE, true);

        this.drawMatrix(this.piece.matrix, this.piece.pos);
    }
}
