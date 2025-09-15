const { chip8 } = window;

const createRegisters = () => {
  const ns = Object.create(null);

  // general purpose registers v0 ~ vf
  ns.V = new Uint8Array(16);
  ns.I = 0;
  return ns;
};

export { createRegisters };
