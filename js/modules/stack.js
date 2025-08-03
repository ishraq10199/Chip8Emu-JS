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
  ns.get = () => _stack;
  return ns;
})();
