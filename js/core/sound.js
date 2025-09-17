import { checkInstanceDependencies } from "../utils/depUtils.js";

let instance;

const getSoundInstance = ({ getInstance }) => {
  if (instance) {
    return instance;
  }

  const ns = Object.create(null);
  instance = ns;

  (async () => {
    const timer = getInstance("timer");
    const global = getInstance("global");

    checkInstanceDependencies("sound", {
      timer,
      global,
    });

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
  })();

  return ns;
};

export { getSoundInstance };
