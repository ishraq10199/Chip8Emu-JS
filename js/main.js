const chip8 = Object.create(null);

chip8.paused = false;

chip8.debug = false;

chip8.quirks = Object.create(null);
chip8.quirks.useVYinShifts = false;
chip8.quirks.jumpWithOffsetAlt = false;

chip8.input = (() => {
  const keys = new Uint8Array(16);
  const keyMap = new Array(16);
  const mapKey = Object.create(null);

  keyMap[0x1] = 'Digit1';
  keyMap[0x2] = 'Digit2';
  keyMap[0x3] = 'Digit3';
  keyMap[0xc] = 'Digit4';

  keyMap[0x4] = 'KeyQ';
  keyMap[0x5] = 'KeyW';
  keyMap[0x6] = 'KeyE';
  keyMap[0xd] = 'KeyR';

  keyMap[0x7] = 'KeyA';
  keyMap[0x8] = 'KeyS';
  keyMap[0x9] = 'KeyD';
  keyMap[0xe] = 'KeyF';

  keyMap[0xa] = 'KeyZ';
  keyMap[0x0] = 'KeyX';
  keyMap[0xb] = 'KeyC';
  keyMap[0xf] = 'KeyV';

  // @todo Register key events
  // It should update `keys[key]` if pressed/released
  // Released state value should be 0, and pressed state should be 1
  for (let i = 0; i < 0xF; i++) {
    mapKey[keyMap[i]] = i;
    window.addEventListener('keydown', ({code: key}) => {
      if (mapKey[key] === undefined) {
        // Should add behavior here for kb shortcuts, if needed
        return;
      }
      keys[mapKey[key]] = 1;
    });
    window.addEventListener('keyup', ({code: key}) => {
      if (mapKey[key] === undefined) {
        // Should add behavior here for kb shortcuts, if needed
        return;
      }
      keys[mapKey[key]] = 0;
    });
  }


  const ns = Object.create(null);
  ns.isKeyPressed = (key) => {
    return keys[key];
  };

  return ns;
})();

chip8.registers = (() => {
  const ns = Object.create(null);
  
  // General purpose registers V0 ~ VF
  ns.V = new Uint8Array(16);
  ns.I = 0;
  return ns;
})();

chip8.stack = (() => {
  // @todo Implement a simplified stack
  const _stack = [];
  const ns = Object.create(null);
  ns.push = _stack.push;
  ns.pop = _stack.pop;
  return ns;
})();

chip8.memory = new Uint8Array(4096);

chip8.memoryUtils = (() => {
  const fontMap = new Array(16);

  // @todo Program Counter, Index register operations here
  const ns = Object.create(null);
  ns.populateFonts = () => {
    // Bitmaps of chars in range 0 ~ F, where each char is represented using 5 bytes
    const bitmaps = [
      [0xf0, 0x90, 0x90, 0x90, 0xf0], // 0
      [0x20, 0x60, 0x20, 0x20, 0x70], // 1
      [0xf0, 0x10, 0xf0, 0x80, 0xf0], // 2
      [0xf0, 0x10, 0xf0, 0x10, 0xf0], // 3
      [0x90, 0x90, 0xf0, 0x10, 0x10], // 4
      [0xf0, 0x80, 0xf0, 0x10, 0xf0], // 5
      [0xf0, 0x80, 0xf0, 0x90, 0xf0], // 6
      [0xf0, 0x10, 0x20, 0x40, 0x40], // 7
      [0xf0, 0x90, 0xf0, 0x90, 0xf0], // 8
      [0xf0, 0x90, 0xf0, 0x10, 0xf0], // 9
      [0xf0, 0x90, 0xf0, 0x90, 0x90], // A
      [0xe0, 0x90, 0xe0, 0x90, 0xe0], // B
      [0xf0, 0x80, 0x80, 0x80, 0xf0], // C
      [0xe0, 0x90, 0x90, 0x90, 0xe0], // D
      [0xf0, 0x80, 0xf0, 0x80, 0xf0], // E
      [0xf0, 0x80, 0xf0, 0x80, 0x80], // F
    ];
    // By popular convention, we are using the memory from 0x050 (80) to 0x09F (160)
    const fontStart = 0x050;

    for (
      let i = fontStart, currentCharRow = 0, currentCharCol = 0;
      i < (fontStart + 80);
      i++
    ) {
      if (currentCharCol === 0) {
        fontMap[currentCharRow] = i;
      }
      chip8.memory[i] = bitmaps[currentCharRow][currentCharCol];

      if (currentCharCol === 4) {
        currentCharCol = 0;
        currentCharRow++;
      }
      else {
        currentCharCol++;
      }
    }
  };
  ns.fontMap = fontMap;
  return ns;
})();

chip8.display = (() => {
  const displayEl = document.querySelector("#chip8display");
  const canvas = displayEl.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  const COLOR_BLACK = '#000000';
  const COLOR_WHITE = '#FFFFFF';
  const SCREEN_WIDTH = 64;
  const SCREEN_HEIGHT = 32;
  const SCALE_FACTOR = 8;

  // We can just use the 64x32 coordinate space after this
  ctx.scale(SCALE_FACTOR, SCALE_FACTOR);

  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const ns = Object.create(null);
  
  ns.clear = () => {
    ctx.fillStyle = COLOR_BLACK;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
  
  ns.draw = (root_x, root_y, data) => {
    // `root_x` and `root_y` coords must be "sanitized" beforehand
    // `data` should be of type Uint8Array, and should contain N bytes, for N rows
    let x = root_x;
    let y = root_y;
    chip8.registers.V[0xF] = 0;
    for (let i = 0, x = root_x; i < data.length; i++, y++) {
      if (y >= SCREEN_HEIGHT) {
        break;
      }
      const currentRow = ctx.getImageData(x * SCALE_FACTOR, y * SCALE_FACTOR, 8 * SCALE_FACTOR, 1)
                          .data.filter((_, idx) => !(idx % (4 * SCALE_FACTOR)));
      const toDraw = data[i];
      let currentPixel = 0;
      let toDrawBit = 0;
      for (let bit = 0; bit < 8; bit++) {
        currentPixel = currentRow[bit] & 1;
        toDrawBit = (toDraw >> (7-bit)) & 1;
        chip8.registers.V[0xF] = currentPixel & toDrawBit & 1;
        ctx.fillStyle = currentPixel ^ ((toDraw >> (7-bit)) & 1) ? COLOR_WHITE : COLOR_BLACK;
        ctx.fillRect(x + bit, y, 1, 1);
      }
    }
  };

  ns.SCREEN_WIDTH = SCREEN_WIDTH;
  ns.SCREEN_HEIGHT = SCREEN_HEIGHT;
  ns.ctx = ctx;

  return ns;
})();

chip8.timer = (() => {
  const DELAY = 0;
  const SOUND = 1;
  const timers = new Uint8Array(2);

  // @todo Timer logic
  const ns = Object.create(null);

  Object.defineProperty(ns, 'delay', {
    get() {
      return timers[DELAY];
    },
    set(value) {
      timers[DELAY] = value;
    },
    configurable: false,
    enumerable: false,
  });

  Object.defineProperty(ns, 'sound', {
    get() {
      return timers[SOUND];
    },
    set(value) {
      timers[SOUND] = value;
    },
    configurable: false,
    enumerable: false,
  });

  return ns;
})();

chip8.cpu = (() => {
  const ns = Object.create(null);
  const fetched = new Uint8Array(2);
  ns.PC = 0;
  ns.operations = Object.create(null);

  ns.operations.clearScreen = () => {
    chip8.display.clear();
  };

  ns.operations.jump = (address) => {
    chip8.cpu.PC = address;
  };

  ns.operations.setRegVal = (register, value) => {
    chip8.registers.V[register] = value;
  };

  ns.operations.setRegReg = (registerX, registerY) => {
    chip8.registers.V[registerX] = chip8.registers.V[registerY]
  };

  ns.operations.addWithoutCarry = (register, value) => {
    chip8.registers.V[register] += value;
  };

  ns.operations.addWithCarry = (registerX, registerY) => {
    const sum = chip8.registers.V[registerX] + chip8.registers.V[registerY];
    chip8.registers.V[registerX] = sum;
    chip8.registers.V[0xF] = (sum > 255) & 1;
  };

  ns.operations.subtract = (registerX, registerY, negate = false) => {
    const difference = chip8.registers.V[registerX] - chip8.registers.V[registerY] * (negate ? -1 : 1);
    chip8.registers.V[registerX] = difference;
    chip8.registers.V[0xF] = (difference >= 0) & 1;
  };

  ns.operations.binOR = (registerX, registerY) => {
    chip8.registers.V[registerX] |= chip8.registers.V[registerY];
  };

  ns.operations.binAND = (registerX, registerY) => {
    chip8.registers.V[registerX] &= chip8.registers.V[registerY];
  };

  ns.operations.binXOR = (registerX, registerY) => {
    chip8.registers.V[registerX] ^= chip8.registers.V[registerY];
  };

  ns.operations.setIndex = (value) => {
    chip8.registers.I = value;
  };

  ns.operations.draw = (x, y, n) => {
    const idx = chip8.registers.I;
    const { SCREEN_WIDTH: w, SCREEN_HEIGHT: h } = chip8.display;
    const spriteData = chip8.memory.slice(idx, idx + n);
    const root_x = chip8.registers.V[x];
    const root_y = chip8.registers.V[y];
    // chip8.display.draw(x, y, spriteData);
    chip8.display.draw(root_x % w, root_y % h, spriteData);
  };

  ns.operations.callSubroutine = (address) => {
    chip8.stack.push(chip8.cpu.PC);
    chip8.cpu.PC = address;
  };

  ns.operations.returnFromSubroutine = () => {
    chip8.cpu.PC = chip8.stack.pop();
  };

  ns.operations.skipEqualVal = (register, value) => {
    if (chip8.registers.V[register] === value) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.skipNotEqualVal = (register, value) => {
    if (chip8.registers.V[register] !== value) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.skipEqualReg = (registerX, registerY) => {
    if (chip8.registers.V[registerX] === chip8.registers.V[registerY]) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.skipNotEqualReg = (registerX, registerY) => {
    if (chip8.registers.V[registerX] !== chip8.registers.V[registerY]) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.shiftRight = (registerX, registerY) => {
    if (chip8.quirks.useVYinShifts) {
      chip8.registers.V[registerX] = chip8.registers.V[registerY];
    }
    chip8.registers.V[0xF] = chip8.registers.V[registerX] & 1;
    chip8.registers.V[registerX] = chip8.registers.V[registerX] >> 1;
  };

  ns.operations.shiftLeft = (registerX, registerY) => {
    if (chip8.quirks.useVYinShifts) {
      chip8.registers.V[registerX] = chip8.registers.V[registerY];
    }
    chip8.registers.V[0xF] = (chip8.registers.V[registerX] >> 7) & 1;
    chip8.registers.V[registerX] = chip8.registers.V[registerX] << 1;
  };

  ns.operations.jumpWithOffset = (address, register) => {
    // Jumps to NNN + V[0]
    chip8.cpu.PC = address + chip8.registers.V[register || 0];
  };

  ns.operations.generateRandomNumber = (register, value) => {
    chip8.registers.V[register] = Math.floor(Math.random() * 256) & value;
  };

  ns.operations.readDelayTimer = (register) => {
    chip8.registers.V[register] = chip8.timer.delay; 
  };

  ns.operations.writeDelayTimer = (register) => {
    chip8.timer.delay = chip8.registers.V[register];
  };

  ns.operations.writeSoundTimer = (register) => {
    chip8.timer.sound = chip8.registers.V[register];
  };

  ns.operations.addToIndex = (register) => {
    const nextAddress = chip8.registers.I + chip8.registers.V[register];
    chip8.registers.I = nextAddress;
    // Set the flag register if I overflows beyond addressable memory
    if (nextAddress > 0x0FFF) {
      chip8.registers.V[0xF] = 1;
    }
  };

  ns.operations.fontCharacter = (register) => {
    const hexCode = chip8.registers.V[register] & 0xF;
    chip8.registers.I = chip8.memoryUtils.fontMap[hexCode];
  };

  ns.fetch = () => {
    // Read 2 bytes, and increment the PC by 2
    fetched[0] = chip8.memory[chip8.cpu.PC];
    fetched[1] = chip8.memory[chip8.cpu.PC + 1];
    chip8.debug && console.log('fetched', `0x${fetched.toHex()}`, 'at PC', chip8.cpu.PC);
    chip8.cpu.PC += 2;

    return fetched.toHex();
  };

  ns.decode = (instruction) => {
    // Switch-case statement to understand what needs to be done

    const X = Number(`0x${instruction[1]}`);
    const Y = Number(`0x${instruction[2]}`);
    const N = Number(`0x${instruction[3]}`);
    const NN = Number(`0x${instruction.slice(2)}`);
    const NNN = Number(`0x${instruction.slice(1)}`);

    let op = () => {}; // nop
    switch (instruction[0]) {
      case '0':
        switch (instruction.slice(1)) {
          case '0e0':
            chip8.debug && console.log('Clearing screen');
            op = () => chip8.cpu.operations.clearScreen();
            break;
          case '0ee':
            chip8.debug && console.log('Returning from subroutine to', `0x${chip8.stack[chip8.stack.length - 1].toString(16)}`);
            op = () => chip8.cpu.operations.returnFromSubroutine();
            break;
        }
        break;
      case '1':
        chip8.debug && console.log('Jumping to address', (`0x${NNN.toString(16)}`));
        op = () => chip8.cpu.operations.jump(NNN);
        break;
      case '2':
        chip8.debug && console.log('Jumping to subroutine at', (`0x${NNN.toString(16)}`));
        op = () => chip8.cpu.operations.callSubroutine(NNN);
        break;
      case '3':
        chip8.debug && console.log('Will skip next instruction if register', X, 'equals', NN);
        op = () => chip8.cpu.operations.skipEqualVal(X, NN);
        break;
      case '4':
        chip8.debug && console.log('Will skip next instruction if register', X, 'not equals', NN);
        op = () => chip8.cpu.operations.skipNotEqualVal(X, NN);
        break;
      case '5':
        chip8.debug && console.log('Will skip next instruction if register', X, 'equals register', Y);
        op = () => chip8.cpu.operations.skipEqualReg(X, Y);
        break;
      case '9':
        chip8.debug && console.log('Will skip next instruction if register', X, 'not equals register', Y);
        op = () => chip8.cpu.operations.skipNotEqualReg(X, Y);
        break;
      case '6':
        chip8.debug && console.log('Setting register', X, 'to value', NN);
        op = () => chip8.cpu.operations.setRegVal(X, NN);
        break;
      case '7':
        chip8.debug && console.log('Adding to register', X, 'a value of', NN);
        op = () => chip8.cpu.operations.addWithoutCarry(X, NN);
        break;
      case '8':
        switch (N) {
          case 0x0:
            chip8.debug && console.log('Setting value of register', X, 'to value of register', Y);
            op = () => chip8.cpu.operations.setRegReg(X, Y);
            break;
          case 0x1:
            chip8.debug && console.log('Binary OR between registers', X, 'and', Y);
            op = () => chip8.cpu.operations.binOR(X, Y);
            break;
          case 0x2:
            chip8.debug && console.log('Binary AND between registers', X, 'and', Y);
            op = () => chip8.cpu.operations.binAND(X, Y);
            break;
          case 0x3:
            chip8.debug && console.log('Binary XOR between registers', X, 'and', Y);
            op = () => chip8.cpu.operations.binXOR(X, Y);
            break;
          case 0x4:
            chip8.debug && console.log('Adding values between registers', X, 'and', Y, 'with carry');
            op = () => chip8.cpu.operations.addWithCarry(X, Y);
            break;
          case 0x5:
            chip8.debug && console.log('Subtracting value of register', Y, 'from', X);
            op = () => chip8.cpu.operations.subtract(X, Y);
            break;
          case 0x7:
            chip8.debug && console.log('Subtracting value of register', X, 'from', Y);
            op = () => chip8.cpu.operations.subtract(X, Y, true);
            break;
          case 0x6:
            chip8.debug && console.log('Shifting right, using registers', X, 'and', Y);
            op = () => chip8.cpu.operations.shiftRight(X, Y);
            break;
          case 0xE:
            chip8.debug && console.log('Shifting left, using registers', X, 'and', Y);
            op = () => chip8.cpu.operations.shiftLeft(X, Y);
            break;
        } 
        break;
      case 'a':
        chip8.debug && console.log('Setting I to', `0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.setIndex(NNN);
        break;
      case 'b':
        chip8.debug && console.log('Jumping with offset', `0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.jumpWithOffset(NNN, chip8.quirks.jumpWithOffsetAlt ? X : 0);
        break;
      case 'c':
        chip8.debug && console.log('Generating random number, ' `0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.generateRandomNumber(X, NN);
        break;
      case 'd':
        chip8.debug && console.log('Drawing at', X, ',', Y, '- a sprite of', N, 'rows');
        op = () => chip8.cpu.operations.draw(X, Y, N);
        break;
    }
    // Pass on the data/instruction to `execute`
    return op;
  };

  ns.execute = (operation) => {
    if (typeof operation === 'function') {
      operation();
    }
    // Run the decoded instruction
  };
  return ns;
})();

chip8.initCPU = () => {
  chip8.cpu.PC = Number(0x200);
}

chip8.romdata = Object.create(null);

chip8.initRomReader = () => {
  const input = document.querySelector("input#romupload");
  const readButton = document.querySelector("button#readrom");
  const pauseButton = document.querySelector("button#pause");

  window.readButton = readButton;

  readButton.addEventListener('click', () => {
    if (input.value === '') {
      console.log('No file uploaded');
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      console.log('------------------READING ROM------------------');
      chip8.romdata.raw = e.target.result;
      chip8.romdata.bytes = new Uint8Array(chip8.romdata.raw);
      hexDump(chip8.romdata.bytes, true);
      console.log('--------------------END ROM--------------------');
      chip8.run();
    };

    reader.onerror = (e) => {
      console.log('------------------ROM READING ERROR------------------');
      console.log(e.type);
      console.log('----------------------END ERROR----------------------');
    };

    reader.readAsArrayBuffer(file);
  });

  pauseButton.addEventListener('click', () => {
    chip8.paused = !chip8.paused;
    pauseButton.innerHTML = chip8.paused ? 'Resume' : 'Pause';  
  });
}

const hexDump = (byteArray, skipBorders = false, bytesPerLine = 16) => {
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
}

chip8.loadRom = () => {
  if (!chip8.romdata.bytes || !chip8.romdata.bytes.length) {
    console.log('Could not load ROM - have you uploaded + read one?');
    return;
  }
  if (chip8.romdata.bytes.length >= 3986) {
    console.log('The uploaded ROM is an invalid chip8 ROM');
    return;
  }
  const rom = chip8.romdata.bytes;
  for (let i = 0, memIndex = 0x200; i < rom.length; i++, memIndex++) {
    chip8.memory[memIndex] = rom[i];
  }
};

chip8.initRomReader();

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
  let startTime = NaN;
  const mainLoop = (ts) => {
    if (chip8.paused) {
      requestAnimationFrame(mainLoop);
    }
    else if (ts - startTime < 16.667) {
      // Will make instructions run at roughly 60Hz
      requestAnimationFrame(mainLoop);
    }
    else {
      chip8.debug && console.log('Milliseconds elapsed since last FDE loop:', ts - startTime);
      startTime = ts;
      fetchedInstruction = chip8.cpu.fetch();
      decodedOperation = chip8.cpu.decode(fetchedInstruction);
      chip8.cpu.execute(decodedOperation);
      requestAnimationFrame(mainLoop);
    }
  }
  requestAnimationFrame(mainLoop);
};