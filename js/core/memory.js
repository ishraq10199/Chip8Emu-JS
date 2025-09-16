let instance;

const getMemoryInstance = () => {
  if (instance) {
    return instance;
  }
  instance = new Uint8Array(4096);
  return instance;
};

export { getMemoryInstance };
