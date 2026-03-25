const goalInput = document.getElementById('goalInput');
const experienceInput = document.getElementById('experienceInput');
const equipmentInput = document.getElementById('equipmentInput');
const generateWorkoutBtn = document.getElementById('generateWorkoutBtn');
const clearWorkoutBtn = document.getElementById('clearWorkoutBtn');
const workoutMessage = document.getElementById('workoutMessage');
const workoutResults = document.getElementById('workoutResults');

function showWorkoutMessage(message, isError = true) {
  if (!workoutMessage) return;
  workoutMessage.textContent = message;
  workoutMessage.style.color = isError ? '#ff6b6b' : '#7dff9b';
}

async function fetchExercises() {
  const url = 'https://wger.de/api/v2/exerciseinfo/?limit=50&language=2';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch exercises.');
  }

  const data = await response.json();
  return data.results || [];
}

function getExerciseName(exercise) {
  if (exercise.name && exercise.name.trim() !== '') {
    return exercise.name;
  }

  if (
    exercise.translations &&
    Array.isArray(exercise.translations) &&
    exercise.translations.length > 0
  ) {
    const validTranslation = exercise.translations.find(
      (translation) => translation.name && translation.name.trim() !== ''
    );

    if (validTranslation) {
      return validTranslation.name;
    }
  }

  return 'Unnamed Exercise';
}

function cleanExerciseName(name) {
  return name.replace(/SS/gi, '').replace(/\s+/g, ' ').trim();
}

function filterEnglishExercises(exercises) {
  return exercises.filter((exercise) => {
    const name = getExerciseName(exercise);

    const basicCharactersOnly = /^[A-Za-z0-9\s\-()]+$/.test(name);
    const notTooLong = name.length < 40;

    const badWords = [
      'alzate',
      'affondi',
      'opdrukken',
      'posteriori',
      'tríceps',
      'empuje',
      'polea',
      'una mano',
      'posteriores',
    ];

    const lowerName = name.toLowerCase();
    const containsBlockedWord = badWords.some((word) =>
      lowerName.includes(word)
    );

    return basicCharactersOnly && notTooLong && !containsBlockedWord;
  });
}

function matchesEquipment(exercise, equipment) {
  const text = JSON.stringify(exercise).toLowerCase();
  const name = cleanExerciseName(getExerciseName(exercise)).toLowerCase();

  if (equipment === 'bodyweight') {
    return (
      text.includes('bodyweight') ||
      text.includes('no equipment') ||
      name.includes('push up') ||
      name.includes('pull up') ||
      name.includes('plank') ||
      name.includes('burpee') ||
      name.includes('crunch') ||
      name.includes('sit up')
    );
  }

  if (equipment === 'dumbbell') {
    return text.includes('dumbbell') || name.includes('dumbbell');
  }

  if (equipment === 'barbell') {
    return text.includes('barbell') || name.includes('barbell');
  }

  if (equipment === 'machine') {
    return (
      text.includes('machine') ||
      text.includes('cable') ||
      name.includes('machine') ||
      name.includes('cable')
    );
  }

  if (equipment === 'gym') {
    return true;
  }

  return true;
}

function matchesGoal(exercise, goal) {
  const category = exercise.category?.name || '';

  if (goal === 'gain') {
    return ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'].includes(category);
  }

  if (goal === 'lose') {
    return ['Abs', 'Legs', 'Shoulders', 'Arms', 'Back', 'Chest'].includes(
      category
    );
  }

  if (goal === 'maintain') {
    return ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Abs'].includes(
      category
    );
  }

  return true;
}

function buildWorkoutPlan(exercises, goal, experience, equipment) {
  const goalAndEquipment = exercises.filter(
    (exercise) =>
      matchesGoal(exercise, goal) && matchesEquipment(exercise, equipment)
  );

  const goalOnly = exercises.filter((exercise) => matchesGoal(exercise, goal));

  let filtered = [...goalAndEquipment];

  if (filtered.length === 0) {
    filtered = [...goalOnly];
  }

  const preferredCategories =
    goal === 'gain'
      ? ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs']
      : goal === 'lose'
      ? ['Legs', 'Abs', 'Back', 'Shoulders', 'Arms']
      : ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'];

  const plan = [];
  const usedIds = new Set();
  const targetCount = experience === 'intermediate' ? 5 : 4;

  preferredCategories.forEach((category) => {
    const options = filtered.filter(
      (exercise) =>
        exercise.category?.name === category && !usedIds.has(exercise.id)
    );

    if (options.length > 0 && plan.length < targetCount) {
      const randomExercise =
        options[Math.floor(Math.random() * options.length)];
      plan.push(randomExercise);
      usedIds.add(randomExercise.id);
    }
  });

  while (plan.length < targetCount) {
    const remaining = filtered.filter((exercise) => !usedIds.has(exercise.id));

    if (remaining.length === 0) break;

    const randomExercise =
      remaining[Math.floor(Math.random() * remaining.length)];
    plan.push(randomExercise);
    usedIds.add(randomExercise.id);
  }

  return {
    plan,
    usedFallback: goalAndEquipment.length === 0,
  };
}

function getSets(goal, experience) {
  if (goal === 'gain' && experience === 'intermediate') return 4;
  if (goal === 'gain') return 3;
  if (goal === 'lose') return 3;
  return 3;
}

function getReps(goal) {
  if (goal === 'gain') return '8-12';
  if (goal === 'lose') return '12-15';
  return '10-12';
}

function renderExercises(exercises, goal, experience) {
  if (!workoutResults) return;

  workoutResults.innerHTML = '';

  if (!exercises.length) {
    workoutResults.innerHTML = '<p>No exercises found.</p>';
    return;
  }

  exercises.forEach((exercise, index) => {
    const rawName = getExerciseName(exercise);
    const name = cleanExerciseName(rawName);
    const sets = getSets(goal, experience);
    const reps = getReps(goal);

    const card = document.createElement('div');
    card.className = 'workout-card';

    card.innerHTML = `
      <h3>${index + 1}. ${name}</h3>
      <p><strong>Muscle Group:</strong> ${
        exercise.category?.name || 'Unknown'
      }</p>
      <p><strong>Sets:</strong> ${sets}</p>
      <p><strong>Reps:</strong> ${reps}</p>
    `;

    workoutResults.appendChild(card);
  });
}

if (generateWorkoutBtn) {
  generateWorkoutBtn.addEventListener('click', async () => {
    const goal = goalInput.value;
    const experience = experienceInput.value;
    const equipment = equipmentInput.value;

    if (!goal || !experience || !equipment) {
      showWorkoutMessage('Please select all fields.');
      return;
    }

    if (workoutResults) {
      workoutResults.innerHTML = '';
    }

    showWorkoutMessage('Generating workout...', false);

    try {
      let exercises = await fetchExercises();
      exercises = filterEnglishExercises(exercises);

      const result = buildWorkoutPlan(exercises, goal, experience, equipment);
      const plan = result.plan;

      if (!plan.length) {
        showWorkoutMessage('No suitable exercises found.');
        return;
      }

      renderExercises(plan, goal, experience);

      if (result.usedFallback) {
        showWorkoutMessage(
          'Workout generated, but exact equipment matches were limited.',
          false
        );
      } else {
        showWorkoutMessage('Workout generated.', false);
      }
    } catch (error) {
      console.error(error);
      if (workoutResults) {
        workoutResults.innerHTML = '';
      }
      showWorkoutMessage('Error generating workout.');
    }
  });
}

if (clearWorkoutBtn) {
  clearWorkoutBtn.addEventListener('click', () => {
    if (workoutResults) {
      workoutResults.innerHTML = '';
    }

    showWorkoutMessage('');
    goalInput.value = '';
    experienceInput.value = '';
    equipmentInput.value = '';
  });
}
