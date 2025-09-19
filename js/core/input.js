let instance;

/**
 *
 * @param {Object} instanceProvider - An object that has the necessary methods to fetch singleton instances
 * @param {Function} instanceProvider.getInstance - Function that loads other modules as dependencies
 *
 * @returns {Object} Singleton instance for the current module
 */
const getInputInstance = () => {
  if (instance) {
    return instance;
  }

  const ns = Object.create(null);
  instance = ns;

  /**
   * Load the instance's internal methods and properties asynchronously
   */
  (async () => {
    const keys = new Uint8Array(16);
    const keyMap = new Array(16);
    const mapKey = Object.create(null);
    let freshInput = -1;
    const keyList = [
      0x1, 0x2, 0x3, 0xc, 0x4, 0x5, 0x6, 0xd, 0x7, 0x8, 0x9, 0xe, 0xa, 0x0, 0xb,
      0xf,
    ];

    // @todo Maybe approach this in a better way?
    keyMap[0x1] = "Digit1";
    keyMap[0x2] = "Digit2";
    keyMap[0x3] = "Digit3";
    keyMap[0xc] = "Digit4";

    keyMap[0x4] = "KeyQ";
    keyMap[0x5] = "KeyW";
    keyMap[0x6] = "KeyE";
    keyMap[0xd] = "KeyR";

    keyMap[0x7] = "KeyA";
    keyMap[0x8] = "KeyS";
    keyMap[0x9] = "KeyD";
    keyMap[0xe] = "KeyF";

    keyMap[0xa] = "KeyZ";
    keyMap[0x0] = "KeyX";
    keyMap[0xb] = "KeyC";
    keyMap[0xf] = "KeyV";

    // @todo Register key events
    // It should update `keys[key]` if pressed/released
    // Released state value should be 0, and pressed state should be 1
    for (let i = 0; i <= 0xf; i++) {
      mapKey[keyMap[i]] = i;
      window.addEventListener("keydown", ({ code: key }) => {
        if (mapKey[key] === undefined) {
          // Should add behavior here for kb shortcuts, if needed
          return;
        }
        keys[mapKey[key]] = 1;
      });
      window.addEventListener("keyup", ({ code: key }) => {
        if (mapKey[key] === undefined) {
          // Should add behavior here for kb shortcuts, if needed
          return;
        }
        freshInput = mapKey[key];
        keys[mapKey[key]] = 0;
      });
    }

    ns.isKeyPressed = (key) => {
      return keys[key];
    };

    ns.makeLastInputStale = () => {
      freshInput = -1;
    };

    ns.getLastFreshInput = () => {
      if (freshInput === -1) {
        return false;
      }
      return freshInput;
    };

    ns.keyList = keyList;
  })();

  return ns;
};

export { getInputInstance };
