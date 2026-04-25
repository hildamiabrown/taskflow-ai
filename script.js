const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const impactInput = document.querySelector("#impact");
const effortInput = document.querySelector("#effort");
const dueInput = document.querySelector("#due");
const energyInput = document.querySelector("#energy");
const taskList = document.querySelector("#task-list");
const scheduleList = document.querySelector("#schedule-list");
const optimizeButton = document.querySelector("#optimize-btn");
const seedButton = document.querySelector("#seed-btn");
const taskCount = document.querySelector("#task-count");
const focusTime = document.querySelector("#focus-time");
const accuracyScore = document.querySelector("#accuracy-score");
const scheduleNote = document.querySelector("#schedule-note");
const promptPreview = document.querySelector("#prompt-preview");

const sampleTasks = [
  { title: "Plan Monday launch tasks", impact: 5, effort: 2, due: 5, energy: 4 },
  { title: "Clean up project backlog", impact: 3, effort: 3, due: 3, energy: 3 },
  { title: "Draft weekly status update", impact: 4, effort: 1, due: 4, energy: 3 },
  { title: "Review budget notes", impact: 4, effort: 2, due: 3, energy: 5 },
];

let tasks = [];

function calculateScore(task) {
  const impactWeight = task.impact * 4;
  const dueWeight = task.due * 3;
  const energyFit = task.energy * 1.5;
  const effortPenalty = task.effort * 1.8;

  return Math.round(impactWeight + dueWeight + energyFit - effortPenalty);
}

function effortToMinutes(effort) {
  return [0, 25, 45, 75, 110][effort] || 45;
}

function labelForScore(score) {
  if (score >= 31) return "Do first";
  if (score >= 24) return "Schedule";
  if (score >= 18) return "Batch";
  return "Defer";
}

function optimizeTasks() {
  return [...tasks]
    .map((task) => ({ ...task, score: calculateScore(task) }))
    .sort((a, b) => b.score - a.score);
}

function addTask(task) {
  tasks.push({
    id: crypto.randomUUID(),
    title: task.title,
    impact: Number(task.impact),
    effort: Number(task.effort),
    due: Number(task.due),
    energy: Number(task.energy),
    complete: false,
  });
  render();
}

function removeTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  render();
}

function toggleComplete(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, complete: !task.complete } : task,
  );
  render();
}

function renderTaskList(orderedTasks) {
  if (!orderedTasks.length) {
    taskList.innerHTML = '<li class="empty-state">Add tasks or load the sample workflow.</li>';
    return;
  }

  taskList.innerHTML = orderedTasks
    .map((task) => {
      const scoreLabel = labelForScore(task.score);
      const status = task.complete ? "Completed" : scoreLabel;

      return `
        <li class="task-card">
          <header>
            <p class="task-title">${escapeHtml(task.title)}</p>
            <span class="score-pill">${task.score} pts</span>
          </header>
          <div class="task-meta">
            <span>${status}</span>
            <span>${effortToMinutes(task.effort)} min</span>
            <span>Impact ${task.impact}/5</span>
            <span>Due ${task.due}/5</span>
          </div>
          <div class="task-actions">
            <button type="button" data-action="toggle" data-id="${task.id}">
              ${task.complete ? "Reopen" : "Complete"}
            </button>
            <button type="button" data-action="remove" data-id="${task.id}">Remove</button>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderSchedule(orderedTasks) {
  const activeTasks = orderedTasks.filter((task) => !task.complete).slice(0, 5);
  const timeBlocks = ["9:00 AM", "10:15 AM", "11:30 AM", "1:30 PM", "3:00 PM"];

  if (!activeTasks.length) {
    scheduleList.innerHTML = '<li class="empty-state">Your optimized schedule will appear here.</li>';
    scheduleNote.textContent = "Waiting for tasks";
    return;
  }

  scheduleNote.textContent = "Generated from priority score";
  scheduleList.innerHTML = activeTasks
    .map(
      (task, index) => `
        <li>
          <strong>${timeBlocks[index]} - ${escapeHtml(task.title)}</strong>
          <span>${labelForScore(task.score)} · ${effortToMinutes(task.effort)} minute focus block</span>
        </li>
      `,
    )
    .join("");
}

function renderStats(orderedTasks) {
  const totalMinutes = orderedTasks
    .filter((task) => !task.complete)
    .reduce((sum, task) => sum + effortToMinutes(task.effort), 0);
  const confidence = Math.min(99, 88 + orderedTasks.length + Math.floor(totalMinutes / 180));

  taskCount.textContent = String(tasks.length);
  focusTime.textContent = `${(totalMinutes / 60).toFixed(totalMinutes % 60 ? 1 : 0)}h`;
  accuracyScore.textContent = `${confidence}%`;
}

function renderPrompt(orderedTasks) {
  const topTask = orderedTasks[0];

  promptPreview.textContent = topTask
    ? `Given ${tasks.length} tasks, prioritize "${topTask.title}" because its urgency, impact, and energy fit produce the strongest optimization score.`
    : "Prioritize tasks using impact, deadline pressure, effort, and energy fit. Generate a daily plan with clear next actions.";
}

function render() {
  const orderedTasks = optimizeTasks();
  renderTaskList(orderedTasks);
  renderSchedule(orderedTasks);
  renderStats(orderedTasks);
  renderPrompt(orderedTasks);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();

  if (!title) return;

  addTask({
    title,
    impact: impactInput.value,
    effort: effortInput.value,
    due: dueInput.value,
    energy: energyInput.value,
  });

  taskInput.value = "";
  taskInput.focus();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "toggle") toggleComplete(id);
  if (action === "remove") removeTask(id);
});

optimizeButton.addEventListener("click", render);

seedButton.addEventListener("click", () => {
  tasks = [];
  sampleTasks.forEach(addTask);
});

render();
