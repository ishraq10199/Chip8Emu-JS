import { checkInstanceDependencies } from "../utils/depUtils.js";

let instance;

const getStackInstance = ({ getInstance }) => {
  if (instance) {
    return instance;
  }

  const ns = Object.create(null);
  instance = ns;

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
