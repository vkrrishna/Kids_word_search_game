const situations = [
  {
    category: "friendship",
    prompt: "You see a friend sitting alone during lunch. What can you do?",
    ideas: [
      "Invite them to sit with you.",
      "Ask if they want company.",
      "Tell a trusted adult if they seem very upset."
    ]
  },
  {
    category: "school",
    prompt: "You forgot your homework at home. What are your options?",
    ideas: [
      "Tell the teacher the truth.",
      "Ask if you can bring it tomorrow.",
      "Make a reminder system for next time."
    ]
  },
  {
    category: "responsibility",
    prompt: "You accidentally broke a classroom supply. What would you do?",
    ideas: [
      "Tell the teacher what happened.",
      "Offer to help clean up.",
      "Ask how you can help fix or replace it."
    ]
  },
  {
    category: "friendship",
    prompt: "Two classmates both want to play different games at recess. How can you help?",
    ideas: [
      "Suggest taking turns.",
      "Help them choose a game everyone can join.",
      "Ask each person to explain what matters to them."
    ]
  },
  {
    category: "safety",
    prompt: "Someone dares you to climb somewhere unsafe. What are your choices?",
    ideas: [
      "Say no clearly.",
      "Move to a safer activity.",
      "Get help from an adult if pressure continues."
    ]
  },
  {
    category: "school",
    prompt: "You do not understand the directions, but everyone else has started. What can you do?",
    ideas: [
      "Raise your hand and ask for help.",
      "Quietly ask a partner to repeat the first step.",
      "Read the directions again and underline key words."
    ]
  },
  {
    category: "responsibility",
    prompt: "You promised to help at home, but a friend asks you to play. What are your options?",
    ideas: [
      "Finish helping first, then play.",
      "Ask your family if you can play after a set time.",
      "Invite your friend to wait or join later."
    ]
  },
  {
    category: "friendship",
    prompt: "You hear someone making fun of another student. What could you do?",
    ideas: [
      "Say something kind to the student being teased.",
      "Tell the teasing person to stop if it feels safe.",
      "Ask an adult for help."
    ]
  }
];

const starters = [
  "I could ask...",
  "One safe choice is...",
  "A kind thing to do would be...",
  "If that does not work, I can...",
  "I would choose this because...",
  "This helps the other person by..."
];

const categorySelect = document.querySelector("#categorySelect");
const newSituationBtn = document.querySelector("#newSituationBtn");
const ideaBtn = document.querySelector("#ideaBtn");
const scenarioType = document.querySelector("#scenarioType");
const scenarioTitle = document.querySelector("#scenarioTitle");
const scenarioCount = document.querySelector("#scenarioCount");
const totalCount = document.querySelector("#totalCount");
const savedCount = document.querySelector("#savedCount");
const solutionForm = document.querySelector("#solutionForm");
const solutionInputs = [
  document.querySelector("#solutionOne"),
  document.querySelector("#solutionTwo"),
  document.querySelector("#solutionThree")
];
const bestOptionSelect = document.querySelector("#bestOptionSelect");
const whyInput = document.querySelector("#whyInput");
const feedback = document.querySelector("#feedback");
const clearBtn = document.querySelector("#clearBtn");
const starterBtn = document.querySelector("#starterBtn");
const starterList = document.querySelector("#starterList");
const journalList = document.querySelector("#journalList");
const clearJournalBtn = document.querySelector("#clearJournalBtn");

let currentIndex = -1;
let currentSituation = null;
let ideaIndex = 0;
let savedResponses = 0;

function formatCategory(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function availableSituations() {
  if (categorySelect.value === "all") {
    return situations;
  }
  return situations.filter((situation) => situation.category === categorySelect.value);
}

function setFeedback(text, className = "") {
  feedback.textContent = text;
  feedback.className = `feedback ${className}`.trim();
}

function updateStats() {
  const available = availableSituations();
  scenarioCount.textContent = currentIndex >= 0 ? currentIndex + 1 : 1;
  totalCount.textContent = available.length;
  savedCount.textContent = savedResponses;
}

function clearResponse() {
  solutionInputs.forEach((input) => {
    input.value = "";
  });
  whyInput.value = "";
  bestOptionSelect.value = "1";
}

function renderSituation() {
  scenarioType.textContent = formatCategory(currentSituation.category);
  scenarioTitle.textContent = currentSituation.prompt;
  ideaIndex = 0;
  clearResponse();
  setFeedback("Write three possible solutions, then choose the strongest one.");
  updateStats();
}

function nextSituation() {
  const available = availableSituations();
  currentIndex = (currentIndex + 1) % available.length;
  currentSituation = available[currentIndex];
  renderSituation();
}

function giveIdea() {
  const emptyInput = solutionInputs.find((input) => !input.value.trim());
  const idea = currentSituation.ideas[ideaIndex % currentSituation.ideas.length];
  ideaIndex += 1;

  if (emptyInput) {
    emptyInput.value = idea;
    emptyInput.focus();
  }

  setFeedback(idea, "notice");
}

function renderStarters() {
  starterList.innerHTML = "";
  const shuffled = [...starters].sort(() => Math.random() - 0.5).slice(0, 4);
  shuffled.forEach((starter) => {
    const item = document.createElement("li");
    item.textContent = starter;
    starterList.append(item);
  });
}

function saveResponse(event) {
  event.preventDefault();
  const solutions = solutionInputs.map((input) => input.value.trim());
  const why = whyInput.value.trim();

  if (solutions.some((solution) => solution.length < 4)) {
    setFeedback("Add all 3 possible solutions before saving.", "notice");
    return;
  }

  if (why.length < 8) {
    setFeedback("Add a short reason for your best option.", "notice");
    return;
  }

  const selectedIndex = Number(bestOptionSelect.value) - 1;
  const entry = document.createElement("li");
  const prompt = document.createElement("strong");
  const best = document.createElement("span");
  const reason = document.createElement("span");

  prompt.textContent = currentSituation.prompt;
  best.textContent = `Best: ${solutions[selectedIndex]}`;
  reason.textContent = `Why: ${why}`;
  entry.append(prompt, best, reason);
  journalList.prepend(entry);
  savedResponses += 1;
  updateStats();
  setFeedback("Saved. You thought through more than one choice before deciding.", "success");
}

categorySelect.addEventListener("change", () => {
  currentIndex = -1;
  nextSituation();
});
newSituationBtn.addEventListener("click", nextSituation);
ideaBtn.addEventListener("click", giveIdea);
solutionForm.addEventListener("submit", saveResponse);
clearBtn.addEventListener("click", () => {
  clearResponse();
  setFeedback("Cleared. Try three fresh ideas.");
});
starterBtn.addEventListener("click", renderStarters);
clearJournalBtn.addEventListener("click", () => {
  journalList.innerHTML = "";
  savedResponses = 0;
  updateStats();
});

renderStarters();
nextSituation();
