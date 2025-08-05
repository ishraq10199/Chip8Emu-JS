const { chip8 } = window;

chip8.utils = (() => {
  const ns = Object.create(null);

  ns.mainLoopFrame = null;
  
  ns.hexDump = (byteArray, skipBorders = false, bytesPerLine = 16) => {
    if (typeof byteArray !== 'object' || byteArray.constructor.name !== 'Uint8Array') {
      return;
    }
    if (!skipBorders) {
      console.log("----------------------Hexdump----------------------");
    }
  
    for (let i = 0; i < byteArray.length; i += bytesPerLine) {
      console.log(byteArray.slice(i, i + bytesPerLine).toHex().match(/.{1,2}/g).join(' '));
    }
    if (!skipBorders) {
      console.log("----------------------Enddump----------------------")
    }
  };

  ns.run = () => {
    if (chip8.paused) {
      chip8.paused = false;
      document.querySelector("button#pause").innerHTML = 'Pause';
    }
  
    chip8.memoryUtils.populateFonts();
    chip8.ui.reset();
    chip8.loadRom();
    chip8.ui.addCodeLines();
  
    chip8.debug = chip8.debug || !!localStorage.getItem('debug') || false;
  
    chip8.cpu.init();
    chip8.display.clear();

    let mainLoopLastTime = performance.now();
    const frameInterval = 6;

    cancelAnimationFrame(ns.mainLoopFrame);

    const mainLoop = () => {
      if (!chip8.paused && performance.now() - mainLoopLastTime >= frameInterval) {
        chip8.timer.decrement();
        chip8.sound.play(); 
        for (let i = 0; i < 11; i++) {
          chip8.ui.selectCurrentCodeLine();
          chip8.ui.renderRegisters();
          // chip8.ui.renderStack();
          chip8.ui.renderTimersAndCounters();
          chip8.ui.renderInput();
          chip8.cpu.tick();
        }
        chip8.input.makeLastInputStale();
        mainLoopLastTime = performance.now();
      }
      ns.mainLoopFrame = requestAnimationFrame(mainLoop);
    }
    ns.mainLoopFrame = requestAnimationFrame(mainLoop);
  };

  return ns;
})();

