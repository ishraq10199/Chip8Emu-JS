import { createCPU } from "./modules/cpu.js";
import { createDisplay } from "./modules/display.js";
import { createGlobal } from "./modules/global.js";

import { registerDOMEvents } from "./modules/init.js";
import { createInput } from "./modules/input.js";
import { createMemory } from "./modules/memory.js";
import { createMemoryUtils } from "./modules/memoryUtils.js";
import { createRegisters } from "./modules/registers.js";
import { createROM } from "./modules/rom.js";
import { createSound } from "./modules/sound.js";
import { createStack } from "./modules/stack.js";
import { createTimer } from "./modules/timer.js";
import { createUI } from "./modules/ui.js";
import { createUtils } from "./modules/utils.js";

const global = createGlobal();
const input = createInput();
const timer = createTimer();
const memory = createMemory();
const registers = createRegisters();

const memoryUtils = createMemoryUtils({ memory });
const display = createDisplay({ registers });
const sound = createSound({ global, timer });
const utils = createUtils();

// TODO: Fix cyclic dependency
const cpu = createCPU();
const ui = createUI({});
const stack = createStack();

const rom = createROM();

window.chip8 = Object.create(null);
registerDOMEvents();
