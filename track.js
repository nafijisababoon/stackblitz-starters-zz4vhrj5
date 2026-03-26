import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm';

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const glowPlugin = {
  id: 'glowPlugin',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const activeElements = chart.getActiveElements();

    if (activeElements.length === 0) return;

    ctx.save();
    activeElements.forEach(({ datasetIndex, index }) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      const element = meta.data[index];
      const dataset = chart.data.datasets[datasetIndex];
      const color = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index]
        : dataset.borderColor || dataset.backgroundColor;

      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      if (chart.config.type === 'bar') {
        ctx.fillStyle = color;
        ctx.fillRect(
          element.x - element.width / 2,
          element.y,
          element.width,
          element.base - element.y
        );
      }
    });
    ctx.restore();
  },
};

Chart.register(glowPlugin);

function getTrackerData() {
  try {
    return JSON.parse(localStorage.getItem('sl_tracker_data')) || {};
  } catch (error) {
    return {};
  }
}

function saveTrackerData(data) {
  localStorage.setItem('sl_tracker_data', JSON.stringify(data));
}

function getLast7Dates() {
  const dates = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

function getDayLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { weekday: 'long' });
}

function buildWeeklyTrackerArrays() {
  const trackerData = getTrackerData();
  const last7Dates = getLast7Dates();

  const labels = [];
  const calories = [];
  const workouts = [];

  last7Dates.forEach((date) => {
    labels.push(getDayLabel(date));
    calories.push(trackerData[date]?.calories || 0);
    workouts.push(trackerData[date]?.workouts || 0);
  });

  return { labels, calories, workouts };
}

function updateTrackerSummary(caloriesArray, workoutsArray) {
  const totalCalories = caloriesArray.reduce((sum, value) => sum + value, 0);
  const totalWorkouts = workoutsArray.reduce((sum, value) => sum + value, 0);
  const activeDays = workoutsArray.filter((value) => value > 0).length;

  const caloriesEl = document.getElementById('weeklyCaloriesTotal');
  const workoutsEl = document.getElementById('weeklyWorkoutsTotal');
  const activeDaysEl = document.getElementById('activeDaysTotal');

  if (caloriesEl) caloriesEl.textContent = totalCalories;
  if (workoutsEl) workoutsEl.textContent = totalWorkouts;
  if (activeDaysEl) activeDaysEl.textContent = activeDays;
}

function renderCaloriesChart(labels, caloriesData) {
  const ctx = document.getElementById('caloriesChart');
  if (!ctx) return;

  const barColors = [
    '#aa91d9',
    '#9966FF',
    '#6702bf',
    '#4e04c4',
    '#522999',
    '#441366',
    '#300659',
  ];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Calories',
          data: caloriesData,
          backgroundColor: barColors,
          hoverBackgroundColor: barColors.map((c) => `${c}CC`),
          borderWidth: 0,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: true,
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Calories Logged Per Day',
          font: {
            size: 20,
            family: 'Stick No Bills, sans-serif',
          },
        },
        tooltip: {
          enabled: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
    plugins: [glowPlugin],
  });
}

function renderWorkoutChart(labels, workoutData) {
  const ctx = document.getElementById('workoutsChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Workouts Completed',
          data: workoutData,
          borderColor: '#9966FF',
          backgroundColor: '#9966FF',
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Workouts Completed Per Day',
          font: {
            size: 20,
            family: 'Stick No Bills, sans-serif',
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}

function seedDummyTrackerDataIfEmpty() {
  const current = getTrackerData();
  if (Object.keys(current).length > 0) return;

  const last7Dates = getLast7Dates();
  const starterData = {};



  saveTrackerData(starterData);
}

document.addEventListener('DOMContentLoaded', () => {
  seedDummyTrackerDataIfEmpty();

  const { labels, calories, workouts } = buildWeeklyTrackerArrays();

  updateTrackerSummary(calories, workouts);
  renderCaloriesChart(labels, calories);
  renderWorkoutChart(labels, workouts);
});
