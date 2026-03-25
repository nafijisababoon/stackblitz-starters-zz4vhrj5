/* =========================
   DATE + STORAGE HELPERS
========================= */

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadGoals() {
  const raw = localStorage.getItem('sl_goals');
  if (raw) return JSON.parse(raw);

  const defaults = {
    calorieGoal: 3000,
    macros: { protein: 150, carbs: 250, fat: 65, sugar: 50 },
  };

  localStorage.setItem('sl_goals', JSON.stringify(defaults));
  return defaults;
}

function loadToday() {
  const raw = localStorage.getItem('sl_today');
  const key = todayKey();

  if (raw) {
    const obj = JSON.parse(raw);
    if (obj.date === key) return obj;
  }

  const fresh = {
    date: key,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0,
  };

  localStorage.setItem('sl_today', JSON.stringify(fresh));
  return fresh;
}

function saveToday(obj) {
  localStorage.setItem('sl_today', JSON.stringify(obj));
}

/* =========================
   RING PROGRESS
========================= */

function setRingProgress(cardEl, current, goal) {
  const percent = goal > 0 ? Math.min(Math.max(current / goal, 0), 1) : 0;

  const circle = cardEl.querySelector('.macro-fill');
  const text = cardEl.querySelector('.macro-percent');

  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference;

  if (text) text.textContent = Math.round(percent * 100) + '%';

  requestAnimationFrame(() => {
    const offset = circumference * (1 - percent);
    circle.style.strokeDashoffset = offset;
  });
}

/* =========================
   MAIN UI UPDATE FUNCTION
========================= */

function refreshUI() {
  const goals = loadGoals();
  const today = loadToday();

  /* ----- CALORIE BAR ----- */
  const consumed = Math.round(today.calories);
  const goal = Math.max(0, Number(goals.calorieGoal) || 0);
  const pct = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;

  const big = document.getElementById('goal-big');
  const small = document.getElementById('goal-small');
  const fill = document.getElementById('goal-bar-fill');

  if (big) big.textContent = `${consumed} / ${goal} kcal`;
  if (small) small.textContent = `${pct}% of daily goal`;

  if (fill) {
    fill.style.width = '0%';
    requestAnimationFrame(() => (fill.style.width = pct + '%'));
  }

  /* ----- GOALS TEXT ----- */
  const gt = document.getElementById('goals-text');
  if (gt) {
    const m = goals.macros;
    gt.textContent = `Goals: ${m.protein}g Protein · ${m.carbs}g Carbs · ${m.fat}g Fat · ${m.sugar}g Sugar`;
  }

  /* ----- MACRO RINGS ----- */
  document.querySelectorAll('.macro-card').forEach((card) => {
    const type = card.dataset.macro;

    const current = Number(today[type] || 0);
    const goalVal = Number(goals.macros[type] || 0);

    card.querySelector('.macro-current').textContent = Math.round(current);
    card.querySelector('.macro-goal').textContent = Math.round(goalVal);

    setRingProgress(card, current, goalVal);
  });
}

/* =========================
   ADD FOOD ENTRY
========================= */

function addEntry(entry) {
  const today = loadToday();

  today.calories += entry.calories || 0;
  today.protein += entry.protein || 0;
  today.carbs += entry.carbs || 0;
  today.fat += entry.fat || 0;
  today.sugar += entry.sugar || 0;

  saveToday(today);
  refreshUI();
}

/* =========================
   EDIT MACRO GOALS PANEL
========================= */

function setupMacroPanel() {
  const editBtn = document.getElementById('edit-goals');
  const macroPanel = document.getElementById('macro-panel');
  const macroView = document.getElementById('macro-view');
  const saveBtn = document.getElementById('save-macros');
  const cancelBtn = document.getElementById('cancel-macros');

  if (!editBtn) return;

  // OPEN EDIT MODE
  editBtn.addEventListener('click', () => {
    const goals = loadGoals();

    document.getElementById('macro-protein').value = goals.macros.protein;
    document.getElementById('macro-carbs').value = goals.macros.carbs;
    document.getElementById('macro-fat').value = goals.macros.fat;

    macroView.classList.add('hidden');
    macroPanel.classList.remove('hidden');
  });

  // CANCEL
  cancelBtn?.addEventListener('click', () => {
    macroPanel.classList.add('hidden');
    macroView.classList.remove('hidden');
  });

  // SAVE
  saveBtn?.addEventListener('click', () => {
    const goals = loadGoals();

    const p = Number(document.getElementById('macro-protein').value);
    const c = Number(document.getElementById('macro-carbs').value);
    const f = Number(document.getElementById('macro-fat').value);

    if (p > 0) goals.macros.protein = p;
    if (c > 0) goals.macros.carbs = c;
    if (f > 0) goals.macros.fat = f;

    localStorage.setItem('sl_goals', JSON.stringify(goals));

    macroPanel.classList.add('hidden');
    macroView.classList.remove('hidden');

    refreshUI(); // live update, no reload
  });
}

/* =========================
   PAGE LOAD
========================= */

document.addEventListener('DOMContentLoaded', () => {
  refreshUI();
  setupMacroPanel();
});
