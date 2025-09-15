const createSound = ({ timer, global }) => {
  for (const [k, v] of Object.entries({
    timer,
    global,
  })) {
    if (!v) {
      throw new Error(`[error] ${k} not provided during Sound instancing`);
    }
  }
  const ns = Object.create(null);

  document.addEventListener("DOMContentLoaded", () => {
    const startSound = () => {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      let oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = 0;

      let paused = true;
      oscillator.start();

      const setSoundState = (playing = false) => {
        if (!paused && playing) {
          return;
        }
        paused = !playing;
        gainNode.gain.setTargetAtTime(
          playing ? 1 : 0,
          audioContext.currentTime,
          0.001
        );
      };

      ns.play = () => {
        setSoundState(timer.getSound());
      };
    };

    let startedSound = false;
    const initSoundFn = () => {
      if (startedSound) {
        return;
      }
      global.debug && console.log("Sound enabled");
      startSound();
      startedSound = true;
    };

    window.addEventListener("keypress", initSoundFn);
  });

  ns.play = () => {};

  return ns;
};

export { createSound };
