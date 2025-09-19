import { checkInstanceDependencies } from "../utils/depUtils.js";

let instance;

/**
 *
 * @param {Object} instanceProvider - An object that has the necessary methods to fetch singleton instances
 * @param {Function} instanceProvider.getInstance - Function that loads other modules as dependencies
 *
 * @returns {Object} Singleton instance for the current module
 */
const getDisplayInstance = ({ getInstance }) => {
  if (instance) {
    return instance;
  }

  const ns = Object.create(null);
  instance = ns;

  /**
   * Load the instance's internal methods and properties asynchronously
   */
  (async () => {
    const registers = getInstance("registers");

    checkInstanceDependencies("display", {
      registers,
    });

    const displayEl = document.querySelector("#chip8display");
    const canvas = displayEl.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    const COLOR_BG = "#000000";
    const COLOR_STROKE = "#ffffff";
    const SCREEN_WIDTH = 64;
    const SCREEN_HEIGHT = 32;
    const SCALE_FACTOR = 8;

    // We can just use the 64x32 coordinate space after this
    ctx.scale(SCALE_FACTOR, SCALE_FACTOR);
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ns.clear = () => {
      ctx.fillStyle = COLOR_BG;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    };

    // TODO: Bring back previous draw implementation if this one causes issues
    ns.draw = (root_x, root_y, data) => {
      // Draw sprite `data` starting at (root_x, root_y).
      // Use wrapping on both axes and compute per-pixel collision.
      // `data` is Uint8Array where each byte is 8 horizontal pixels.
      registers.V[0xf] = 0;

      // Normalize start coords into 0..SCREEN_WIDTH-1, 0..SCREEN_HEIGHT-1
      let baseX = ((root_x % SCREEN_WIDTH) + SCREEN_WIDTH) % SCREEN_WIDTH;
      let baseY = ((root_y % SCREEN_HEIGHT) + SCREEN_HEIGHT) % SCREEN_HEIGHT;

      for (let row = 0; row < data.length; row++) {
        const y = (baseY + row) % SCREEN_HEIGHT;
        const toDraw = data[row];

        for (let bit = 0; bit < 8; bit++) {
          const drawX = (baseX + bit) % SCREEN_WIDTH;

          // compute the bit to draw (1 or 0)
          const toDrawBit = (toDraw >> (7 - bit)) & 1;

          // Read the current pixel at drawX,y (one pixel)
          // Note: reading single pixel so coordinates multiplied by SCALE_FACTOR
          const img = ctx.getImageData(
            drawX * SCALE_FACTOR,
            y * SCALE_FACTOR,
            1,
            1
          ).data;
          // img is [r,g,b,a], when background is black and stroke white,
          // treat any non-zero alpha or non-zero first channel as pixel on.
          const currentPixel = img[0] ? 1 : 0;

          // Collision detection: set VF if a pixel is erased (1 xor 1 => 0)
          if (currentPixel === 1 && toDrawBit === 1) {
            registers.V[0xf] = 1;
          }

          const resultPixel = currentPixel ^ toDrawBit;

          // Paint the pixel. Use full pixel units (1x1) — canvas is scaled with SCALE_FACTOR elsewhere.
          ctx.fillStyle = resultPixel ? COLOR_STROKE : COLOR_BG;
          ctx.fillRect(drawX, y, 1, 1);
        }
      }
    };

    ns.SCREEN_WIDTH = SCREEN_WIDTH;
    ns.SCREEN_HEIGHT = SCREEN_HEIGHT;
    ns.ctx = ctx;
  })();

  return ns;
};

export { getDisplayInstance };
