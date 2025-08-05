const { chip8 } = window;

chip8.romdata = Object.create(null);

chip8.initRomReader = () => {
  const input = document.querySelector("input#romupload");
  const readButton = document.querySelector("button#readrom");
  const pauseButton = document.querySelector("button#pause");

  window.readButton = readButton;

  readButton.addEventListener('click', () => {
    if (input.value === '') {
      console.log('No file uploaded');
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      chip8.debug && console.log('------------------READING ROM------------------');
      chip8.romdata.raw = e.target.result;
      chip8.romdata.bytes = new Uint8Array(chip8.romdata.raw);
      chip8.debug && chip8.utils.hexDump(chip8.romdata.bytes, true);
      chip8.debug && console.log('--------------------END ROM--------------------');
      chip8.utils.run();
    };
    
    reader.onerror = (e) => {
      console.log('------------------ROM READING ERROR------------------');
      console.error(e.type);
      console.log('----------------------END ERROR----------------------');
    };
    
    reader.readAsArrayBuffer(file);
    chip8.ui.renderMemory(16);
  });
  
  pauseButton.addEventListener('click', () => {
    chip8.paused = !chip8.paused;
    chip8.cpu.stepCount = 0;
    pauseButton.innerHTML = chip8.paused ? 'Resume' : 'Pause';  
  });
};

chip8.loadRom = () => {
  if (!chip8.romdata.bytes || !chip8.romdata.bytes.length) {
    console.info('Could not load ROM - have you uploaded + read one?');
    return;
  }
  if (chip8.romdata.bytes.length >= 3986) {
    console.error('The uploaded ROM is an invalid chip8 ROM');
    return;
  }
  const rom = chip8.romdata.bytes;
  for (let i = 0, memIndex = 0x200; i < rom.length; i++, memIndex++) {
    chip8.memory[memIndex] = rom[i];
  }
};

document.addEventListener('DOMContentLoaded', chip8.initRomReader, {once: true});