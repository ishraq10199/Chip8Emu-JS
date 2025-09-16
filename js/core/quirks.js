// TODO: adjust quirks and test further
const getQuirksInstance = () => {
  const ns = Object.create(null);
  ns.useVYinShifts = false;
  ns.jumpWithOffsetAlt = false;
  ns.incIduringRegRW = false;
  return ns;
};

export { getQuirksInstance };
