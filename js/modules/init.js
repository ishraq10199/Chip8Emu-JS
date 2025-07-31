// const { chip8 } = window;
window.chip8 = Object.create(null);

chip8.paused = false;
chip8.debug = false;

chip8.quirks = Object.create(null);
chip8.quirks.useVYinShifts = false;
chip8.quirks.jumpWithOffsetAlt = false;
chip8.quirks.incIduringRegRW = false;
