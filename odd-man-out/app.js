const rounds = [
  {
    theme: "Food groups",
    items: ["apple", "banana", "carrot", "mango"],
    odd: "carrot",
    reason: "Carrot does not belong because it is a vegetable, and the others are fruits."
  },
  {
    theme: "Where they live",
    items: ["shark", "dolphin", "whale", "eagle"],
    odd: "eagle",
    reason: "Eagle does not belong because it lives in the air, and the others live in water."
  },
  {
    theme: "School tools",
    items: ["pencil", "eraser", "notebook", "pillow"],
    odd: "pillow",
    reason: "Pillow does not belong because it is used for sleeping, and the others are school tools."
  },
  {
    theme: "Shapes",
    items: ["circle", "triangle", "square", "rectangle", "banana"],
    odd: "banana",
    reason: "Banana does not belong because it is food, and the others are shapes."
  },
  {
    theme: "Weather",
    items: ["rain", "snow", "wind", "chair", "cloud"],
    odd: "chair",
    reason: "Chair does not belong because it is furniture, and the others are connected to weather."
  },
  {
    theme: "Animals",
    items: ["lion", "tiger", "bear", "sofa"],
    odd: "sofa",
    reason: "Sofa does not belong because it is furniture, and the others are animals."
  },
  {
    theme: "Transport",
    items: ["bus", "train", "bicycle", "boat", "tomato"],
    odd: "tomato",
    reason: "Tomato does not belong because it is food, and the others are ways to travel."
  },
  {
    theme: "Things that fly",
    items: ["kite", "bird", "airplane", "rock"],
    odd: "rock",
    reason: "Rock does not belong because it does not fly, and the others can fly."
  }
];

const colors = ["#bfdbfe", "#bbf7d0", "#fde68a", "#fecaca", "#ddd6fe"];

const itemGrid = document.querySelector("#itemGrid");
const setSizeSelect = document.querySelector("#setSizeSelect");
const newRoundBtn = document.querySelector("#newRoundBtn");
const showAnswerBtn = document.querySelector("#showAnswerBtn");
const answerForm = document.querySelector("#answerForm");
const acceptAlternateBtn = document.querySelector("#acceptAlternateBtn");
const reasonInput = document.querySelector("#reasonInput");
const feedback = document.querySelector("#feedback");
const scoreCount = document.querySelector("#scoreCount");
const roundCount = document.querySelector("#roundCount");
const totalRounds = document.querySelector("#totalRounds");
const roundTheme = document.querySelector("#roundTheme");
const statusBadge = document.querySelector("#statusBadge");
const selectedWord = document.querySelector("#selectedWord");
const customForm = document.querySelector("#customForm");
const customItems = document.querySelector("#customItems");
const customOdd = document.querySelector("#customOdd");
const customWhy = document.querySelector("#customWhy");
const historyList = document.querySelector("#historyList");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");

let currentRound = null;
let currentIndex = -1;
let selectedItem = "";
let score = 0;
let answered = false;

function normalize(value) {
  return value.trim().toLowerCase();
}

function initials(label) {
  return label
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roundsForSize() {
  const size = Number(setSizeSelect.value);
  return rounds.filter((round) => round.items.length === size);
}

function setStatus(text, className = "") {
  statusBadge.textContent = text;
  statusBadge.className = `status-badge ${className}`.trim();
}

function setFeedback(text, className = "") {
  feedback.textContent = text;
  feedback.className = `feedback ${className}`.trim();
}

function addHistory(item, reason, label) {
  const entry = document.createElement("li");
  entry.textContent = `${label}: ${item} - ${reason}`;
  historyList.prepend(entry);
}

function updateStats() {
  scoreCount.textContent = score;
  roundCount.textContent = currentIndex >= 0 ? currentIndex + 1 : 1;
  totalRounds.textContent = currentIndex >= 0 ? roundsForSize().length : 1;
}

function renderRound() {
  itemGrid.innerHTML = "";
  roundTheme.textContent = currentRound.theme;
  selectedItem = "";
  answered = false;
  reasonInput.value = "";
  selectedWord.textContent = "This item";
  setStatus("Choose one");
  setFeedback("Pick the item that does not fit. A different answer can count when the reason is clear.");

  currentRound.items.forEach((item, index) => {
    const button = document.createElement("button");
    const visual = document.createElement("span");
    const name = document.createElement("span");

    button.type = "button";
    button.className = "item-card";
    button.dataset.item = item;
    visual.className = "visual";
    visual.style.setProperty("--tile-color", colors[index % colors.length]);
    visual.textContent = initials(item);
    name.className = "item-name";
    name.textContent = item;
    button.append(visual, name);
    button.addEventListener("click", () => selectItem(item));
    itemGrid.append(button);
  });

  updateStats();
}

function selectItem(item) {
  selectedItem = item;
  selectedWord.textContent = item;
  document.querySelectorAll(".item-card").forEach((button) => {
    button.classList.toggle("selected", button.dataset.item === item);
  });
  setStatus("Explain why");
}

function markTiles() {
  document.querySelectorAll(".item-card").forEach((button) => {
    button.classList.remove("selected", "correct", "incorrect");
    if (normalize(button.dataset.item) === normalize(currentRound.odd)) {
      button.classList.add("correct");
    } else if (normalize(button.dataset.item) === normalize(selectedItem)) {
      button.classList.add("incorrect");
    }
  });
}

function nextRound() {
  const availableRounds = roundsForSize();
  currentIndex = (currentIndex + 1) % availableRounds.length;
  currentRound = availableRounds[currentIndex];
  renderRound();
}

function checkAnswer(event) {
  event.preventDefault();

  if (!selectedItem) {
    setFeedback("Choose one item first.", "notice");
    return;
  }

  const reason = reasonInput.value.trim();
  if (normalize(selectedItem) === normalize(currentRound.odd)) {
    if (!answered) {
      score += 1;
      answered = true;
    }
    markTiles();
    setStatus("Correct", "correct");
    setFeedback(currentRound.reason, "success");
    addHistory(selectedItem, reason || currentRound.reason, "Correct");
    updateStats();
    return;
  }

  markTiles();
  setStatus("Try a reason", "try-again");
  setFeedback("That is not the usual answer. If you can explain it in your own way, use Accept My Reason.", "notice");
}

function acceptAlternate() {
  if (!selectedItem) {
    setFeedback("Choose the item you want to explain.", "notice");
    return;
  }

  const reason = reasonInput.value.trim();
  if (reason.length < 12) {
    setFeedback("Add a fuller reason so someone else can follow your thinking.", "notice");
    return;
  }

  if (!answered) {
    score += 1;
    answered = true;
  }

  document.querySelectorAll(".item-card").forEach((button) => {
    button.classList.toggle("correct", normalize(button.dataset.item) === normalize(selectedItem));
    button.classList.remove("incorrect", "selected");
  });
  setStatus("Reason accepted", "correct");
  setFeedback(`Accepted: ${selectedItem} can work because ${reason}`, "success");
  addHistory(selectedItem, reason, "Different answer");
  updateStats();
}

function showAnswer() {
  selectedItem = currentRound.odd;
  answered = true;
  selectedWord.textContent = currentRound.odd;
  markTiles();
  setStatus("Answer shown", "correct");
  setFeedback(currentRound.reason, "success");
}

function useCustomRound(event) {
  event.preventDefault();
  const items = customItems.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const odd = customOdd.value.trim();
  const why = customWhy.value.trim();

  if (items.length < 4 || items.length > 5 || !odd || !why) {
    setFeedback("Add 4 or 5 comma-separated items, the odd one, and a reason.", "notice");
    return;
  }

  if (!items.map(normalize).includes(normalize(odd))) {
    setFeedback("The odd one must match one of the items.", "notice");
    return;
  }

  currentRound = {
    theme: "Custom round",
    items,
    odd,
    reason: why
  };
  currentIndex = -1;
  renderRound();
}

setSizeSelect.addEventListener("change", () => {
  currentIndex = -1;
  nextRound();
});
newRoundBtn.addEventListener("click", nextRound);
showAnswerBtn.addEventListener("click", showAnswer);
answerForm.addEventListener("submit", checkAnswer);
acceptAlternateBtn.addEventListener("click", acceptAlternate);
customForm.addEventListener("submit", useCustomRound);
clearHistoryBtn.addEventListener("click", () => {
  historyList.innerHTML = "";
});

nextRound();
