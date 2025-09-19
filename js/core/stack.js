import { checkInstanceDependencies } from "../utils/depUtils.js";

let instance;

/**
 *
 * @param {Object} instanceProvider - An object that has the necessary methods to fetch singleton instances
 * @param {Function} instanceProvider.getInstance - Function that loads other modules as dependencies
 *
 * @returns {Object} Singleton instance for the current module
 */
const getStackInstance = ({ getInstance }) => {
  if (instance) {
    return instance;
  }

  const ns = Object.create(null);
  instance = ns;

  /**
   * Load the instance's internal methods and properties asynchronously
   */
  (async () => {
    const ui = getInstance("ui");

    checkInstanceDependencies("stack", {
      ui,
    });

    const _stack = [];
    ns.push = (item) => {
      _stack.push(item);
      ui.pushNewItemToStack(item);
    };
    ns.pop = () => {
      ui.removeLastItemFromStack();
      return _stack.pop();
    };
    ns.clear = () => {
      _stack.length = 0;
    };
    ns.top = () => _stack.length && _stack[_stack.length - 1];
    ns.get = () => _stack;
  })();

  return ns;
};

export { getStackInstance };
