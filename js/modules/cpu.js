const { chip8 } = window;

chip8.cpu = (() => {
  const ns = Object.create(null);
  const fetched = new Uint8Array(2);
  ns.PC = 0;
  ns.operations = Object.create(null);
  
  ns.init = () => {
    for (let i = 0; i < chip8.registers.V.length; i++) {
      chip8.registers.V[i] = 0;
    }
    chip8.timer.setDelay(0);
    chip8.timer.setSound(0);
    chip8.stack.clear();
    chip8.cpu.PC = Number(0x200);
  };

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
    const difference = (chip8.registers.V[registerX] - chip8.registers.V[registerY]) * (negate ? -1 : 1);
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
    const shiftedOut = chip8.registers.V[registerX] & 1;
    chip8.registers.V[registerX] = chip8.registers.V[registerX] >> 1;
    chip8.registers.V[0xF] = shiftedOut;
  };

  ns.operations.shiftLeft = (registerX, registerY) => {
    if (chip8.quirks.useVYinShifts) {
      chip8.registers.V[registerX] = chip8.registers.V[registerY];
    }
    const shiftedOut = (chip8.registers.V[registerX] >> 7) & 1;
    chip8.registers.V[registerX] = chip8.registers.V[registerX] << 1;
    chip8.registers.V[0xF] = shiftedOut;
  };

  ns.operations.jumpWithOffset = (address, register) => {
    // Jumps to NNN + V[0]
    chip8.cpu.PC = address + chip8.registers.V[register || 0];
  };

  ns.operations.generateRandomNumber = (register, value) => {
    chip8.registers.V[register] = Math.floor(Math.random() * 256) & value;
  };

  ns.operations.readDelayTimer = (register) => {
    chip8.registers.V[register] = chip8.timer.getDelay(); 
  };

  ns.operations.writeDelayTimer = (register) => {
    chip8.timer.setDelay(chip8.registers.V[register]);
  };

  ns.operations.writeSoundTimer = (register) => {
    chip8.timer.setSound(chip8.registers.V[register]);
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

  ns.operations.bcdConvert = (register) => {
    const num = chip8.registers.V[register];
    const digits = [100, 10, 1].map(div => Math.floor(num / div) % 10);
    for (let offset = 0; offset < 3; offset++) {
      chip8.memory[chip8.registers.I + offset] = digits[offset];
    }
  };

  ns.operations.storeRegisters = (registerLimit) => {
    for (let offset = 0; offset <= registerLimit; offset++) {
      chip8.memory[chip8.registers.I + offset] = chip8.registers.V[offset];
    }
    if (chip8.quirks.incIduringRegRW) {
      chip8.registers.I += registerLimit + 1;
    }
  };

  ns.operations.loadRegisters = (registerLimit) => {
    for (let offset = 0; offset <= registerLimit; offset++) {
      chip8.registers.V[offset] = chip8.memory[chip8.registers.I + offset];
    }
    if (chip8.quirks.incIduringRegRW) {
      chip8.registers.I += registerLimit + 1;
    }
  };

  ns.operations.skipIfKeyPressed = (register) => {
    if (chip8.input.isKeyPressed(chip8.registers.V[register])) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.skipIfKeyNotPressed = (register) => {
    if (!chip8.input.isKeyPressed(chip8.registers.V[register])) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.getKey = (register) => {
    const key = chip8.input.getLastFreshInput();
    if (!key) {
      chip8.cpu.PC -= 2;
      return;
    }
    chip8.registers.V[register] = key;
  };

  ns.fetch = () => {
    // Read 2 bytes, and increment the PC by 2
    fetched[0] = chip8.memory[chip8.cpu.PC];
    fetched[1] = chip8.memory[chip8.cpu.PC + 1];
    chip8.debug && chip8.ui.verboseLog('fetched', `0x${fetched.toHex()}`, 'at PC', chip8.cpu.PC);
    chip8.cpu.PC += 2;

    return fetched.toHex();
  };

  ns.decode = (instruction) => {
    const X = Number(`0x${instruction[1]}`);
    const Y = Number(`0x${instruction[2]}`);
    const N = Number(`0x${instruction[3]}`);
    const NN = Number(`0x${instruction.slice(2)}`);
    const NNN = Number(`0x${instruction.slice(1)}`);

    const defaultOp = () => {
      console.error("Unimplemented instruction - ", instruction);
    };
    let op = defaultOp;
    switch (instruction[0]) {
      case '0':
        switch (instruction.slice(1)) {
          case '0e0':
            chip8.debug && chip8.ui.verboseLog('Clearing screen');
            op = () => chip8.cpu.operations.clearScreen();
            break;
          case '0ee':
            chip8.debug && chip8.ui.verboseLog('Returning from subroutine to', `0x${chip8.stack.top().toString(16)}`);
            op = () => chip8.cpu.operations.returnFromSubroutine();
            break;
        }
        break;
      case '1':
        chip8.debug && chip8.ui.verboseLog('Jumping to address', (`0x${NNN.toString(16)}`));
        op = () => chip8.cpu.operations.jump(NNN);
        break;
      case '2':
        chip8.debug && chip8.ui.verboseLog('Jumping to subroutine at', (`0x${NNN.toString(16)}`));
        op = () => chip8.cpu.operations.callSubroutine(NNN);
        break;
      case '3':
        chip8.debug && chip8.ui.verboseLog('Will skip next instruction if register', X, 'equals', NN);
        op = () => chip8.cpu.operations.skipEqualVal(X, NN);
        break;
      case '4':
        chip8.debug && chip8.ui.verboseLog('Will skip next instruction if register', X, 'not equals', NN);
        op = () => chip8.cpu.operations.skipNotEqualVal(X, NN);
        break;
      case '5':
        chip8.debug && chip8.ui.verboseLog('Will skip next instruction if register', X, 'equals register', Y);
        op = () => chip8.cpu.operations.skipEqualReg(X, Y);
        break;
      case '9':
        chip8.debug && chip8.ui.verboseLog('Will skip next instruction if register', X, 'not equals register', Y);
        op = () => chip8.cpu.operations.skipNotEqualReg(X, Y);
        break;
      case '6':
        chip8.debug && chip8.ui.verboseLog('Setting register', X, 'to value', NN);
        op = () => chip8.cpu.operations.setRegVal(X, NN);
        break;
      case '7':
        chip8.debug && chip8.ui.verboseLog('Adding to register', X, 'a value of', NN);
        op = () => chip8.cpu.operations.addWithoutCarry(X, NN);
        break;
      case '8':
        switch (N) {
          case 0x0:
            chip8.debug && chip8.ui.verboseLog('Setting value of register', X, 'to value of register', Y);
            op = () => chip8.cpu.operations.setRegReg(X, Y);
            break;
          case 0x1:
            chip8.debug && chip8.ui.verboseLog('Binary OR between registers', X, 'and', Y);
            op = () => chip8.cpu.operations.binOR(X, Y);
            break;
          case 0x2:
            chip8.debug && chip8.ui.verboseLog('Binary AND between registers', X, 'and', Y);
            op = () => chip8.cpu.operations.binAND(X, Y);
            break;
          case 0x3:
            chip8.debug && chip8.ui.verboseLog('Binary XOR between registers', X, 'and', Y);
            op = () => chip8.cpu.operations.binXOR(X, Y);
            break;
          case 0x4:
            chip8.debug && chip8.ui.verboseLog('Adding values between registers', X, 'and', Y, 'with carry');
            op = () => chip8.cpu.operations.addWithCarry(X, Y);
            break;
          case 0x5:
            chip8.debug && chip8.ui.verboseLog('Subtracting value of register', Y, 'from', X);
            op = () => chip8.cpu.operations.subtract(X, Y);
            break;
          case 0x7:
            chip8.debug && chip8.ui.verboseLog('Subtracting value of register', X, 'from', Y);
            op = () => chip8.cpu.operations.subtract(X, Y, true);
            break;
          case 0x6:
            chip8.debug && chip8.ui.verboseLog('Shifting right, using registers', X, 'and', Y);
            op = () => chip8.cpu.operations.shiftRight(X, Y);
            break;
          case 0xE:
            chip8.debug && chip8.ui.verboseLog('Shifting left, using registers', X, 'and', Y);
            op = () => chip8.cpu.operations.shiftLeft(X, Y);
            break;
        } 
        break;
      case 'a':
        chip8.debug && chip8.ui.verboseLog('Setting I to', `0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.setIndex(NNN);
        break;
      case 'b':
        chip8.debug && chip8.ui.verboseLog('Jumping with offset', `0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.jumpWithOffset(NNN, chip8.quirks.jumpWithOffsetAlt ? X : 0);
        break;
      case 'c':
        chip8.debug && chip8.ui.verboseLog('Generating random number, ' `0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.generateRandomNumber(X, NN);
        break;
      case 'd':
        chip8.debug && chip8.ui.verboseLog('Drawing at', X, ',', Y, '- a sprite of', N, 'rows');
        op = () => chip8.cpu.operations.draw(X, Y, N);
        break;
      case 'e':
        switch (NN) {
          case 0x9e:
            chip8.debug && chip8.ui.verboseLog('Skipped if key in register', `0x${X.toString(16)}`, 'pressed');
            op = () => chip8.cpu.operations.skipIfKeyPressed(X);
            break;
          case 0xa1:
            chip8.debug && chip8.ui.verboseLog('Skipped if key in register', `0x${X.toString(16)}`, 'not pressed');
            op = () => chip8.cpu.operations.skipIfKeyNotPressed(X);
            break;
        }
        break;
      case 'f':
        switch (NN) {
          case 0x07:
            chip8.debug && chip8.ui.verboseLog('Read delay timer to register', `0x${X.toString(16)}`);
            op = () => chip8.cpu.operations.readDelayTimer(X);
            break;
          case 0x15:
            chip8.debug && chip8.ui.verboseLog('Set delay timer from register', `0x${X.toString(16)}`);
            op = () => chip8.cpu.operations.writeDelayTimer(X);
            break;
          case 0x18:
            chip8.debug && chip8.ui.verboseLog('Set sound timer from register', `0x${X.toString(16)}`);
            op = () => chip8.cpu.operations.writeSoundTimer(X);
            break;
          case 0x1e:
            chip8.debug && chip8.ui.verboseLog('Adding to index the value from register', `0x${X.toString(16)}`);
            op = () => chip8.cpu.operations.addToIndex(X);
            break;
          case 0x0a:
            chip8.debug && chip8.ui.verboseLog('Waiting for fresh key input into register', `0x${X.toString(16)}`);
            op = () => chip8.cpu.operations.getKey(X);
            break;
          case 0x29:
            chip8.debug && chip8.ui.verboseLog('Setting index to font character in register', `0x${X.toString(16)}`);
            op = () => chip8.cpu.operations.fontCharacter(X);
            break;
          case 0x33:
            chip8.debug && chip8.ui.verboseLog('Storing binary coded decimal value at index from register', `0x${X.toString(16)}`);
            op = () => chip8.cpu.operations.bcdConvert(X);
            break;
          case 0x55:
            chip8.debug && chip8.ui.verboseLog('Storing in memory values in registers from 0 to', `0x${X.toString(16)}`);
            op = () => chip8.cpu.operations.storeRegisters(X);
            break;
          case 0x65:
            chip8.debug && chip8.ui.verboseLog('Loading from memory values to registers from 0 to', `0x${X.toString(16)}`);
            op = () => chip8.cpu.operations.loadRegisters(X);
            break;
        }
        break;
    }
    // Pass on the data/instruction to `execute`
    return op;
  };

  ns.execute = (operation) => {
    if (typeof operation === 'function') {
      operation();
    }
  };

  ns.tick = () => {
    const fetchedInstruction = ns.fetch();
    const decodedOperation = ns.decode(fetchedInstruction);
    ns.execute(decodedOperation);
  };

  ns.stepCount = 0;

  return ns;

})();