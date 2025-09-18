/**
 *
 * @returns instanceProvider - An object that can add and retrieve module instances
 */
const getInstanceProvider = () => {
  const ns = Object.create(null);
  const instanceFns = Object.create(null);

  /**
   *
   * @param {string} moduleName The name of the module (e.g. 'cpu', 'memory', etc.)
   * @returns {Object} instance - the module instance/singleton
   *
   */
  ns.getInstance = (moduleName) => instanceFns[moduleName]();

  /**
   *
   * @param {string} moduleName The name of the module (e.g. 'cpu', 'memory', etc.)
   * @param {Function} instanceFn The function to create/get the singleton (e.g. `createCPU`, `createMemory`, etc.)
   *
   */
  ns.addInstance = (moduleName, instanceFn) => {
    instanceFns[moduleName] = instanceFn.bind(null, ns);
  };

  return ns;
};

/**
 * For a specified module, validate its dependencies.
 * For not the validation logic simply checks if the dependencies are valid JS objects
 *
 * @param {string} moduleName The name of the module (e.g. 'cpu', 'memory', etc.)
 * @param {Object} instanceDeps The objects that the module depend on - each must be a singleton instance
 */
const checkInstanceDependencies = (
  moduleName = "module",
  instanceDeps = {}
) => {
  for (const [k, v] of Object.entries(instanceDeps)) {
    if (!v || typeof v !== "object") {
      throw new Error(
        `[error] ${k} not provided during ${moduleName} instancing`
      );
    }
  }
};

export { checkInstanceDependencies, getInstanceProvider };
