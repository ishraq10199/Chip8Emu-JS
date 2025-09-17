import { checkInstanceDependencies } from "../utils/depUtils.js";

let instance;

const getUIInstance = ({ getInstance }) => {
  if (instance) {
    return instance;
  }

  const ns = Object.create(null);
  instance = ns;

  (async () => {
    const memory = getInstance("memory");
    const cpu = getInstance("cpu");
    const registers = getInstance("registers");
    const input = getInstance("input");
    const timer = getInstance("timer");
    const global = getInstance("global");

    checkInstanceDependencies("ui", {
      memory,
      cpu,
      registers,
      input,
      timer,
      global,
    });

    const codeContainer = document.querySelector("#chip8code .content");
    let selectedCodeLine = null;
    const codeLineIndices = [];
    const codeLineEls = Object.create(null);

    const stepperContainer = document.querySelector(".chip8-misc .steppers");
    const pauseButton = document.querySelector(".chip8-romcontrols #pause");
    const singleStepper = stepperContainer.querySelector("#stepOne button");
    const multipleStepper = stepperContainer.querySelector("#stepMany button");

    const stepCountInput = stepperContainer.querySelector("#stepMany input");
    let stepCountInputValue = +stepCountInput.value;

    const verboseInstructionContainer = document.querySelector(
      ".chip8-misc .verbose-instruction"
    );

    let registersRendered = false;
    const registerContainer = document.querySelector(".chip8-registers");
    const registerEls = [];

    let inputRendered = false;
    const inputContainer = document.querySelector(".chip8-input");
    const inputEls = [];

    const stackContainer = document.querySelector(".chip8-stack .content");
    const stackEls = [];

    const tacContainer = document.querySelector(".chip8-timers-and-counters");
    let tacRendered = false;
    const tacEls = Object.create(null);

    const memoryContainer = document.querySelector(".chip8-memory .content");

    const debugMessagesCheckbox = document.querySelector(
      ".chip8-misc .misc-flags #debugMessages"
    );

    const createMemoryLineItem = (num, bytes) => {
      const memoryLineItem = document.createElement("div");
      memoryLineItem.classList.add("memory-item");
      const lineNumber = document.createElement("div");
      lineNumber.innerHTML = `[${num.toString(16).padStart(4, "0")}]`;
      lineNumber.classList.add("line-number");
      memoryLineItem.append(lineNumber);
      const contents = document.createElement("div");
      contents.classList.add("contents");
      contents.innerHTML = bytes
        .toHex()
        .match(/.{1,2}/g)
        .join(" ");
      memoryLineItem.append(contents);
      return memoryLineItem;
    };

    const createTACItem = (id) => {
      const tacItem = document.createElement("div");
      tacItem.classList.add("tac-item");
      tacItem.id = id;
      const tacLabel = document.createElement("div");
      tacLabel.classList.add("label");
      tacLabel.innerHTML = id.toUpperCase();
      tacItem.append(tacLabel);
      const tacValue = document.createElement("div");
      tacValue.classList.add("value");
      tacValue.innerHTML = 0;
      tacItem.append(tacValue);
      return tacItem;
    };

    const createRegisterItem = (id) => {
      const regItem = document.createElement("div");
      const hexId = id.toString(16).toUpperCase();
      const regLabel = document.createElement("div");
      regLabel.innerHTML = `V${hexId}`;
      const regValue = document.createElement("div");
      regLabel.classList.add("label");
      regValue.classList.add("value");
      regItem.classList.add("register-item");
      regItem.id = `register-v${hexId}`;
      regItem.append(regLabel);
      regItem.append(regValue);
      return regItem;
    };

    const createInputItem = (id) => {
      const inputItem = document.createElement("div");
      const hexId = id.toString(16).toUpperCase();
      inputItem.classList.add("input-item");
      inputItem.id = `input-${hexId}`;
      inputItem.innerHTML = hexId;
      return inputItem;
    };

    const createCodeLineItem = (content, id) => {
      const item = document.createElement("div");
      item.classList.add("code-item");
      item.innerHTML = content;
      item.id = `item-${id}`;
      return item;
    };

    const selectCodeLineItem = (id, skipScroll = false) => {
      selectedCodeLine =
        selectedCodeLine || codeContainer.querySelector(".selected");
      if (selectedCodeLine) {
        selectedCodeLine.classList.remove("selected");
      }
      // const selectedItem = codeContainer.querySelector(`#item-${id}`);
      const selectedItem = codeLineEls[id];
      selectedCodeLine = selectedItem;
      if (selectedItem) {
        if (!skipScroll) {
          selectedItem.scrollIntoView();
        }
        selectedItem.classList.add("selected");
      }
    };

    ns.resetCodeLines = () => {
      codeContainer
        .querySelectorAll(".code-item")
        .forEach((item) => item.remove());
      codeLineIndices.map((i) => {
        delete codeLineEls[i];
      });
      codeLineIndices.length = 0;
    };

    ns.renderCodeLines = () => {
      for (let i = 0; i < 4096; i += 1) {
        const opcode = memory.slice(i, i + 2).toHex();
        const codeLineItem = createCodeLineItem(
          `[${String(i).padStart(4, 0)}] ${opcode}`,
          i
        );
        codeContainer.append(codeLineItem);
        codeLineEls[i] = codeLineItem;
        codeLineIndices.push(i);
      }
    };

    ns.selectCurrentCodeLine = () => {
      // selectCodeLineItem(cpu.PC & 1 ? cpu.PC - 1 : cpu.PC);
      selectCodeLineItem(cpu.PC);
    };

    ns.renderRegisters = () => {
      if (!registersRendered) {
        for (let i = 0; i < 16; i++) {
          const regItem = createRegisterItem(i);
          registerContainer.append(regItem);
          registerEls.push(regItem.querySelector(".value"));
        }
        registersRendered = true;
      }
      for (let i = 0; i < 16; i++) {
        registerEls[i].innerHTML = registers.V[i].toString(16).padStart(4, "0");
      }
    };

    ns.renderInput = () => {
      if (!inputRendered) {
        for (let i = 0; i < 16; i++) {
          const inputItem = createInputItem(input.keyList[i]);
          inputContainer.append(inputItem);
          inputEls.push(inputItem);
        }
        inputRendered = true;
      }
      for (let i = 0; i < 16; i++) {
        const key = input.keyList[i];
        if (input.isKeyPressed(key)) {
          inputEls[i].classList.add("pressed");
        } else {
          inputEls[i].classList.remove("pressed");
        }
      }
    };

    ns.resetStack = () => {
      stackEls.length = 0;
      stackContainer
        .querySelectorAll(".stack-item")
        .forEach((item) => item.remove());
    };

    ns.pushNewItemToStack = (item) => {
      const stackItem = document.createElement("div");
      stackItem.classList.add("stack-item");
      stackItem.innerHTML = item.toString(16).toUpperCase().padStart(4, "0");
      stackContainer.append(stackItem);
      stackEls.push(stackItem);
    };

    ns.removeLastItemFromStack = () => {
      if (stackEls.length) {
        stackEls[stackEls.length - 1].remove();
        stackEls.length--;
      }
    };

    ns.resetMemory = () => {
      memoryContainer
        .querySelectorAll(".memory-item")
        .forEach((item) => item.remove());
    };

    ns.renderMemory = (bytesPerLine = 16) => {
      ns.resetMemory();
      for (let i = 0; i < memory.length; i += bytesPerLine) {
        memoryContainer.append(
          createMemoryLineItem(i, memory.slice(i, i + bytesPerLine))
        );
      }
    };

    ns.reset = () => {
      ns.resetStack();
      ns.resetCodeLines();
    };

    ns.renderTimersAndCounters = () => {
      if (!tacRendered) {
        const tacList = ["pc", "i", "dt", "st"];
        tacList.map((tac) => {
          const tacItem = createTACItem(tac);
          tacEls[tac] = tacItem.querySelector(".value");
          tacContainer.append(tacItem);
        });
        tacRendered = true;
      }
      tacEls["pc"].innerHTML = cpu.PC.toString(16).padStart(4, "0");
      tacEls["dt"].innerHTML = timer.getDelay().toString(16).padStart(4, "0");
      tacEls["st"].innerHTML = timer.getSound().toString(16).padStart(4, "0");
      tacEls["i"].innerHTML = registers.I.toString(16).padStart(4, "0");
    };

    ns.init = () => {
      ns.renderRegisters();
      ns.renderInput();
      ns.renderTimersAndCounters();
      ns.addEventHandlers();
    };

    ns.render = () => {
      ns.renderRegisters();
      ns.renderTimersAndCounters();
      ns.renderInput();
    };

    ns.addEventHandlers = () => {
      debugMessagesCheckbox.addEventListener("change", (e) => {
        global.debug = e.target.checked;
        if (e.target.checked) {
          verboseInstructionContainer.classList.remove("hidden");
          localStorage.setItem("debug", true);
        } else {
          verboseInstructionContainer.classList.add("hidden");
          localStorage.removeItem("debug");
        }
      });
      singleStepper.addEventListener("click", () => {
        if (!global.paused) {
          pauseButton.click();
        }
        cpu.stepCount = 1;
      });
      multipleStepper.addEventListener("click", () => {
        if (!global.paused) {
          pauseButton.click();
        }
        cpu.stepCount = stepCountInputValue | 0;
      });
      stepCountInput.addEventListener("change", (e) => {
        stepCountInputValue = +e.target.value;
      });
    };

    ns.verboseLog = (...content) => {
      verboseInstructionContainer.innerHTML = content.join(" ");
    };
  })();

  return ns;
};

export { getUIInstance };
