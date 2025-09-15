const createGlobal = () => {
  const ns = Object.create(null);
  ns.paused = false;
  ns.debug = !!localStorage.getItem("debug") || false;
  return ns;
};

export { createGlobal };
