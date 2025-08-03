const { chip8 } = window;

chip8.display = (() => {
  const displayEl = document.querySelector("#chip8display");
  const canvas = displayEl.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  const COLOR_BG = '#000000';
  const COLOR_STROKE = '#ffffff';
  const SCREEN_WIDTH = 64;
  const SCREEN_HEIGHT = 32;
  const SCALE_FACTOR = 8;

  // We can just use the 64x32 coordinate space after this
  ctx.scale(SCALE_FACTOR, SCALE_FACTOR);
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const ns = Object.create(null);
  
  ns.clear = () => {
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  };
  
  ns.draw = (root_x, root_y, data) => {
    // `root_x` and `root_y` coords must be "sanitized" beforehand
    // `data` should be of type Uint8Array, and should contain N bytes, for N rows
    let x = root_x;
    let y = root_y;
    chip8.registers.V[0xF] = 0;
    for (let i = 0; i < data.length; i++, y++) {
      if (y >= SCREEN_HEIGHT) {
        break;
      }
      const currentRow = ctx.getImageData(x * SCALE_FACTOR, y * SCALE_FACTOR, 8 * SCALE_FACTOR, 1)
                          .data.filter((_, idx) => !(idx % (4 * SCALE_FACTOR)));
      const toDraw = data[i];
      let currentPixel = 0;
      let toDrawBit = 0;
      for (let bit = 0; bit < 8; bit++) {
        currentPixel = currentRow[bit] & 1;
        toDrawBit = (toDraw >> (7-bit)) & 1;
        if (currentPixel === 1 && toDrawBit === 1) {
          chip8.registers.V[0xF] = 1;
        }
        const resultPixel = currentPixel ^ toDrawBit;
        ctx.fillStyle = resultPixel ? COLOR_STROKE : COLOR_BG;
        ctx.fillRect(x + bit, y, 1, 1);
      }
    }
  };

  ns.SCREEN_WIDTH = SCREEN_WIDTH;
  ns.SCREEN_HEIGHT = SCREEN_HEIGHT;
  ns.ctx = ctx;

  return ns;
})();