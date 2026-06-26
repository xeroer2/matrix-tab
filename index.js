const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

let width;
let height;
let columns;
let drops;

const fontSize = 18;
const rainChars = "アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#%&*+<>".split("");

let lastTime = 0;
let rainAccumulator = 0;

// Bigger = slower. This controls BOTH normal rain and the JOSH letters.
// v4 was 105. This is slightly faster while staying synced.
const rainFrameMs = 88;

const nameText = "JOSH";
let name;

const ticksBetweenLetters = 7;    // pause before next letter starts
const holdTicks = 38;             // how long completed JOSH stays in middle
const releaseStaggerTicks = 5;    // letters start dropping away separately
const resetDelayTicks = 48;

let globalTick = 0;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;

  columns = Math.floor(width / fontSize);
  drops = [];

  for (let i = 0; i < columns; i++) {
    drops[i] = Math.floor(Math.random() * -height / fontSize);
  }

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
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.fillRect(0, 0, width, height);

  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  for (let i = 0; i < drops.length; i++) {
    const text = randomRainChar();
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    if (Math.random() > 0.982) {
      ctx.fillStyle = "rgba(170, 255, 170, 0.72)";
    } else {
      ctx.fillStyle = "rgba(0, 210, 60, 0.58)";
    }

    ctx.fillText(text, x, y);

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

        // While falling, it behaves like the rest of the rain: the symbol changes.
        // It only becomes J/O/S/H when it locks into the centre.
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

    // Very subtle flicker while held, but it stays readable as JOSH.
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

        // Once released, it dissolves back into normal Matrix characters.
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
  ctx.save();
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  for (let i = 0; i < name.letters.length; i++) {
    const letter = name.letters[i];

    if (i > name.currentLetter && name.phase === "falling") continue;

    const x = letter.col * fontSize;
    const y = letter.row * fontSize;

    if (y < -fontSize || y > height + fontSize) continue;

    const isLocked = letter.locked && name.phase !== "releasing";
    const flicker = Math.random() > 0.9;

    ctx.shadowBlur = isLocked ? 5 : 4;
    ctx.shadowColor = "rgba(0, 255, 80, 0.32)";

    if (isLocked) {
      ctx.fillStyle = flicker
        ? "rgba(145, 255, 145, 0.52)"
        : "rgba(45, 230, 80, 0.64)";
    } else {
      ctx.fillStyle = flicker
        ? "rgba(150, 255, 150, 0.50)"
        : "rgba(0, 210, 60, 0.58)";
    }

    ctx.fillText(letter.displayChar, x, y);
  }

  ctx.restore();
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

ctx.fillStyle = "black";
ctx.fillRect(0, 0, width, height);
requestAnimationFrame(animate);
