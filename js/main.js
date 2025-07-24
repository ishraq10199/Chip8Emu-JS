const chip8 = Object.create(null);

chip8.registers = (() => {
  const ns = Object.create(null);
  
  // General purpose registers V0 ~ VF
  ns.V = new Uint8Array(16);
  ns.I = 0;
  // const _I = new Uint8Array(1);
  // Object.defineProperty(ns, 'I', {
  //   get: function() {
  //     return _I[0];
  //   },
  //   set:function(value) {
  //     _I[0] = value;
  //   },
  //   enumerable: true,
  //   configurable: false,
  // }); 
  
  return ns;
})();

chip8.stack = (() => {
  // @todo Implement a simplified stack
  const ns = Object.create(null);
  return ns;
})();

chip8.memory = new Uint8Array(4096);

chip8.memoryUtils = (() => {
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
    for (
      let i = 0x050, currentCharRow = 0, currentCharCol = 0;
      i <= 0x09f;
      i++, currentCharCol++
    ) {
      chip8.memory[i] = bitmaps[currentCharRow][currentCharCol];

      if (currentCharCol == 5) {
        currentCharCol = 0;
        currentCharRow++;
      }
    }
  };
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
  return ns;
})();

chip8.cpu = (() => {
  const ns = Object.create(null);
  const fetched = new Uint8Array(2);
  ns.PC = 0; 
  // const _PC = new Uint8Array(1);
  // Object.defineProperty(ns, 'PC', {
  //   get: function() {
  //     return _PC[0];
  //   },
  //   set: function(value) {
  //     console.log("Setting PC value to", value);
  //     _PC[0] = value;
  //     console.log(_PC[0]);
  //   },
  //   enumerable: true,
  //   configurable: false,
  // }); 

  ns.operations = Object.create(null);

  ns.operations.clearScreen = () => {
    chip8.display.clear();
  };

  ns.operations.jump = (address) => {
    chip8.cpu.PC = address;
  };

  ns.operations.setRegister = (register, value) => {
    chip8.registers.V[register] = value;
  };

  ns.operations.add = (register, value) => {
    chip8.registers.V[register] += value;
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

  ns.fetch = () => {
    // Read 2 bytes, and increment the PC by 2
    fetched[0] = chip8.memory[chip8.cpu.PC];
    fetched[1] = chip8.memory[chip8.cpu.PC + 1];
    console.log('fetched', `0x${fetched.toHex()}`, 'at PC', chip8.cpu.PC);
    chip8.cpu.PC += 2;
  };

  ns.decode = () => {
    // Switch-case statement to understand what needs to be done
    const opcode = fetched.toHex();
    let op = () => {}; // nop
    switch (opcode[0]) {
      case '0':
        if (opcode === '00e0') {
          console.log('Clearing screen');
          op = () => chip8.cpu.operations.clearScreen();
        }
        break;
      case '1':
        console.log('Jumping to address', (`0x${opcode.slice(1)}`));
        op = () => chip8.cpu.operations.jump(Number(`0x${opcode.slice(1)}`));
        break;
      case '6':
        console.log('Setting register', Number(`0x${opcode.slice(1, 2)}`), 'to value', Number(`0x${opcode.slice(2)}`));
        op = () => chip8.cpu.operations.setRegister(Number(`0x${opcode.slice(1, 2)}`), Number(`0x${opcode.slice(2)}`));
        break;
      case '7':
        console.log('Adding to register', Number(`0x${opcode.slice(1, 2)}`), 'a value of', Number(`0x${opcode.slice(2)}`));
        op = () => chip8.cpu.operations.add(Number(`0x${opcode.slice(1, 2)}`), Number(`0x${opcode.slice(2)}`));
        break;
      case 'a':
        console.log('Setting I to', Number(`0x${opcode.slice(1)}`));
        op = () => chip8.cpu.operations.setIndex(Number(`0x${opcode.slice(1)}`));
        break;
      case 'd':
        console.log('Drawing at', (`0x${opcode.slice(1, 2)}`), ',', (`0x${opcode.slice(2, 3)}`), '- a sprite of', `0x${opcode.slice(3)}`, 'rows');
        op = () => chip8.cpu.operations.draw(Number(`0x${opcode.slice(1, 2)}`), Number(`0x${opcode.slice(2, 3)}`), Number(`0x${opcode.slice(3)}`));
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
  // 1. Set program counter to 0x200
  // 2. Start the Fetch, decode, execute loop
}

chip8.romdata = Object.create(null);

chip8.initRomReader = () => {
  const input = document.querySelector("input#romupload");
  const readButton = document.querySelector("button#readrom");
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

chip8.run = async () => {
  chip8.loadRom();
  let op;
  chip8.cpu.PC = Number(0x200);
  console.log('PC:', chip8.cpu.PC);
  chip8.display.clear();
  const mainLoop = async() => {
    chip8.cpu.fetch();
    op = chip8.cpu.decode();
    chip8.cpu.execute(op);
    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);
};