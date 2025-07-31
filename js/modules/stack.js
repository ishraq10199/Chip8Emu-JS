const { chip8 } = window;

chip8.stack = (() => {
  // @todo Implement a simplified stack
  const _stack = [];
  const ns = Object.create(null);
  ns.push = _stack.push;
  ns.pop = _stack.pop;
  return ns;
})();
