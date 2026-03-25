const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('loginMessage');
const signUpBtn = document.getElementById('signUpBtn');
const forgotBtn = document.getElementById('forgotBtn');

function showMessage(message, isError = true) {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.style.color = isError ? '#ff6b6b' : '#7dff9b';
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('sl_users')) || [];
  } catch {
    return [];
  }
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

function findUser(username) {
  const normalized = username.trim().toLowerCase();
  return getUsers().find(
    (user) => String(user.username).trim().toLowerCase() === normalized
  );
}

// If already logged in, don't let user stay on login page
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = getCurrentUser();
  if (currentUser?.username) {
    window.location.href = 'profile.html';
  }
});

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showMessage('Please enter both username and password.');
      return;
    }

    const user = findUser(username);

    if (!user) {
      showMessage('Username not found.');
      return;
    }

    if (String(user.password) !== password) {
      showMessage('Incorrect password.');
      return;
    }

    saveCurrentUser(user);
    showMessage('Login successful. Redirecting...', false);

    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 700);
  });
}

if (signUpBtn) {
  signUpBtn.addEventListener('click', () => {
    window.location.href = 'signup.html';
  });
}

if (forgotBtn) {
  forgotBtn.addEventListener('click', () => {
    showMessage('Forgot password is not built yet.');
  });
}