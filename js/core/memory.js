let instance;

/**
 *
 * @param {Object} instanceProvider - An object that has the necessary methods to fetch singleton instances
 * @param {Function} instanceProvider.getInstance - Function that loads other modules as dependencies
 *
 * @returns {Object} Singleton instance for the current module
 */
const getMemoryInstance = () => {
  if (instance) {
    return instance;
  }
  instance = new Uint8Array(4096);
  return instance;
};

export { getMemoryInstance };
