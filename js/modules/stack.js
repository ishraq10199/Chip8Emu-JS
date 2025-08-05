const { chip8 } = window;

chip8.stack = (() => {
  const _stack = [];
  const ns = Object.create(null);
  ns.push = (item) => {
    _stack.push(item);
    chip8.ui.pushNewItemToStack(item);
  }
  ns.pop = () => {
    chip8.ui.removeLastItemFromStack();
    return _stack.pop();
  };
  ns.clear = () => {
    _stack.length = 0;
  };
  ns.top = () => _stack.length && _stack[_stack.length - 1];
  ns.get = () => _stack;
  return ns;
})();
