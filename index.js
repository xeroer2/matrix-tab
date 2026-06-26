const rainCanvas = document.getElementById("rainLayer");
const nameCanvas = document.getElementById("nameLayer");

const rainCtx = rainCanvas.getContext("2d");
const nameCtx = nameCanvas.getContext("2d");

let width;
let height;
let columns;
let drops;

const fontSize = 18;
const rainChars = "アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#%&*+<>".split("");

let lastTime = 0;
let rainAccumulator = 0;

// Bigger = slower. This controls BOTH normal rain and the JOSH letters.
const rainFrameMs = 88;

const nameText = "JOSH";
let name;

const ticksBetweenLetters = 7;
const holdTicks = 38;
const releaseStaggerTicks = 5;
const resetDelayTicks = 48;

let globalTick = 0;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;

  rainCanvas.width = width;
  rainCanvas.height = height;
  nameCanvas.width = width;
  nameCanvas.height = height;

  columns = Math.floor(width / fontSize);
  drops = [];

  for (let i = 0; i < columns; i++) {
    drops[i] = Math.floor(Math.random() * -height / fontSize);
  }

  rainCtx.fillStyle = "black";
  rainCtx.fillRect(0, 0, width, height);

  resetName();
}

window.addEventListener("resize", resize);

function randomRainChar() {
  return rainChars[Math.floor(Math.random() * rainChars.length)];
}

function resetName() {
  const centerRow = Math.floor((height * 0.48) / fontSize);
  const startCol = Math.floor(columns / 2 - (nameText.length - 1) / 2);

  name = {
    phase: "falling",
    currentLetter: 0,
    waitTicks: 0,
    holdTicks: 0,
    releaseTicks: 0,
    resetTicks: 0,
    centerRow,
    startCol,
    letters: nameText.split("").map((finalChar, i) => ({
      finalChar,
      displayChar: randomRainChar(),
      col: startCol + i,
      row: -8 - i * 3,
      targetRow: centerRow,
      locked: false,
      released: false
    }))
  };
}

resize();

function drawRainTick() {
  rainCtx.fillStyle = "rgba(0, 0, 0, 0.12)";
  rainCtx.fillRect(0, 0, width, height);

  rainCtx.font = `${fontSize}px monospace`;
  rainCtx.textAlign = "left";
  rainCtx.textBaseline = "alphabetic";

  for (let i = 0; i < drops.length; i++) {
    const text = randomRainChar();
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    if (Math.random() > 0.982) {
      rainCtx.fillStyle = "rgba(170, 255, 170, 0.72)";
    } else {
      rainCtx.fillStyle = "rgba(0, 210, 60, 0.58)";
    }

    rainCtx.fillText(text, x, y);

    if (y > height && Math.random() > 0.982) {
      drops[i] = Math.floor(Math.random() * -20);
    }

    drops[i]++;
  }
}

function updateNameTick() {
  if (name.phase === "falling") {
    const letter = name.letters[name.currentLetter];

    if (letter) {
      if (letter.row < letter.targetRow) {
        letter.row++;
        letter.displayChar = randomRainChar();
      } else {
        letter.row = letter.targetRow;
        letter.locked = true;
        letter.displayChar = letter.finalChar;
        name.waitTicks++;

        if (name.waitTicks >= ticksBetweenLetters) {
          name.currentLetter++;
          name.waitTicks = 0;

          if (name.currentLetter >= name.letters.length) {
            name.phase = "holding";
            name.holdTicks = 0;
          }
        }
      }
    }
  } else if (name.phase === "holding") {
    name.holdTicks++;

    for (const letter of name.letters) {
      letter.displayChar = letter.finalChar;
    }

    if (name.holdTicks >= holdTicks) {
      name.phase = "releasing";
      name.releaseTicks = 0;
    }
  } else if (name.phase === "releasing") {
    name.releaseTicks++;

    let allGone = true;

    for (let i = 0; i < name.letters.length; i++) {
      const letter = name.letters[i];

      if (name.releaseTicks > i * releaseStaggerTicks) {
        letter.released = true;
        letter.row++;
        letter.displayChar = randomRainChar();
      }

      if (letter.row * fontSize < height + 40) {
        allGone = false;
      }
    }

    if (allGone) {
      name.phase = "resetting";
      name.resetTicks = 0;
    }
  } else if (name.phase === "resetting") {
    name.resetTicks++;

    if (name.resetTicks >= resetDelayTicks) {
      resetName();
    }
  }
}

function drawName() {
  // This is the important fix:
  // JOSH is on its own transparent layer, so stationary letters do not build up a glow/smudge.
  nameCtx.clearRect(0, 0, width, height);

  nameCtx.save();
  nameCtx.font = `bold ${fontSize}px monospace`;
  nameCtx.textAlign = "left";
  nameCtx.textBaseline = "alphabetic";

  for (let i = 0; i < name.letters.length; i++) {
    const letter = name.letters[i];

    if (i > name.currentLetter && name.phase === "falling") continue;

    const x = letter.col * fontSize;
    const y = letter.row * fontSize;

    if (y < -fontSize || y > height + fontSize) continue;

    const isLocked = letter.locked && name.phase !== "releasing";
    const flicker = Math.random() > 0.9;

    nameCtx.shadowBlur = isLocked ? 3 : 4;
    nameCtx.shadowColor = "rgba(0, 255, 80, 0.28)";

    if (isLocked) {
      nameCtx.fillStyle = flicker
        ? "rgba(145, 255, 145, 0.48)"
        : "rgba(45, 230, 80, 0.60)";
    } else {
      nameCtx.fillStyle = flicker
        ? "rgba(150, 255, 150, 0.48)"
        : "rgba(0, 210, 60, 0.56)";
    }

    nameCtx.fillText(letter.displayChar, x, y);
  }

  nameCtx.restore();
}

function tick() {
  globalTick++;
  drawRainTick();
  updateNameTick();
  drawName();
}

function animate(now) {
  const delta = now - lastTime;
  lastTime = now;
  rainAccumulator += delta;

  while (rainAccumulator >= rainFrameMs) {
    tick();
    rainAccumulator -= rainFrameMs;
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
