const { chip8 } = window;

const createStack = ({ ui }) => {
  for (const [k, v] of Object.entries({
    ui,
  })) {
    if (!v) {
      throw new Error(`[error] ${k} not provided during Stack instancing`);
    }
  }
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
  return ns;
};

export { createStack };
