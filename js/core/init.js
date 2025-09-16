import { checkInstanceDependencies } from "../utils/depUtils.js";

const registerDOMEvents = ({ getInstance }) => {
  const ui = getInstance("ui");
  const rom = getInstance("rom");

  checkInstanceDependencies("registerDOMEvents", {
    ui,
    rom,
  });

  document.addEventListener("DOMContentLoaded", ui.init, { once: true });
  document.addEventListener("DOMContentLoaded", rom.init, {
    once: true,
  });
};

export { registerDOMEvents };
