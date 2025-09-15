const { chip8 } = window;

const createUtils = ({
  memoryUtils,
  ui,
  cpu,
  display,
  input,
  sound,
  timer,
  rom,
  global,
}) => {
  for (const [k, v] of Object.entries({
    memoryUtils,
    ui,
    cpu,
    display,
    input,
    sound,
    timer,
    rom,
    global,
  })) {
    if (!v) {
      throw new Error(`[error] ${k} not provided during Utils instancing`);
    }
  }
  const ns = Object.create(null);

  ns.mainLoopFrame = null;

  ns.hexDump = (byteArray, skipBorders = false, bytesPerLine = 16) => {
    if (
      typeof byteArray !== "object" ||
      byteArray.constructor.name !== "Uint8Array"
    ) {
      return;
    }
    if (!skipBorders) {
      console.log("----------------------Hexdump----------------------");
    }

    for (let i = 0; i < byteArray.length; i += bytesPerLine) {
      console.log(
        byteArray
          .slice(i, i + bytesPerLine)
          .toHex()
          .match(/.{1,2}/g)
          .join(" ")
      );
    }
    if (!skipBorders) {
      console.log("----------------------Enddump----------------------");
    }
  };

  ns.run = () => {
    if (global.paused) {
      global.paused = false;
      document.querySelector("button#pause").innerHTML = "Pause";
    }

    memoryUtils.populateFonts();
    ui.reset();
    rom.load();
    ui.renderCodeLines();

    global.debug = global.debug || !!localStorage.getItem("debug") || false;

    cpu.init();
    display.clear();

    let mainLoopLastTime = performance.now();
    const frameInterval = 6;

    cancelAnimationFrame(ns.mainLoopFrame);

    const mainLoop = () => {
      if (global.paused && cpu.stepCount) {
        timer.decrement();
        sound.play();
        ui.selectCurrentCodeLine();
        ui.render();
        cpu.tick();
        input.makeLastInputStale();
        mainLoopLastTime = performance.now();
        cpu.stepCount--;
      } else if (
        !global.paused &&
        performance.now() - mainLoopLastTime >= frameInterval
      ) {
        timer.decrement();
        sound.play();
        for (let i = 0; i < 11; i++) {
          ui.selectCurrentCodeLine();
          ui.render();
          cpu.tick();
        }
        input.makeLastInputStale();
        mainLoopLastTime = performance.now();
      }
      ns.mainLoopFrame = requestAnimationFrame(mainLoop);
    };
    ns.mainLoopFrame = requestAnimationFrame(mainLoop);
  };

  return ns;
};

export { createUtils };
