// TODO: adjust quirks and test further
let instance;

/**
 * As per the [Timendous quirk test](https://www.youtube.com/watch?v=OMxaxSq9oEI)
 * The comment above each of these flag declarations represent the result of each test
 *    e.g. Shifting" means that setting the to `false` will set the test result of "Shifting" to true
 *
 */
const getQuirksInstance = () => {
  if (instance) {
    return instance;
  }
  const ns = Object.create(null);
  instance = ns;

  // "!Shifting"
  ns.useVYinShifts = false;
  // Jumping
  ns.jumpWithOffsetAlt = false;
  // Memory
  ns.incIduringRegRW = true;

  // Quirks not implemented/default behavior is fixed:
  //  - Disp.wait
  //  - Clipping
  //  - VF Reset

  return ns;
};

export { getQuirksInstance };
