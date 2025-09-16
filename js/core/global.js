let instance;

const getGlobalInstance = () => {
  if (instance) {
    return instance;
  }
  const ns = Object.create(null);
  ns.paused = false;
  ns.debug = !!localStorage.getItem("debug") || false;
  instance = ns;
  return ns;
};

export { getGlobalInstance };
