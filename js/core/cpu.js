import { checkInstanceDependencies } from "../utils/depUtils.js";

let instance;

/**
 *
 * @param {Object} instanceProvider - An object that has the necessary methods to fetch singleton instances
 * @param {Function} instanceProvider.getInstance - Function that loads other modules as dependencies
 *
 * @returns {Object} Singleton instance for the current module
 */
const getCPUInstance = ({ getInstance }) => {
  if (instance) {
    return instance;
  }
  const ns = Object.create(null);
  instance = ns;

  /**
   * Load the instance's internal methods and properties asynchronously
   */
  (async () => {
    const ui = getInstance("ui");
    const timer = getInstance("timer");
    const stack = getInstance("stack");
    const display = getInstance("display");
    const registers = getInstance("registers");
    const quirks = getInstance("quirks");
    const input = getInstance("input");
    const memory = getInstance("memory");
    const global = getInstance("global");
    const memoryUtils = getInstance("memoryUtils");

    checkInstanceDependencies("cpu", {
      ui,
      timer,
      stack,
      display,
      registers,
      quirks,
      input,
      memory,
      global,
      memoryUtils,
    });

    // Contains the currently fetched instruction (pre-decode)
    const fetched = new Uint8Array(2);

    // Program Counter
    ns.PC = 0;

    // Contains functions for every CPU instruction
    ns.operations = Object.create(null);

    /**
     * Initial state of the CPU, at the start of each ROM launch
     */
    ns.init = () => {
      for (let i = 0; i < registers.V.length; i++) {
        registers.V[i] = 0;
      }
      timer.setDelay(0);
      timer.setSound(0);
      stack.clear();
      ns.PC = Number(0x200);
    };

    // Chip8 operation - Clears the display
    ns.operations.clearScreen = () => {
      display.clear();
    };

    // Chip8 operation - Immediate jump (changes PC only)
    ns.operations.jump = (address) => {
      ns.PC = address;
    };

    // Chip8 operation - Set a register value directly
    ns.operations.setRegVal = (register, value) => {
      registers.V[register] = value;
    };

    // Chip8 operation - Set a register's value to the value in another register
    ns.operations.setRegReg = (registerX, registerY) => {
      registers.V[registerX] = registers.V[registerY];
    };

    // Chip8 operation - Adds immediate value to the value inside a register WITHOUT carry
    ns.operations.addWithoutCarry = (register, value) => {
      registers.V[register] += value;
    };

    // Chip8 operation - Adds immediate value to the value inside a register WITH carry
    ns.operations.addWithCarry = (registerX, registerY) => {
      const sum = registers.V[registerX] + registers.V[registerY];
      registers.V[registerX] = sum;
      registers.V[0xf] = (sum > 255) & 1;
    };

    // Chip8 operation - Subtract the value in the first register from the value in the second register, reverse if `negate` is set
    ns.operations.subtract = (registerX, registerY, negate = false) => {
      const difference =
        (registers.V[registerX] - registers.V[registerY]) * (negate ? -1 : 1);
      registers.V[registerX] = difference;
      registers.V[0xf] = (difference >= 0) & 1;
    };

    // Chip8 operation - Binary OR between the values in two registers
    ns.operations.binOR = (registerX, registerY) => {
      registers.V[registerX] |= registers.V[registerY];
    };

    // Chip8 operation - Binary AND between the values in two registers
    ns.operations.binAND = (registerX, registerY) => {
      registers.V[registerX] &= registers.V[registerY];
    };

    // Chip8 operation - Binary XOR between the values in two registers
    ns.operations.binXOR = (registerX, registerY) => {
      registers.V[registerX] ^= registers.V[registerY];
    };

    // Chip8 operation - Set index register (I) to a value
    ns.operations.setIndex = (value) => {
      registers.I = value;
    };

    // Chip8 operation - Draw a sprite on the screen at position (`x`, `y`), consisting of `n` rows of pixels
    ns.operations.draw = (x, y, n) => {
      const idx = registers.I;
      const { SCREEN_WIDTH: w, SCREEN_HEIGHT: h } = display;
      const spriteData = memory.slice(idx, idx + n);
      const root_x = registers.V[x];
      const root_y = registers.V[y];
      display.draw(root_x % w, root_y % h, spriteData);
    };

    // Chip8 operation - Pushes the current PC to stack and sets the PC to the new address
    ns.operations.callSubroutine = (address) => {
      stack.push(ns.PC);
      ns.PC = address;
    };

    // Chip8 operation - Pops the last item from the stack and assigns it to PC
    ns.operations.returnFromSubroutine = () => {
      ns.PC = stack.pop();
    };

    // Chip8 operation - Skip next instruction if value inside register contains given value
    ns.operations.skipEqualVal = (register, value) => {
      if (registers.V[register] === value) {
        ns.PC += 2;
      }
    };

    // Chip8 operation - Skip next instruction if value inside register DOES NOT contain given value
    ns.operations.skipNotEqualVal = (register, value) => {
      if (registers.V[register] !== value) {
        ns.PC += 2;
      }
    };

    // Chip8 operation - Skip next instruction if both registers have the equal value
    ns.operations.skipEqualReg = (registerX, registerY) => {
      if (registers.V[registerX] === registers.V[registerY]) {
        ns.PC += 2;
      }
    };

    // Chip8 operation - Skip next instruction if both registers DO NOT have the equal value
    ns.operations.skipNotEqualReg = (registerX, registerY) => {
      if (registers.V[registerX] !== registers.V[registerY]) {
        ns.PC += 2;
      }
    };

    // [Quirk is involved with this operation - see `useVYinShifts`]
    // Chip8 operation - Shifts value in the first register by "n" bits to the right where the second register has the value "n"
    ns.operations.shiftRight = (registerX, registerY) => {
      if (quirks.useVYinShifts) {
        registers.V[registerX] = registers.V[registerY];
      }
      const shiftedOut = registers.V[registerX] & 1;
      registers.V[registerX] = registers.V[registerX] >> 1;
      registers.V[0xf] = shiftedOut;
    };

    // [Quirk is involved with this operation - see `useVYinShifts`]
    // Chip8 operation - Shifts value in the first register by "n" bits to the left where the second register has the value "n"
    ns.operations.shiftLeft = (registerX, registerY) => {
      if (quirks.useVYinShifts) {
        registers.V[registerX] = registers.V[registerY];
      }
      const shiftedOut = (registers.V[registerX] >> 7) & 1;
      registers.V[registerX] = registers.V[registerX] << 1;
      registers.V[0xf] = shiftedOut;
    };

    // Chip8 operation - Jumps to the computed location, i.e. `address` + the value inside the register
    ns.operations.jumpWithOffset = (address, register) => {
      // Jumps to NNN + V[0]
      ns.PC = address + registers.V[register || 0];
    };

    // Chip8 operation - Generates a random 8 bit number, which undergoes a bitwise AND with the given value
    ns.operations.generateRandomNumber = (register, value) => {
      registers.V[register] = Math.floor(Math.random() * 256) & value;
    };

    // Chip8 operation - Read the delay timer
    ns.operations.readDelayTimer = (register) => {
      registers.V[register] = timer.getDelay();
    };

    // Chip8 operation - Writes to the delay timer
    ns.operations.writeDelayTimer = (register) => {
      timer.setDelay(registers.V[register]);
    };

    // Chip8 operation - Writes to the sound timer
    ns.operations.writeSoundTimer = (register) => {
      timer.setSound(registers.V[register]);
    };

    // Chip8 operation - Adds register value to the index register (I)
    ns.operations.addToIndex = (register) => {
      const nextAddress = registers.I + registers.V[register];
      registers.I = nextAddress;
      // Set the flag register if I overflows beyond addressable memory
      if (nextAddress > 0x0fff) {
        registers.V[0xf] = 1;
      }
    };

    // Chip8 operation - Points the index register (I) to the location in memory where the font sprite for the character (in the register value's hex notation) is stored
    ns.operations.fontCharacter = (register) => {
      const hexCode = registers.V[register] & 0xf;
      registers.I = memoryUtils.fontMap[hexCode];
    };

    // Chip8 operation - Converts the value in the register to BCD (Binary coded decimal)
    ns.operations.bcdConvert = (register) => {
      const num = registers.V[register];
      const digits = [100, 10, 1].map((div) => Math.floor(num / div) % 10);
      for (let offset = 0; offset < 3; offset++) {
        memory[registers.I + offset] = digits[offset];
      }
    };

    // [Quirk is involved with this operation - see `incIduringRegRW`]
    // Chip8 operation - Stores all the current register values in the address which the index register (I) points to
    ns.operations.storeRegisters = (registerLimit) => {
      for (let offset = 0; offset <= registerLimit; offset++) {
        memory[registers.I + offset] = registers.V[offset];
      }
      if (quirks.incIduringRegRW) {
        registers.I += registerLimit + 1;
      }
    };

    // [Quirk is involved with this operation - see `incIduringRegRW`]
    // Chip8 operation - Restores all the current register values from the address which the index register (I) points to
    ns.operations.loadRegisters = (registerLimit) => {
      for (let offset = 0; offset <= registerLimit; offset++) {
        registers.V[offset] = memory[registers.I + offset];
      }
      if (quirks.incIduringRegRW) {
        registers.I += registerLimit + 1;
      }
    };

    // Chip8 operation - Skip next instruction if key mentioned in the register value is pressed
    ns.operations.skipIfKeyPressed = (register) => {
      if (input.isKeyPressed(registers.V[register])) {
        ns.PC += 2;
      }
    };

    // Chip8 operation - Skip next instruction if key mentioned in the register value is NOT pressed
    ns.operations.skipIfKeyNotPressed = (register) => {
      if (!input.isKeyPressed(registers.V[register])) {
        ns.PC += 2;
      }
    };

    // Chip8 operation - Gets the last "fresh" key input and writes its keycode into the specified register
    ns.operations.getKey = (register) => {
      const key = input.getLastFreshInput();
      if (key === false) {
        ns.PC -= 2;
        return;
      }
      registers.V[register] = key;
    };

    // CPU - FETCH
    ns.fetch = () => {
      // Read 2 bytes, and increment the PC by 2
      fetched[0] = memory[ns.PC];
      fetched[1] = memory[ns.PC + 1];
      global.debug &&
        ui.verboseLog("fetched", `0x${fetched.toHex()}`, "at PC", ns.PC);
      ns.PC += 2;

      return fetched.toHex();
    };

    // CPU - DECODE
    ns.decode = (instruction) => {
      const X = Number(`0x${instruction[1]}`);
      const Y = Number(`0x${instruction[2]}`);
      const N = Number(`0x${instruction[3]}`);
      const NN = Number(`0x${instruction.slice(2)}`);
      const NNN = Number(`0x${instruction.slice(1)}`);

      // Fallback operation if opcode does not match any implemented operation
      const defaultOp = () => {
        console.error("Unimplemented instruction - ", instruction);
      };
      let op = defaultOp;
      switch (instruction[0]) {
        case "0":
          switch (instruction.slice(1)) {
            case "0e0":
              global.debug && ui.verboseLog("Clearing screen");
              op = () => ns.operations.clearScreen();
              break;
            case "0ee":
              global.debug &&
                ui.verboseLog(
                  "Returning from subroutine to",
                  `0x${stack.top().toString(16)}`
                );
              op = () => ns.operations.returnFromSubroutine();
              break;
          }
          break;
        case "1":
          global.debug &&
            ui.verboseLog("Jumping to address", `0x${NNN.toString(16)}`);
          op = () => ns.operations.jump(NNN);
          break;
        case "2":
          global.debug &&
            ui.verboseLog("Jumping to subroutine at", `0x${NNN.toString(16)}`);
          op = () => ns.operations.callSubroutine(NNN);
          break;
        case "3":
          global.debug &&
            ui.verboseLog(
              "Will skip next instruction if register",
              X,
              "equals",
              NN
            );
          op = () => ns.operations.skipEqualVal(X, NN);
          break;
        case "4":
          global.debug &&
            ui.verboseLog(
              "Will skip next instruction if register",
              X,
              "not equals",
              NN
            );
          op = () => ns.operations.skipNotEqualVal(X, NN);
          break;
        case "5":
          global.debug &&
            ui.verboseLog(
              "Will skip next instruction if register",
              X,
              "equals register",
              Y
            );
          op = () => ns.operations.skipEqualReg(X, Y);
          break;
        case "9":
          global.debug &&
            ui.verboseLog(
              "Will skip next instruction if register",
              X,
              "not equals register",
              Y
            );
          op = () => ns.operations.skipNotEqualReg(X, Y);
          break;
        case "6":
          global.debug && ui.verboseLog("Setting register", X, "to value", NN);
          op = () => ns.operations.setRegVal(X, NN);
          break;
        case "7":
          global.debug &&
            ui.verboseLog("Adding to register", X, "a value of", NN);
          op = () => ns.operations.addWithoutCarry(X, NN);
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
              op = () => ns.operations.setRegReg(X, Y);
              break;
            case 0x1:
              global.debug &&
                ui.verboseLog("Binary OR between registers", X, "and", Y);
              op = () => ns.operations.binOR(X, Y);
              break;
            case 0x2:
              global.debug &&
                ui.verboseLog("Binary AND between registers", X, "and", Y);
              op = () => ns.operations.binAND(X, Y);
              break;
            case 0x3:
              global.debug &&
                ui.verboseLog("Binary XOR between registers", X, "and", Y);
              op = () => ns.operations.binXOR(X, Y);
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
              op = () => ns.operations.addWithCarry(X, Y);
              break;
            case 0x5:
              global.debug &&
                ui.verboseLog("Subtracting value of register", Y, "from", X);
              op = () => ns.operations.subtract(X, Y);
              break;
            case 0x7:
              global.debug &&
                ui.verboseLog("Subtracting value of register", X, "from", Y);
              op = () => ns.operations.subtract(X, Y, true);
              break;
            case 0x6:
              global.debug &&
                ui.verboseLog("Shifting right, using registers", X, "and", Y);
              op = () => ns.operations.shiftRight(X, Y);
              break;
            case 0xe:
              global.debug &&
                ui.verboseLog("Shifting left, using registers", X, "and", Y);
              op = () => ns.operations.shiftLeft(X, Y);
              break;
          }
          break;
        case "a":
          global.debug &&
            ui.verboseLog("Setting I to", `0x${NNN.toString(16)}`);
          op = () => ns.operations.setIndex(NNN);
          break;
        case "b":
          global.debug &&
            ui.verboseLog("Jumping with offset", `0x${NNN.toString(16)}`);
          op = () =>
            ns.operations.jumpWithOffset(NNN, quirks.jumpWithOffsetAlt ? X : 0);
          break;
        case "c":
          global.debug &&
            ui.verboseLog("Generating random number, "`0x${NNN.toString(16)}`);
          op = () => ns.operations.generateRandomNumber(X, NN);
          break;
        case "d":
          global.debug &&
            ui.verboseLog("Drawing at", X, ",", Y, "- a sprite of", N, "rows");
          op = () => ns.operations.draw(X, Y, N);
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
              op = () => ns.operations.skipIfKeyPressed(X);
              break;
            case 0xa1:
              global.debug &&
                ui.verboseLog(
                  "Skipped if key in register",
                  `0x${X.toString(16)}`,
                  "not pressed"
                );
              op = () => ns.operations.skipIfKeyNotPressed(X);
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
              op = () => ns.operations.readDelayTimer(X);
              break;
            case 0x15:
              global.debug &&
                ui.verboseLog(
                  "Set delay timer from register",
                  `0x${X.toString(16)}`
                );
              op = () => ns.operations.writeDelayTimer(X);
              break;
            case 0x18:
              global.debug &&
                ui.verboseLog(
                  "Set sound timer from register",
                  `0x${X.toString(16)}`
                );
              op = () => ns.operations.writeSoundTimer(X);
              break;
            case 0x1e:
              global.debug &&
                ui.verboseLog(
                  "Adding to index the value from register",
                  `0x${X.toString(16)}`
                );
              op = () => ns.operations.addToIndex(X);
              break;
            case 0x0a:
              global.debug &&
                ui.verboseLog(
                  "Waiting for fresh key input into register",
                  `0x${X.toString(16)}`
                );
              op = () => ns.operations.getKey(X);
              break;
            case 0x29:
              global.debug &&
                ui.verboseLog(
                  "Setting index to font character in register",
                  `0x${X.toString(16)}`
                );
              op = () => ns.operations.fontCharacter(X);
              break;
            case 0x33:
              global.debug &&
                ui.verboseLog(
                  "Storing binary coded decimal value at index from register",
                  `0x${X.toString(16)}`
                );
              op = () => ns.operations.bcdConvert(X);
              break;
            case 0x55:
              global.debug &&
                ui.verboseLog(
                  "Storing in memory values in registers from 0 to",
                  `0x${X.toString(16)}`
                );
              op = () => ns.operations.storeRegisters(X);
              break;
            case 0x65:
              global.debug &&
                ui.verboseLog(
                  "Loading from memory values to registers from 0 to",
                  `0x${X.toString(16)}`
                );
              op = () => ns.operations.loadRegisters(X);
              break;
          }
          break;
      }
      // Pass on the data/instruction to `execute`
      return op;
    };

    // CPU - EXECUTE
    ns.execute = (operation) => {
      if (typeof operation === "function") {
        operation();
      }
    };

    // A single [Fetch->Decode->Execute] cycle is performed on each `tick`
    ns.tick = () => {
      const fetchedInstruction = ns.fetch();
      const decodedOperation = ns.decode(fetchedInstruction);
      ns.execute(decodedOperation);
    };

    // Corresponds to how many instructions the debugger will step through in the step-debugger
    ns.stepCount = 0;
  })();

  return ns;
};

export { getCPUInstance };
