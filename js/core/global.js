let instance;

const getGlobalInstance = () => {
  if (instance) {
    return instance;
  }
  const ns = Object.create(null);
  instance = ns;

  /**
   * Load the instance's internal methods and properties asynchronously
   */
  (async () => {
    ns.paused = false;
    ns.debug = !!localStorage.getItem("debug") || false;
  })();

  return ns;
};

export { getGlobalInstance };
