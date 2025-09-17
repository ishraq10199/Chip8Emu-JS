let instance;

const getGlobalInstance = () => {
  if (instance) {
    return instance;
  }
  const ns = Object.create(null);
  instance = ns;

  (async () => {
    ns.paused = false;
    ns.debug = !!localStorage.getItem("debug") || false;
  })();

  return ns;
};

export { getGlobalInstance };
