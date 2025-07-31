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
      console.log('------------------READING ROM------------------');
      chip8.romdata.raw = e.target.result;
      chip8.romdata.bytes = new Uint8Array(chip8.romdata.raw);
      chip8.hexDump(chip8.romdata.bytes, true);
      console.log('--------------------END ROM--------------------');
      chip8.run();
    };

    reader.onerror = (e) => {
      console.log('------------------ROM READING ERROR------------------');
      console.log(e.type);
      console.log('----------------------END ERROR----------------------');
    };

    reader.readAsArrayBuffer(file);
  });

  pauseButton.addEventListener('click', () => {
    chip8.paused = !chip8.paused;
    pauseButton.innerHTML = chip8.paused ? 'Resume' : 'Pause';  
  });
};

chip8.loadRom = () => {
    if (!chip8.romdata.bytes || !chip8.romdata.bytes.length) {
        console.log('Could not load ROM - have you uploaded + read one?');
        return;
    }
    if (chip8.romdata.bytes.length >= 3986) {
        console.log('The uploaded ROM is an invalid chip8 ROM');
        return;
    }
    const rom = chip8.romdata.bytes;
    for (let i = 0, memIndex = 0x200; i < rom.length; i++, memIndex++) {
        chip8.memory[memIndex] = rom[i];
    }
};

chip8.initRomReader();