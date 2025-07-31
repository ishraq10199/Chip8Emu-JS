const { chip8 } = window;

chip8.timer = (() => {
  const DELAY = 0;
  const SOUND = 1;
  const timers = new Uint8ClampedArray(2);

  // @todo Timer logic
  const ns = Object.create(null);

  ns.setDelay = (value) => {
    timers[DELAY] = value;
  };

  ns.getDelay = () => timers[DELAY];

  ns.setSound = (value) => {
    timers[SOUND] = value;
  };

  ns.getSound = () => timers[SOUND];

  ns.decrement = () => {
    if (timers[DELAY]) {
      timers[DELAY]--;
    }
    if (timers[SOUND]) {
      timers[SOUND]--;
    }
  }

  return ns;
})();