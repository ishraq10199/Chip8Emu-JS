// TODO: Integrate all components here

// TODO: Initialize some stuff after DOM load

const registerDOMEvents = ({ ui, rom }) => {
  for (const [k, v] of Object.entries({
    ui,
    rom,
  })) {
    if (!v) {
      throw new Error(
        `[error] ${k} not provided during Registering DOM events`
      );
    }
  }
  document.addEventListener("DOMContentLoaded", ui.init, { once: true });
  document.addEventListener("DOMContentLoaded", rom.init, {
    once: true,
  });
};

export { registerDOMEvents };
