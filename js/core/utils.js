import { checkInstanceDependencies } from "../utils/depUtils.js";

let instance;

const getUtilsInstance = ({ getInstance }) => {
  if (instance) {
    return instance;
  }
  const ns = Object.create(null);
  instance = ns;

  /**
   * Load the instance's internal methods and properties asynchronously
   */
  (async () => {
    const memoryUtils = getInstance("memoryUtils");
    const ui = getInstance("ui");
    const cpu = getInstance("cpu");
    const display = getInstance("display");
    const input = getInstance("input");
    const sound = getInstance("sound");
    const timer = getInstance("timer");
    const rom = getInstance("rom");
    const global = getInstance("global");

    checkInstanceDependencies("utils", {
      memoryUtils,
      ui,
      cpu,
      display,
      input,
      sound,
      timer,
      rom,
      global,
    });

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
  })();

  return ns;
};

export { getUtilsInstance };
