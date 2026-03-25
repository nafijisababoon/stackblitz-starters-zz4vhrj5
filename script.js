// ============================
// SOLO LEVELING - CLEAN JS (with portions dropdown)
// ============================

// ===== CONFIG =====
const apiKey = 'F0HqgaNiWSgK0oI6vAnKpN6XdfXamKsmTyijHX4o';

// USDA nutrient IDs (most reliable)
const NID = {
  KCAL: 1008,
  KJ: 2047,
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
  SUGAR: 2000,
};

// ===== HELPERS =====
const $ = (id) => document.getElementById(id);
const results = document.getElementById('results'); // used by render + event delegation

function clampNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toGrams(value, unit) {
  const v = clampNum(value);
  const u = String(unit || '').toUpperCase();
  if (u === 'G') return v;
  if (u === 'MG') return v / 1000;
  return v; // fallback
}

function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ===== STORAGE =====
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

function saveGoals(goals) {
  localStorage.setItem('sl_goals', JSON.stringify(goals));
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
  localStorage.setItem('sl_log', JSON.stringify([]));
  return fresh;
}

function saveToday(obj) {
  localStorage.setItem('sl_today', JSON.stringify(obj));
}

function loadLog() {
  const raw = localStorage.getItem('sl_log');
  return raw ? JSON.parse(raw) : [];
}

function saveLog(arr) {
  localStorage.setItem('sl_log', JSON.stringify(arr));
}

function clampTodayNonNeg(today) {
  ['calories', 'protein', 'carbs', 'fat', 'sugar'].forEach((k) => {
    today[k] = Math.max(0, clampNum(today[k]));
  });
}

// ===== USDA PARSING (use IDs for accuracy) =====
function extractNutrients(food) {
  const out = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };
  let kcal = null;
  let kj = null;

  (food.foodNutrients || []).forEach((n) => {
    const id = n.nutrientId;
    const val = clampNum(n.value);
    const unit = n.unitName;

    if (id === NID.KCAL) kcal = val;
    if (id === NID.KJ) kj = val;

    if (id === NID.PROTEIN) out.protein = toGrams(val, unit);
    if (id === NID.CARBS) out.carbs = toGrams(val, unit);
    if (id === NID.FAT) out.fat = toGrams(val, unit);
    if (id === NID.SUGAR) out.sugar = toGrams(val, unit);
  });

  if (kcal == null && kj != null) kcal = kj / 4.184; // kJ -> kcal
  out.calories = clampNum(kcal);

  return out;
}

function dedupeFoods(foods, limit = 6) {
  const seen = new Set();
  const pick = [];

  const rank = (x) =>
    x.dataType === 'Foundation' ? 0 : x.dataType === 'SR Legacy' ? 1 : 2;

  const sorted = foods.slice().sort((a, b) => rank(a) - rank(b));

  for (const f of sorted) {
    const key = normalizeName(f.description);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    pick.push(f);
    if (pick.length >= limit) break;
  }

  return pick;
}

// ===== PORTION OPTIONS (dropdown) =====
function buildPortionOptions(food) {
  const opts = [];

  // grams always
  opts.push({ label: 'grams', gramWeight: 1 });

  // branded serving size (if in grams)
  const ss = clampNum(food.servingSize);
  const ssu = String(food.servingSizeUnit || '').toLowerCase();
  if (ss > 0 && (ssu === 'g' || ssu === 'gram' || ssu === 'grams')) {
    opts.push({ label: `serving (${ss}g)`, gramWeight: ss });
  }

  // foodMeasures / foodPortions sometimes exist
  const measures = food.foodMeasures || food.foodPortions || [];
  for (const m of measures) {
    const gw = clampNum(m.gramWeight);
    const name = (m.modifier || m.measureUnit?.name || m.measureUnit || '')
      .toString()
      .trim();
    if (gw > 0 && name) {
      opts.push({ label: `${name} (${gw}g)`, gramWeight: gw });
    }
  }

  // de-dupe
  const seen = new Set();
  return opts
    .filter((o) => {
      const k = `${o.label}|${o.gramWeight}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 8);
}

// ===== UI: CALORIE BAR + RINGS =====
function setRingProgress(cardEl, current, goal) {
  const percent = goal > 0 ? Math.min(Math.max(current / goal, 0), 1) : 0;

  const circle = cardEl.querySelector('.macro-fill');
  const text = cardEl.querySelector('.macro-percent');
  if (!circle) return;

  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = String(circumference);
  circle.style.strokeDashoffset = String(circumference);

  if (text) text.textContent = `${Math.round(percent * 100)}%`;

  requestAnimationFrame(() => {
    const offset = circumference * (1 - percent);
    circle.style.strokeDashoffset = String(offset);
  });
}

function updateMacroUI(goals, today) {
  document.querySelectorAll('.macro-card[data-macro]').forEach((card) => {
    const type = card.dataset.macro;

    const current = clampNum(today[type]);
    const goalVal = clampNum(goals.macros?.[type]);

    const curEl = card.querySelector('.macro-current');
    const goalEl = card.querySelector('.macro-goal');

    if (curEl) curEl.textContent = Math.round(current);
    if (goalEl) goalEl.textContent = Math.round(goalVal);

    setRingProgress(card, current, goalVal);
  });

  const goalsText = $('goals-text');
  if (goalsText) {
    const m = goals.macros;
    goalsText.textContent = `Goals: ${m.protein}g Protein · ${m.carbs}g Carbs · ${m.fat}g Fat · ${m.sugar}g Sugar`;
  }
}

function updateGoalBar(goals, today) {
  const consumed = Math.round(clampNum(today.calories));
  const goal = Math.max(0, Math.round(clampNum(goals.calorieGoal)));
  const pct = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;

  const net = $('net-calories');
  const line = $('goal-line');

  if (net) net.textContent = consumed;
  if (line) line.textContent = `Goal: ${goal} kcal · ${pct}% reached`;
}

function updateAllUI() {
  const goals = loadGoals();
  const today = loadToday();
  updateGoalBar(goals, today);
  updateMacroUI(goals, today);
  renderLog();
}

// ===== LOG (remove + clear all) =====
function renderLog() {
  const list = $('log-list');
  const totalEl = $('log-total-cal');
  if (!list) return;

  const log = loadLog();
  list.innerHTML = '';

  let total = 0;

  if (!log.length) {
    list.innerHTML = `<div class="log-empty">No entries yet.</div>`;
    if (totalEl) totalEl.textContent = '0';
    return;
  }

  log.forEach((item, index) => {
    total += clampNum(item.calories);

    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `
      <div class="log-info">
        <strong>${item.name || 'Food'}</strong><br>
        🔥 ${Math.round(clampNum(item.calories))} kcal ·
        💪 ${Math.round(clampNum(item.protein))}g ·
        🍞 ${Math.round(clampNum(item.carbs))}g ·
        🧈 ${Math.round(clampNum(item.fat))}g ·
        🍬 ${Math.round(clampNum(item.sugar))}g
      </div>
      <button class="delete-btn" data-i="${index}" aria-label="Delete">🗑</button>
    `;
    list.appendChild(div);
  });

  if (totalEl) totalEl.textContent = String(Math.round(total));
}

function addEntry(entry) {
  const today = loadToday();
  const log = loadLog();

  const e = {
    name: entry.name || 'Food',
    calories: clampNum(entry.calories),
    protein: clampNum(entry.protein),
    carbs: clampNum(entry.carbs),
    fat: clampNum(entry.fat),
    sugar: clampNum(entry.sugar),
    ts: Date.now(),
  };

  today.calories += e.calories;
  today.protein += e.protein;
  today.carbs += e.carbs;
  today.fat += e.fat;
  today.sugar += e.sugar;

  clampTodayNonNeg(today);

  log.push(e);
  saveToday(today);
  saveLog(log);

  updateAllUI();
}

function removeEntry(index) {
  const log = loadLog();
  const today = loadToday();

  const removed = log[index];
  if (!removed) return;

  today.calories -= clampNum(removed.calories);
  today.protein -= clampNum(removed.protein);
  today.carbs -= clampNum(removed.carbs);
  today.fat -= clampNum(removed.fat);
  today.sugar -= clampNum(removed.sugar);

  clampTodayNonNeg(today);

  log.splice(index, 1);
  saveToday(today);
  saveLog(log);

  updateAllUI();
}

function clearLog() {
  if (!confirm("Clear today's log?")) return;

  saveLog([]);
  saveToday({
    date: todayKey(),
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0,
  });

  updateAllUI();
}

// ===== GOAL PANEL (TDEE) =====
function activityMultiplier(level) {
  switch (level) {
    case 'sedentary':
      return 1.2;
    case 'light':
      return 1.375;
    case 'moderate':
      return 1.55;
    case 'active':
      return 1.725;
    case 'very':
      return 1.9;
    default:
      return 1.55;
  }
}
function calcAndSaveTDEE() {
  const height = clampNum($('height-input')?.value);
  const weight = clampNum($('weight-input')?.value);
  const age = clampNum($('age-input')?.value);
  const sex = $('sex-input')?.value || 'male';
  const activity = $('activity-input')?.value || 'moderate';
  const goalWeight = clampNum($('goal-weight-input')?.value);
  const scaledMode = $('scaled-goal-checkbox')?.checked;

  if (height <= 0 || weight <= 0 || age <= 0) return;

  const bmr =
    sex === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;

  const tdee = Math.round(bmr * activityMultiplier(activity));
  let calorieGoal = tdee;

  if (goalWeight > 0) {
    const diff = goalWeight - weight;

    if (!scaledMode) {
      // SIMPLE MODE
      if (diff < 0) calorieGoal = tdee - 500;
      else if (diff > 0) calorieGoal = tdee + 300;
    } else {
      // SCALED MODE
      if (diff < 0) {
        const deficit = Math.min(900, 300 + Math.abs(diff) * 10);
        calorieGoal = tdee - deficit;
      } else if (diff > 0) {
        const surplus = Math.min(800, 100 + diff * 10);
        calorieGoal = tdee + surplus;
      }
    }
  }

  calorieGoal = Math.max(calorieGoal, 1200);

  const goals = loadGoals();
  goals.calorieGoal = calorieGoal;
  saveGoals(goals);

  $('goal-panel')?.classList.add('hidden');
  updateAllUI();
}

// ===== CUSTOM ENTRY =====
function addCustomEntry(e) {
  e?.preventDefault();

  const calories = clampNum($('custom-cal')?.value);
  if (calories <= 0) return;

  addEntry({
    name: $('custom-name')?.value?.trim() || 'Custom',
    calories,
    protein: clampNum($('custom-protein')?.value),
    carbs: clampNum($('custom-carbs')?.value),
    fat: clampNum($('custom-fat')?.value),
    sugar: clampNum($('custom-sugar')?.value),
  });

  // reset
  if ($('custom-name')) $('custom-name').value = '';
  if ($('custom-cal')) $('custom-cal').value = '';
  if ($('custom-protein')) $('custom-protein').value = 0;
  if ($('custom-carbs')) $('custom-carbs').value = 0;
  if ($('custom-fat')) $('custom-fat').value = 0;
  if ($('custom-sugar')) $('custom-sugar').value = 0;
}

// ===== RESULTS RENDER (dropdown + add button) =====
function renderFoodsLovable(foods) {
  if (!results) return;

  results.innerHTML = foods
    .map((food) => {
      const n = extractNutrients(food);
      const portions = buildPortionOptions(food);

      // store the data we need on the card (safe + small)
      const payload = {
        name: food.description || 'Food',
        calories: n.calories,
        protein: n.protein,
        carbs: n.carbs,
        fat: n.fat,
        sugar: n.sugar,
        portions,
      };

      return `
        <div class="food-card" data-food="${encodeURIComponent(
          JSON.stringify(payload)
        )}">
          <div class="food-top">
            <div>
              <h3 class="food-title">${food.description || 'Food'}</h3>
              <div class="food-sub">(best estimate)</div>
            </div>

            <div class="food-nutrients-grid">
              <div class="n-col">
                <div class="n-row">🔥 <span>${Math.round(
                  n.calories
                )} kcal</span></div>
                <div class="n-row n-dim">🍞 <span>${Math.round(
                  n.carbs
                )} g carbs</span></div>
              </div>

              <div class="n-col">
                <div class="n-row">💪 <span>${Math.round(
                  n.protein
                )} g protein</span></div>
                <div class="n-row n-dim">🧈 <span>${Math.round(
                  n.fat
                )} g fat</span></div>
              </div>

              <div class="n-col">
                <div class="n-row">🍬 <span>${Math.round(
                  n.sugar
                )} g sugar</span></div>
              </div>
            </div>
          </div>

          <div class="food-bottom">
            <label>Amount:</label>
            <input class="food-amt" type="number" value="100" min="0" step="1" />
            <select class="food-unit">
              ${portions
                .map(
                  (p) => `<option value="${p.gramWeight}">${p.label}</option>`
                )
                .join('')}
            </select>
            <button class="food-add" type="button">＋ Add</button>
          </div>
        </div>
      `;
    })
    .join('');
}

// Event delegation for result cards
if (results) {
  results.addEventListener('click', (e) => {
    const btn = e.target.closest('.food-add');
    if (!btn) return;

    const card = btn.closest('.food-card');
    if (!card) return;

    const data = JSON.parse(decodeURIComponent(card.dataset.food || '%7B%7D'));

    const amt = clampNum(card.querySelector('.food-amt')?.value);

    // grams => gramWeight = 1 so grams = amt*1
    // serving => gramWeight = serving grams so grams = amt*servingG (amt = servings)
    const unitGram = clampNum(card.querySelector('.food-unit')?.value) || 1;
    const grams = Math.max(0, amt * unitGram);

    // nutrients are per 100g estimate -> scale
    const factor = grams / 100;

    addEntry({
      name: data.name,
      calories: clampNum(data.calories) * factor,
      protein: clampNum(data.protein) * factor,
      carbs: clampNum(data.carbs) * factor,
      fat: clampNum(data.fat) * factor,
      sugar: clampNum(data.sugar) * factor,
    });
  });
}

// ===== USDA SEARCH =====
let lastFoods = [];

async function searchFoods(e) {
  e.preventDefault();

  const inputEl = $('food-input');
  const query = inputEl?.value?.trim();
  if (!query || !results) return;

  results.innerHTML = `<p class="loading">Loading...</p>`;

  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          pageSize: 20,
          dataType: ['Foundation', 'SR Legacy', 'Branded'],
        }),
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!data.foods?.length) {
      results.innerHTML = `<p class="no-results">No results found.</p>`;
      return;
    }

    lastFoods = dedupeFoods(data.foods, 6);
    renderFoodsLovable(lastFoods);
  } catch (err) {
    results.innerHTML = `<p class="error">Error loading food data: ${err.message}</p>`;
  }
}

// ===== INIT / EVENT WIRING =====
document.addEventListener('DOMContentLoaded', () => {
  loadToday();
  loadGoals();
  updateAllUI();

  $('food-form')?.addEventListener('submit', searchFoods);

  $('log-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    removeEntry(Number(btn.dataset.i));
  });

  $('clear-log')?.addEventListener('click', clearLog);

  $('toggle-goal')?.addEventListener('click', () =>
    $('goal-panel')?.classList.toggle('hidden')
  );
  $('cancel-goals')?.addEventListener('click', () =>
    $('goal-panel')?.classList.add('hidden')
  );
  $('calc-goal-btn')?.addEventListener('click', calcAndSaveTDEE);

  $('toggle-custom')?.addEventListener('click', () =>
    $('custom-panel')?.classList.toggle('hidden')
  );
  $('add-custom')?.addEventListener('click', addCustomEntry);
});
