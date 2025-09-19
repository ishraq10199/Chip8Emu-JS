let instance;

/**
 *
 * @param {Object} instanceProvider - An object that has the necessary methods to fetch singleton instances
 * @param {Function} instanceProvider.getInstance - Function that loads other modules as dependencies
 *
 * @returns {Object} Singleton instance for the current module
 */
const getRegistersInstance = () => {
  if (instance) {
    return instance;
  }
  const ns = Object.create(null);
  instance = ns;

  /**
   * Load the instance's internal methods and properties asynchronously
   */
  (async () => {
    // general purpose registers v0 ~ vf
    ns.V = new Uint8Array(16);
    ns.I = 0;
  })();

  return ns;
};

export { getRegistersInstance };
