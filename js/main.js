const chip8 = Object.create(null);

chip8.registers = (() => {
  // General purpose registers V0 ~ VF
  const V = new Uint8ClampedArray(16);
})();

chip8.stack = (() => {
  // @todo Implement a simplified stack
  const ns = Object.create(null);
  return ns;
})();

chip8.memory = new Uint8ClampedArray(4096);

chip8.memoryUtils = (() => {
  // @todo Program Counter, Index register operations here
  const ns = Object.create(null);
  ns.populateFonts = () => {
    // Bitmaps of chars in range 0 ~ F, where each char is represented using 5 bytes
    const bitmaps = [
      [0xf0, 0x90, 0x90, 0x90, 0xf0], // 0
      [0x20, 0x60, 0x20, 0x20, 0x70], // 1
      [0xf0, 0x10, 0xf0, 0x80, 0xf0], // 2
      [0xf0, 0x10, 0xf0, 0x10, 0xf0], // 3
      [0x90, 0x90, 0xf0, 0x10, 0x10], // 4
      [0xf0, 0x80, 0xf0, 0x10, 0xf0], // 5
      [0xf0, 0x80, 0xf0, 0x90, 0xf0], // 6
      [0xf0, 0x10, 0x20, 0x40, 0x40], // 7
      [0xf0, 0x90, 0xf0, 0x90, 0xf0], // 8
      [0xf0, 0x90, 0xf0, 0x10, 0xf0], // 9
      [0xf0, 0x90, 0xf0, 0x90, 0x90], // A
      [0xe0, 0x90, 0xe0, 0x90, 0xe0], // B
      [0xf0, 0x80, 0x80, 0x80, 0xf0], // C
      [0xe0, 0x90, 0x90, 0x90, 0xe0], // D
      [0xf0, 0x80, 0xf0, 0x80, 0xf0], // E
      [0xf0, 0x80, 0xf0, 0x80, 0x80], // F
    ];
    // By popular convention, we are using the memory from 0x050 (80) to 0x09F (160)
    for (
      let i = 0x050, currentCharRow = 0, currentCharCol = 0;
      i <= 0x09f;
      i++, currentCharCol++
    ) {
      chip8.memory[i] = bitmaps[currentCharRow][currentCharCol];

      if (currentCharCol == 5) {
        currentCharCol = 0;
        currentCharRow++;
      }
    }
  };
  return ns;
})();

chip8.display = (() => {
  const displayEl = document.querySelector("#chip8display");
  const ns = Object.create(null);
  return ns;
})();

chip8.timer = (() => {
  const DELAY = 0;
  const SOUND = 1;
  const timers = new Uint8ClampedArray(2);

  // @todo Timer logic
  const ns = Object.create(null);
  return ns;
})();
