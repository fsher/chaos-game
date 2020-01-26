const POINT_SIZE = 2;
const LARGE_POINT_SIZE = 5;
const LENGTH_STEP = 2;

const START_LABEL = 'Start';
const STOP_LABEL = 'Stop';

const GameState = {
  STOPPED: 0,
  RUNNING: 1,
};

const LabelMap = {
  [GameState.STOPPED]: START_LABEL,
  [GameState.RUNNING]: STOP_LABEL
};

/**
 * Length calculator for chaos game
 * @param one - first point
 * @param two - second point
 * @returns {{yLen: number, xLen: number}}
 */
const getLengths = (one, two) => ({
  xLen: Math.round((one.x - two.x) / LENGTH_STEP),
  yLen: Math.round((one.y - two.y) / LENGTH_STEP),
});

/**
 * Function that returns index of the point to which we should move towards
 *
 * Point | Die Roll
 * 1       1
 * 1       2
 * 2       3
 * 2       4
 * 3       5
 * 3       6
 * @param roll - die roll
 * @returns {number} - point's array index
 */
const getSide = (roll) => (Math.ceil((roll + 1) / 2) - (roll + 1) % 2) - 1;

const isTimePassed = (prev, current, duration) => current - prev > duration;

// Helper Canvas class, simplify drawing
class Canvas {
  _element;
  _context;

  get element() {
    return this._element;
  }

  constructor(id) {
    this._element = document.getElementById(id);
    this._context = this._element.getContext('2d');

    this.resetCanvas();
  }

  resetCanvas() {
    this._context.fillStyle = "white";
    this._context.fillRect(0, 0, this._element.width, this._element.height);
    this._context.fillStyle = 'black';
  }

  drawPoint(x, y, size = POINT_SIZE) {
    this._context.fillRect(x, y, size, size);
  }
}

class ChaosGame {
  _canvas;
  _last;
  _points = [];

  _state = GameState.STOPPED;
  _speed = 200;

  /**
   * Main loop
   * @private
   */
  _play() {
    // Rolling the die, getting the point to which we should move
    const die = this._generateRandomNumber();
    const point = this._points[getSide(die)];
    const {xLen, yLen} = getLengths(point, this._last);

    this._last = {
      x: this._last.x + xLen,
      y: this._last.y + yLen
    };
    this._canvas.drawPoint(this._last.x, this._last.y);
  }

  _generateRandomNumber(min = 1, max = this._points.length * 2) {
    return Math.floor(Math.random() * max) + min;
  }

  constructor(canvas) {
    this._canvas = canvas;

    document.getElementById('chaos-toggle').addEventListener('click', (event) => {
      this._state = Number(!this._state);
      event.target.innerHTML = LabelMap[this._state];
    });

    document.getElementById('chaos-speed').addEventListener('change', (event) => {
      this._speed = event.target.value;
    });
  }

  /**
   * Read initial points in order to start the game
   *
   * @returns {ChaosGame}
   */
  readInitial() {
    const reader = ({offsetX, offsetY}) => {
      const coords = {
        x: offsetX,
        y: offsetY
      };

      // If there are already more than 2 points, read the initial point to start with
      if (this._points.length > 2) {
        this._last = {...coords};

        // Remove event listener, since we don't need in anymore.
        this._canvas.element.removeEventListener('click', reader);
      } else {
        // Otherwise add initial figure points.
        this._points.push(coords);
      }

      this._canvas.drawPoint(offsetX, offsetY, LARGE_POINT_SIZE);
    };

    this._canvas.element.addEventListener('click', reader);

    return this;
  }

  /**
   * Start game, main loop
   *
   * @returns {ChaosGame}
   */
  start() {
    let prev = performance.now();
    const game = (current) => {
      if (isTimePassed(prev, current, this._speed)) {
        if (this._state === GameState.RUNNING && this._points.length > 2 && this._last) {
          this._play();
        }

        prev = current;
      }
      window.requestAnimationFrame(game);
    };

    window.requestAnimationFrame(game);

    return this;
  }
}


window.onload = () => {
  new ChaosGame(new Canvas('chaos'))
    .readInitial()
    .start();
};
