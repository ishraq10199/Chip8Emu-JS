chip8.sound = Object.create(null);

chip8.sound.play = () => {};

document.addEventListener('DOMContentLoaded', () => {
    const startSound = () => {

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'square';
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
            gainNode.gain.setTargetAtTime(playing ? 1 : 0, audioContext.currentTime, 0.001);
        };

        chip8.sound.play = () => {
            setSoundState(chip8.timer.getSound());
        }
    }

    let startedSound = false;
    const initSoundFn = () => {
        if (startedSound) {
            return;
        }
        startSound();
        startedSound = true;
    };

    window.addEventListener('keypress', initSoundFn);
});
