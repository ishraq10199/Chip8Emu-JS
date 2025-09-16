// TODO: adjust quirks and test further
let instance;

const getQuirksInstance = () => {
  if (instance) {
    return instance;
  }
  const ns = Object.create(null);
  instance = ns;
  ns.useVYinShifts = false;
  ns.jumpWithOffsetAlt = false;
  ns.incIduringRegRW = false;
  return ns;
};

export { getQuirksInstance };
