const themes = {
  animals: {
    words: ["TIGER", "PANDA", "HORSE", "RABBIT", "KOALA", "ZEBRA","Cheetah"],
    mystery: "WHALE",
    hint: "The mystery animal lives in the ocean. Cheetah test"
  },
  space: {
    words: ["PLANET", "COMET", "ROCKET", "MOON", "ORBIT", "STAR"],
    mystery: "ALIEN",
    hint: "The mystery word is a space visitor from stories."
  },
  food: {
    words: ["APPLE", "BREAD", "CARROT", "PASTA", "MANGO", "HONEY"],
    mystery: "COOKIE",
    hint: "The mystery food is sweet and round."
  },
  feelings: {
    words: ["HAPPY", "BRAVE", "CALM", "PROUD", "KIND", "SILLY"],
    mystery: "CURIOUS",
    hint: "The mystery feeling helps you ask good questions."
  }
};

const size = 10;
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const directions = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: -1, col: 1 }
];

const gridEl = document.querySelector("#grid");
const wordListEl = document.querySelector("#wordList");
const foundCountEl = document.querySelector("#foundCount");
const totalCountEl = document.querySelector("#totalCount");
const themeSelect = document.querySelector("#themeSelect");
const newPuzzleBtn = document.querySelector("#newPuzzleBtn");
const hintBtn = document.querySelector("#hintBtn");
const clearBtn = document.querySelector("#clearBtn");
const hintText = document.querySelector("#hintText");
const mysteryBadge = document.querySelector("#mysteryBadge");
const timerEl = document.querySelector("#timer");
const promptText = document.querySelector("#promptText");
const sentenceForm = document.querySelector("#sentenceForm");
const sentenceInput = document.querySelector("#sentenceInput");
const sentenceList = document.querySelector("#sentenceList");
const canvas = document.querySelector("#drawCanvas");
const ctx = canvas.getContext("2d");

let puzzle = null;
let isSelecting = false;
let selectedCells = [];
let activePromptWord = "";
let timerId = null;
let seconds = 0;
let drawing = false;
let drawColor = "#2b6cb0";

function createEmptyGrid() {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function canPlace(grid, word, row, col, direction) {
  for (let i = 0; i < word.length; i += 1) {
    const nextRow = row + direction.row * i;
    const nextCol = col + direction.col * i;

    if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
      return false;
    }

    const current = grid[nextRow][nextCol];
    if (current && current !== word[i]) {
      return false;
    }
  }

  return true;
}

function placeWord(grid, word) {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const direction = randomItem(directions);
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    if (!canPlace(grid, word, row, col, direction)) {
      continue;
    }

    const cells = [];
    for (let i = 0; i < word.length; i += 1) {
      const nextRow = row + direction.row * i;
      const nextCol = col + direction.col * i;
      grid[nextRow][nextCol] = word[i];
      cells.push(`${nextRow}-${nextCol}`);
    }

    return cells;
  }

  return null;
}

function buildPuzzle(themeKey) {
  const theme = themes[themeKey];
  const allWords = [...theme.words, theme.mystery].sort((a, b) => b.length - a.length);

  for (let buildAttempt = 0; buildAttempt < 40; buildAttempt += 1) {
    const grid = createEmptyGrid();
    const placements = {};

    allWords.forEach((word) => {
      const cells = placeWord(grid, word);
      if (cells) {
        placements[word] = cells;
      }
    });

    if (Object.keys(placements).length !== allWords.length) {
      continue;
    }

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!grid[row][col]) {
          grid[row][col] = randomItem(letters);
        }
      }
    }

    return {
      theme,
      grid,
      placements,
      found: new Set(),
      mysteryFound: false
    };
  }

  throw new Error("Could not build the word search grid.");
}

function renderGrid() {
  gridEl.innerHTML = "";

  puzzle.grid.forEach((rowLetters, row) => {
    rowLetters.forEach((letter, col) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.textContent = letter;
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}, letter ${letter}`);
      gridEl.append(cell);
    });
  });
}

function renderWords() {
  wordListEl.innerHTML = "";

  puzzle.theme.words.forEach((word) => {
    const item = document.createElement("li");
    item.textContent = word;
    item.dataset.word = word;
    if (puzzle.found.has(word)) {
      item.classList.add("found");
    }
    wordListEl.append(item);
  });

  foundCountEl.textContent = puzzle.found.size + (puzzle.mysteryFound ? 1 : 0);
  totalCountEl.textContent = puzzle.theme.words.length + 1;
  mysteryBadge.textContent = puzzle.mysteryFound ? `Mystery: ${puzzle.theme.mystery}` : "1 mystery word";
}

function getCell(row, col) {
  return gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function clearSelection() {
  selectedCells.forEach((cell) => cell.classList.remove("selected"));
  selectedCells = [];
}

function markFound(word, isMystery) {
  const className = isMystery ? "mystery-found" : "found";
  puzzle.placements[word].forEach((key) => {
    const [row, col] = key.split("-").map(Number);
    getCell(row, col).classList.add(className);
  });

  if (isMystery) {
    puzzle.mysteryFound = true;
    promptText.textContent = `Mystery found: ${word}. Draw it or use it in a sentence.`;
  } else {
    puzzle.found.add(word);
    activePromptWord = word;
    promptText.textContent = `Use ${word.toLowerCase()} in a sentence.`;
  }

  renderWords();
  checkWin();
}

function selectedWord() {
  return selectedCells.map((cell) => cell.textContent).join("");
}

function sameCellList(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function checkSelection() {
  const selectedKeys = selectedCells.map((cell) => `${cell.dataset.row}-${cell.dataset.col}`);
  const word = selectedWord();
  const reversedWord = word.split("").reverse().join("");
  const candidates = [...puzzle.theme.words, puzzle.theme.mystery];

  for (const candidate of candidates) {
    if (puzzle.found.has(candidate) || (candidate === puzzle.theme.mystery && puzzle.mysteryFound)) {
      continue;
    }

    const placement = puzzle.placements[candidate];
    const reversedPlacement = [...placement].reverse();
    const wordMatches = candidate === word || candidate === reversedWord;
    const pathMatches = sameCellList(selectedKeys, placement) || sameCellList(selectedKeys, reversedPlacement);

    if (wordMatches && pathMatches) {
      markFound(candidate, candidate === puzzle.theme.mystery);
      return;
    }
  }
}

function cellsInLine(start, end) {
  const startRow = Number(start.dataset.row);
  const startCol = Number(start.dataset.col);
  const endRow = Number(end.dataset.row);
  const endCol = Number(end.dataset.col);
  const rowDiff = endRow - startRow;
  const colDiff = endCol - startCol;
  const rowStep = Math.sign(rowDiff);
  const colStep = Math.sign(colDiff);
  const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
  const isStraight = rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff);

  if (!isStraight) {
    return [start];
  }

  const cells = [];
  for (let i = 0; i <= length; i += 1) {
    const cell = getCell(startRow + rowStep * i, startCol + colStep * i);
    if (cell) {
      cells.push(cell);
    }
  }
  return cells;
}

function updateSelection(endCell) {
  const startCell = selectedCells[0] || endCell;
  clearSelection();
  selectedCells = cellsInLine(startCell, endCell);
  selectedCells.forEach((cell) => cell.classList.add("selected"));
}

function startTimer() {
  clearInterval(timerId);
  seconds = 0;
  timerEl.textContent = "00:00";
  timerId = setInterval(() => {
    seconds += 1;
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const remainingSeconds = String(seconds % 60).padStart(2, "0");
    timerEl.textContent = `${minutes}:${remainingSeconds}`;
  }, 1000);
}

function checkWin() {
  const totalFound = puzzle.found.size + (puzzle.mysteryFound ? 1 : 0);
  const totalWords = puzzle.theme.words.length + 1;

  if (totalFound === totalWords) {
    clearInterval(timerId);
    hintText.textContent = "Puzzle complete. Try a new theme or make a sentence for every word.";
  }
}

function newPuzzle() {
  puzzle = buildPuzzle(themeSelect.value);
  activePromptWord = "";
  hintText.textContent = "";
  promptText.textContent = "Find a word to unlock a sentence prompt.";
  sentenceInput.value = "";
  sentenceList.innerHTML = "";
  renderGrid();
  renderWords();
  clearCanvas();
  startTimer();
}

function saveSentence(event) {
  event.preventDefault();
  const sentence = sentenceInput.value.trim();

  if (!sentence) {
    return;
  }

  const item = document.createElement("li");
  const label = activePromptWord ? `${activePromptWord}: ` : "";
  item.textContent = `${label}${sentence}`;
  sentenceList.prepend(item);
  sentenceInput.value = "";
}

function setupGridEvents() {
  gridEl.addEventListener("pointerdown", (event) => {
    const cell = event.target.closest(".cell");
    if (!cell) {
      return;
    }

    isSelecting = true;
    clearSelection();
    selectedCells = [cell];
    cell.classList.add("selected");
    cell.setPointerCapture(event.pointerId);
  });

  gridEl.addEventListener("pointermove", (event) => {
    if (!isSelecting) {
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target ? target.closest(".cell") : null;
    if (cell) {
      updateSelection(cell);
    }
  });

  gridEl.addEventListener("pointerup", () => {
    if (!isSelecting) {
      return;
    }

    isSelecting = false;
    checkSelection();
    clearSelection();
  });
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

function setupDrawing() {
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  clearCanvas();

  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    const point = canvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) {
      return;
    }

    const point = canvasPoint(event);
    ctx.strokeStyle = drawColor;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  });

  canvas.addEventListener("pointerup", () => {
    drawing = false;
  });

  document.querySelectorAll(".swatch").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".swatch").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      drawColor = button.dataset.color;
    });
  });
}

newPuzzleBtn.addEventListener("click", newPuzzle);
themeSelect.addEventListener("change", newPuzzle);
hintBtn.addEventListener("click", () => {
  hintText.textContent = puzzle.theme.hint;
});
clearBtn.addEventListener("click", clearCanvas);
sentenceForm.addEventListener("submit", saveSentence);

setupGridEvents();
setupDrawing();
newPuzzle();
