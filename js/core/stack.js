import { checkInstanceDependencies } from "../utils/depUtils.js";

let instance;

const getStackInstance = ({ getInstance }) => {
  if (instance) {
    return instance;
  }

  const ui = getInstance("ui");

  checkInstanceDependencies("stack", {
    ui,
  });

  const _stack = [];
  const ns = Object.create(null);
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

  instance = ns;

  return ns;
};

export { getStackInstance };
