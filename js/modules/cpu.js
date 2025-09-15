const createCPU = ({
  timer,
  stack,
  display,
  registers,
  quirks,
  input,
  memory,
  global,
}) => {
  for (const [k, v] of Object.entries({
    timer,
    stack,
    display,
    registers,
    quirks,
    input,
    memory,
    global,
  })) {
    if (!v) {
      throw new Error(`[error] ${k} not provided during CPU instancing`);
    }
  }

  const ns = Object.create(null);
  const fetched = new Uint8Array(2);
  ns.PC = 0;
  ns.operations = Object.create(null);

  ns.init = () => {
    for (let i = 0; i < registers.V.length; i++) {
      registers.V[i] = 0;
    }
    timer.setDelay(0);
    timer.setSound(0);
    stack.clear();
    chip8.cpu.PC = Number(0x200);
  };

  ns.operations.clearScreen = () => {
    display.clear();
  };

  ns.operations.jump = (address) => {
    chip8.cpu.PC = address;
  };

  ns.operations.setRegVal = (register, value) => {
    registers.V[register] = value;
  };

  ns.operations.setRegReg = (registerX, registerY) => {
    registers.V[registerX] = registers.V[registerY];
  };

  ns.operations.addWithoutCarry = (register, value) => {
    registers.V[register] += value;
  };

  ns.operations.addWithCarry = (registerX, registerY) => {
    const sum = registers.V[registerX] + registers.V[registerY];
    registers.V[registerX] = sum;
    registers.V[0xf] = (sum > 255) & 1;
  };

  ns.operations.subtract = (registerX, registerY, negate = false) => {
    const difference =
      (registers.V[registerX] - registers.V[registerY]) * (negate ? -1 : 1);
    registers.V[registerX] = difference;
    registers.V[0xf] = (difference >= 0) & 1;
  };

  ns.operations.binOR = (registerX, registerY) => {
    registers.V[registerX] |= registers.V[registerY];
  };

  ns.operations.binAND = (registerX, registerY) => {
    registers.V[registerX] &= registers.V[registerY];
  };

  ns.operations.binXOR = (registerX, registerY) => {
    registers.V[registerX] ^= registers.V[registerY];
  };

  ns.operations.setIndex = (value) => {
    registers.I = value;
  };

  ns.operations.draw = (x, y, n) => {
    const idx = registers.I;
    const { SCREEN_WIDTH: w, SCREEN_HEIGHT: h } = display;
    const spriteData = memory.slice(idx, idx + n);
    const root_x = registers.V[x];
    const root_y = registers.V[y];
    display.draw(root_x % w, root_y % h, spriteData);
  };

  ns.operations.callSubroutine = (address) => {
    stack.push(chip8.cpu.PC);
    chip8.cpu.PC = address;
  };

  ns.operations.returnFromSubroutine = () => {
    chip8.cpu.PC = stack.pop();
  };

  ns.operations.skipEqualVal = (register, value) => {
    if (registers.V[register] === value) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.skipNotEqualVal = (register, value) => {
    if (registers.V[register] !== value) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.skipEqualReg = (registerX, registerY) => {
    if (registers.V[registerX] === registers.V[registerY]) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.skipNotEqualReg = (registerX, registerY) => {
    if (registers.V[registerX] !== registers.V[registerY]) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.shiftRight = (registerX, registerY) => {
    if (quirks.useVYinShifts) {
      registers.V[registerX] = registers.V[registerY];
    }
    const shiftedOut = registers.V[registerX] & 1;
    registers.V[registerX] = registers.V[registerX] >> 1;
    registers.V[0xf] = shiftedOut;
  };

  ns.operations.shiftLeft = (registerX, registerY) => {
    if (quirks.useVYinShifts) {
      registers.V[registerX] = registers.V[registerY];
    }
    const shiftedOut = (registers.V[registerX] >> 7) & 1;
    registers.V[registerX] = registers.V[registerX] << 1;
    registers.V[0xf] = shiftedOut;
  };

  ns.operations.jumpWithOffset = (address, register) => {
    // Jumps to NNN + V[0]
    chip8.cpu.PC = address + registers.V[register || 0];
  };

  ns.operations.generateRandomNumber = (register, value) => {
    registers.V[register] = Math.floor(Math.random() * 256) & value;
  };

  ns.operations.readDelayTimer = (register) => {
    registers.V[register] = timer.getDelay();
  };

  ns.operations.writeDelayTimer = (register) => {
    timer.setDelay(registers.V[register]);
  };

  ns.operations.writeSoundTimer = (register) => {
    timer.setSound(registers.V[register]);
  };

  ns.operations.addToIndex = (register) => {
    const nextAddress = registers.I + registers.V[register];
    registers.I = nextAddress;
    // Set the flag register if I overflows beyond addressable memory
    if (nextAddress > 0x0fff) {
      registers.V[0xf] = 1;
    }
  };

  ns.operations.fontCharacter = (register) => {
    const hexCode = registers.V[register] & 0xf;
    registers.I = memoryUtils.fontMap[hexCode];
  };

  ns.operations.bcdConvert = (register) => {
    const num = registers.V[register];
    const digits = [100, 10, 1].map((div) => Math.floor(num / div) % 10);
    for (let offset = 0; offset < 3; offset++) {
      memory[registers.I + offset] = digits[offset];
    }
  };

  ns.operations.storeRegisters = (registerLimit) => {
    for (let offset = 0; offset <= registerLimit; offset++) {
      memory[registers.I + offset] = registers.V[offset];
    }
    if (quirks.incIduringRegRW) {
      registers.I += registerLimit + 1;
    }
  };

  ns.operations.loadRegisters = (registerLimit) => {
    for (let offset = 0; offset <= registerLimit; offset++) {
      registers.V[offset] = memory[registers.I + offset];
    }
    if (quirks.incIduringRegRW) {
      registers.I += registerLimit + 1;
    }
  };

  ns.operations.skipIfKeyPressed = (register) => {
    if (input.isKeyPressed(registers.V[register])) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.skipIfKeyNotPressed = (register) => {
    if (!input.isKeyPressed(registers.V[register])) {
      chip8.cpu.PC += 2;
    }
  };

  ns.operations.getKey = (register) => {
    const key = input.getLastFreshInput();
    if (!key) {
      chip8.cpu.PC -= 2;
      return;
    }
    registers.V[register] = key;
  };

  ns.fetch = () => {
    // Read 2 bytes, and increment the PC by 2
    fetched[0] = memory[chip8.cpu.PC];
    fetched[1] = memory[chip8.cpu.PC + 1];
    global.debug &&
      ui.verboseLog("fetched", `0x${fetched.toHex()}`, "at PC", chip8.cpu.PC);
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
      case "0":
        switch (instruction.slice(1)) {
          case "0e0":
            global.debug && ui.verboseLog("Clearing screen");
            op = () => chip8.cpu.operations.clearScreen();
            break;
          case "0ee":
            global.debug &&
              ui.verboseLog(
                "Returning from subroutine to",
                `0x${stack.top().toString(16)}`
              );
            op = () => chip8.cpu.operations.returnFromSubroutine();
            break;
        }
        break;
      case "1":
        global.debug &&
          ui.verboseLog("Jumping to address", `0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.jump(NNN);
        break;
      case "2":
        global.debug &&
          ui.verboseLog("Jumping to subroutine at", `0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.callSubroutine(NNN);
        break;
      case "3":
        global.debug &&
          ui.verboseLog(
            "Will skip next instruction if register",
            X,
            "equals",
            NN
          );
        op = () => chip8.cpu.operations.skipEqualVal(X, NN);
        break;
      case "4":
        global.debug &&
          ui.verboseLog(
            "Will skip next instruction if register",
            X,
            "not equals",
            NN
          );
        op = () => chip8.cpu.operations.skipNotEqualVal(X, NN);
        break;
      case "5":
        global.debug &&
          ui.verboseLog(
            "Will skip next instruction if register",
            X,
            "equals register",
            Y
          );
        op = () => chip8.cpu.operations.skipEqualReg(X, Y);
        break;
      case "9":
        global.debug &&
          ui.verboseLog(
            "Will skip next instruction if register",
            X,
            "not equals register",
            Y
          );
        op = () => chip8.cpu.operations.skipNotEqualReg(X, Y);
        break;
      case "6":
        global.debug && ui.verboseLog("Setting register", X, "to value", NN);
        op = () => chip8.cpu.operations.setRegVal(X, NN);
        break;
      case "7":
        global.debug &&
          ui.verboseLog("Adding to register", X, "a value of", NN);
        op = () => chip8.cpu.operations.addWithoutCarry(X, NN);
        break;
      case "8":
        switch (N) {
          case 0x0:
            global.debug &&
              ui.verboseLog(
                "Setting value of register",
                X,
                "to value of register",
                Y
              );
            op = () => chip8.cpu.operations.setRegReg(X, Y);
            break;
          case 0x1:
            global.debug &&
              ui.verboseLog("Binary OR between registers", X, "and", Y);
            op = () => chip8.cpu.operations.binOR(X, Y);
            break;
          case 0x2:
            global.debug &&
              ui.verboseLog("Binary AND between registers", X, "and", Y);
            op = () => chip8.cpu.operations.binAND(X, Y);
            break;
          case 0x3:
            global.debug &&
              ui.verboseLog("Binary XOR between registers", X, "and", Y);
            op = () => chip8.cpu.operations.binXOR(X, Y);
            break;
          case 0x4:
            global.debug &&
              ui.verboseLog(
                "Adding values between registers",
                X,
                "and",
                Y,
                "with carry"
              );
            op = () => chip8.cpu.operations.addWithCarry(X, Y);
            break;
          case 0x5:
            global.debug &&
              ui.verboseLog("Subtracting value of register", Y, "from", X);
            op = () => chip8.cpu.operations.subtract(X, Y);
            break;
          case 0x7:
            global.debug &&
              ui.verboseLog("Subtracting value of register", X, "from", Y);
            op = () => chip8.cpu.operations.subtract(X, Y, true);
            break;
          case 0x6:
            global.debug &&
              ui.verboseLog("Shifting right, using registers", X, "and", Y);
            op = () => chip8.cpu.operations.shiftRight(X, Y);
            break;
          case 0xe:
            global.debug &&
              ui.verboseLog("Shifting left, using registers", X, "and", Y);
            op = () => chip8.cpu.operations.shiftLeft(X, Y);
            break;
        }
        break;
      case "a":
        global.debug && ui.verboseLog("Setting I to", `0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.setIndex(NNN);
        break;
      case "b":
        global.debug &&
          ui.verboseLog("Jumping with offset", `0x${NNN.toString(16)}`);
        op = () =>
          chip8.cpu.operations.jumpWithOffset(
            NNN,
            quirks.jumpWithOffsetAlt ? X : 0
          );
        break;
      case "c":
        global.debug &&
          ui.verboseLog("Generating random number, "`0x${NNN.toString(16)}`);
        op = () => chip8.cpu.operations.generateRandomNumber(X, NN);
        break;
      case "d":
        global.debug &&
          ui.verboseLog("Drawing at", X, ",", Y, "- a sprite of", N, "rows");
        op = () => chip8.cpu.operations.draw(X, Y, N);
        break;
      case "e":
        switch (NN) {
          case 0x9e:
            global.debug &&
              ui.verboseLog(
                "Skipped if key in register",
                `0x${X.toString(16)}`,
                "pressed"
              );
            op = () => chip8.cpu.operations.skipIfKeyPressed(X);
            break;
          case 0xa1:
            global.debug &&
              ui.verboseLog(
                "Skipped if key in register",
                `0x${X.toString(16)}`,
                "not pressed"
              );
            op = () => chip8.cpu.operations.skipIfKeyNotPressed(X);
            break;
        }
        break;
      case "f":
        switch (NN) {
          case 0x07:
            global.debug &&
              ui.verboseLog(
                "Read delay timer to register",
                `0x${X.toString(16)}`
              );
            op = () => chip8.cpu.operations.readDelayTimer(X);
            break;
          case 0x15:
            global.debug &&
              ui.verboseLog(
                "Set delay timer from register",
                `0x${X.toString(16)}`
              );
            op = () => chip8.cpu.operations.writeDelayTimer(X);
            break;
          case 0x18:
            global.debug &&
              ui.verboseLog(
                "Set sound timer from register",
                `0x${X.toString(16)}`
              );
            op = () => chip8.cpu.operations.writeSoundTimer(X);
            break;
          case 0x1e:
            global.debug &&
              ui.verboseLog(
                "Adding to index the value from register",
                `0x${X.toString(16)}`
              );
            op = () => chip8.cpu.operations.addToIndex(X);
            break;
          case 0x0a:
            global.debug &&
              ui.verboseLog(
                "Waiting for fresh key input into register",
                `0x${X.toString(16)}`
              );
            op = () => chip8.cpu.operations.getKey(X);
            break;
          case 0x29:
            global.debug &&
              ui.verboseLog(
                "Setting index to font character in register",
                `0x${X.toString(16)}`
              );
            op = () => chip8.cpu.operations.fontCharacter(X);
            break;
          case 0x33:
            global.debug &&
              ui.verboseLog(
                "Storing binary coded decimal value at index from register",
                `0x${X.toString(16)}`
              );
            op = () => chip8.cpu.operations.bcdConvert(X);
            break;
          case 0x55:
            global.debug &&
              ui.verboseLog(
                "Storing in memory values in registers from 0 to",
                `0x${X.toString(16)}`
              );
            op = () => chip8.cpu.operations.storeRegisters(X);
            break;
          case 0x65:
            global.debug &&
              ui.verboseLog(
                "Loading from memory values to registers from 0 to",
                `0x${X.toString(16)}`
              );
            op = () => chip8.cpu.operations.loadRegisters(X);
            break;
        }
        break;
    }
    // Pass on the data/instruction to `execute`
    return op;
  };

  ns.execute = (operation) => {
    if (typeof operation === "function") {
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
};

export { createCPU };
