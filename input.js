class InputHandler {
    constructor(element, onMoveLeft, onMoveRight, onRotate, onDrop) {
        this.element = element;
        this.startX = 0;
        this.startY = 0;
        this.threshold = 30; // pixels to trigger swipe
        this.lockX = false;
        this.lockY = false;
        this.active = true;

        this.onMoveLeft = onMoveLeft;
        this.onMoveRight = onMoveRight;
        this.onRotate = onRotate;
        this.onDrop = onDrop;

        // touch
        this.element.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleEnd.bind(this), { passive: false });

        // keyboard
        this.keydownHandler = (e) => {
            if (!this.active) return;
            if (e.key === 'ArrowLeft') this.onMoveLeft();
            else if (e.key === 'ArrowRight') this.onMoveRight();
            else if (e.key === 'ArrowUp') this.onRotate();
            else if (e.key === 'ArrowDown') this.onDrop();
        };
        window.addEventListener('keydown', this.keydownHandler);
    }

    destroy() {
        this.active = false;
        window.removeEventListener('keydown', this.keydownHandler);
    }

    handleStart(e) {
        if (!this.active) return;
        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.lockX = false;
        this.lockY = false;
        this.startTime = Date.now();
    }

    handleMove(e) {
        if (!this.active) return;
        e.preventDefault(); // prevent scrolling
        const touch = e.touches[0];
        const diffX = touch.clientX - this.startX;
        const diffY = touch.clientY - this.startY;

        if (Math.abs(diffX) > this.threshold && !this.lockX && !this.lockY) {
            if (diffX > 0) this.onMoveRight();
            else this.onMoveLeft();
            this.startX = touch.clientX; // reset to allow continuous swiping fast
            this.lockY = true; // prevent down swipe if moving side
        } else if (diffY > this.threshold && !this.lockY && !this.lockX) {
            this.onDrop();
            this.startY = touch.clientY;
            this.lockX = true;
        }
    }

    handleEnd(e) {
        if (!this.active) return;
        // If it was a quick tap without much movement, fire rotate
        const timeDiff = Date.now() - this.startTime;
        if (!this.lockX && !this.lockY && timeDiff < 300) {
            this.onRotate();
        }
    }
}
