const signupForm = document.getElementById('signupForm');
const signupMessage = document.getElementById('signupMessage');
const backToLoginBtn = document.getElementById('backToLoginBtn');

const usernameInput = document.getElementById('signupUsername');
const passwordInput = document.getElementById('signupPassword');
const confirmPasswordInput = document.getElementById('signupConfirmPassword');
const ageInput = document.getElementById('signupAge');
const sexInput = document.getElementById('signupSex');
const goalInput = document.getElementById('signupGoal');

function showMessage(message, isError = true) {
  if (!signupMessage) return;
  signupMessage.textContent = message;
  signupMessage.style.color = isError ? '#ff6b6b' : '#7dff9b';
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('sl_users')) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem('sl_users', JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('sl_current_user')) || null;
  } catch {
    return null;
  }
}

function saveCurrentUser(user) {
  localStorage.setItem(
    'sl_current_user',
    JSON.stringify({
      username: user.username,
      age: user.age ?? null,
      sex: user.sex ?? null,
      goal: user.goal ?? null,
      createdAt: user.createdAt ?? null,
      loggedInAt: new Date().toISOString(),
    })
  );
}

function usernameExists(username) {
  const normalized = username.trim().toLowerCase();
  return getUsers().some(
    (user) => String(user.username).trim().toLowerCase() === normalized
  );
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

// If already logged in, don't let user stay on signup page
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = getCurrentUser();
  if (currentUser?.username) {
    window.location.href = 'profile.html';
  }
});

if (signupForm) {
  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const age = Number(ageInput.value);
    const sex = sexInput.value;
    const goal = goalInput.value;

    if (!username || !password || !confirmPassword || !age || !sex || !goal) {
      showMessage('Please fill in all fields.');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      showMessage('Username must be between 3 and 20 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showMessage('Username can only contain letters, numbers, and underscores.');
      return;
    }

    if (usernameExists(username)) {
      showMessage('That username already exists.');
      return;
    }

    if (!isStrongPassword(password)) {
      showMessage('Password must be at least 8 characters and include letters and numbers.');
      return;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match.');
      return;
    }

    if (age < 13 || age > 100) {
      showMessage('Enter a valid age.');
      return;
    }

    const users = getUsers();

    const newUser = {
      username,
      password,
      age,
      sex,
      goal,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);
    saveCurrentUser(newUser);

    showMessage('Account created successfully. Redirecting...', false);

    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 700);
  });
}

if (backToLoginBtn) {
  backToLoginBtn.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
}