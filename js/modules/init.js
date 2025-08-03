window.chip8 = Object.create(null);

chip8.paused = false;
chip8.debug = !!localStorage.getItem('debug') || false;

// TODO: adjust quirks and test further
chip8.quirks = (() => {
    const ns = Object.create(null);
    ns.useVYinShifts = false;
    ns.jumpWithOffsetAlt = false;
    ns.incIduringRegRW = false;
    return ns;
})();
