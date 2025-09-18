import { checkInstanceDependencies } from "../utils/depUtils.js";

let instance;

const getROMInstance = ({ getInstance }) => {
  if (instance) {
    return instance;
  }
  const ns = Object.create(null);
  instance = ns;

  /**
   * Load the instance's internal methods and properties asynchronously
   */
  (async () => {
    const utils = getInstance("utils");
    const cpu = getInstance("cpu");
    const memory = getInstance("memory");
    const ui = getInstance("ui");
    const global = getInstance("global");

    checkInstanceDependencies("rom", {
      utils,
      cpu,
      memory,
      ui,
      global,
    });

    const romdata = Object.create(null);
    ns.romdata = romdata;

    ns.load = () => {
      if (!romdata.bytes || !romdata.bytes.length) {
        console.info("Could not load ROM - have you uploaded + read one?");
        return;
      }
      if (romdata.bytes.length >= 3986) {
        console.error("The uploaded ROM is an invalid chip8 ROM");
        return;
      }
      const rom = romdata.bytes;
      for (let i = 0, memIndex = 0x200; i < rom.length; i++, memIndex++) {
        memory[memIndex] = rom[i];
      }
      ui.renderMemory(16);
    };

    ns.init = () => {
      const input = document.querySelector("input#romupload");
      const readButton = document.querySelector("button#readrom");
      const pauseButton = document.querySelector("button#pause");

      window.readButton = readButton;

      readButton.addEventListener("click", () => {
        if (input.value === "") {
          console.log("No file uploaded");
          return;
        }
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
          global.debug &&
            console.log("------------------READING ROM------------------");
          romdata.raw = e.target.result;
          romdata.bytes = new Uint8Array(romdata.raw);
          global.debug && utils.hexDump(romdata.bytes, true);
          global.debug &&
            console.log("--------------------END ROM--------------------");
          utils.run();
        };

        reader.onerror = (e) => {
          console.log("------------------ROM READING ERROR------------------");
          console.error(e.type);
          console.log("----------------------END ERROR----------------------");
        };

        reader.readAsArrayBuffer(file);
      });

      pauseButton.addEventListener("click", () => {
        global.paused = !global.paused;
        cpu.stepCount = 0;
        pauseButton.innerHTML = global.paused ? "Resume" : "Pause";
      });
    };
  })();

  return ns;
};

export { getROMInstance };
