const { chip8 } = window;

chip8.hexDump = (byteArray, skipBorders = false, bytesPerLine = 16) => {
  if (typeof byteArray !== 'object' || byteArray.constructor.name !== 'Uint8Array') {
    return;
  }
  if (!skipBorders) {
    console.log("----------------------Hexdump----------------------");
  }

  for (let i = 0; i < byteArray.length; i += bytesPerLine) {
    console.log(byteArray.slice(i, i + bytesPerLine).toHex().match(/.{1,2}/g).join(' '));
  }
  if (!skipBorders) {
    console.log("----------------------Enddump----------------------")
  }
};

chip8.run = () => {
  if (chip8.paused) {
    chip8.paused = false;
    document.querySelector("button#pause").innerHTML = 'Pause';
  }

  chip8.memoryUtils.populateFonts();
  chip8.loadRom();

  let fetchedInstruction;
  let decodedOperation;
  chip8.initCPU();
  chip8.display.clear();
  let mainLoopLastTime = performance.now();
  cancelAnimationFrame(chip8.mainLoopFrame);
  const mainLoop = () => {
    if (!chip8.paused && performance.now() - mainLoopLastTime >= 16.67) {
      chip8.timer.decrement();
      chip8.input.makeLastInputStale();
      for (let i = 0; i < 11; i++) {
        fetchedInstruction = chip8.cpu.fetch();
        decodedOperation = chip8.cpu.decode(fetchedInstruction);
        chip8.cpu.execute(decodedOperation);
      }
      mainLoopLastTime = performance.now();
    }
    chip8.mainLoopFrame = requestAnimationFrame(mainLoop);
  }
  chip8.mainLoopFrame = requestAnimationFrame(mainLoop);
};