// login.js

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('loginMessage');
const signUpBtn = document.getElementById('signUpBtn');
const forgotBtn = document.getElementById('forgotBtn');

function showMessage(message, isError = true) {
  loginMessage.textContent = message;
  loginMessage.style.color = isError ? '#ff6b6b' : '#7dff9b';
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('sl_users')) || [];
  } catch (error) {
    return [];
  }
}

function saveCurrentUser(user) {
  localStorage.setItem(
    'sl_current_user',
    JSON.stringify({
      username: user.username,
      loggedInAt: new Date().toISOString(),
    })
  );
}

function findUser(username) {
  const users = getUsers();
  return users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showMessage('Please enter both username and password.');
    return;
  }

  const user = findUser(username);

  if (!user) {
    showMessage('Username not found.');
    return;
  }

  if (user.password !== password) {
    showMessage('Incorrect password.');
    return;
  }

  saveCurrentUser(user);
  showMessage('Login successful. Redirecting...', false);

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 800);
});

signUpBtn.addEventListener('click', () => {
  window.location.href = 'signup.html';
});

forgotBtn.addEventListener('click', () => {
  showMessage('Forgot password is not built yet.', true);
});

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
  } catch (error) {
    return [];
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
      loggedInAt: new Date().toISOString(),
    })
  );
}

function findUser(username) {
  const users = getUsers();
  return users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showMessage('Please enter both username and password.');
      return;
    }

    const user = findUser(username);

    if (!user) {
      showMessage('Username not found.');
      return;
    }

    if (user.password !== password) {
      showMessage('Incorrect password.');
      return;
    }

    saveCurrentUser(user);
    showMessage('Login successful. Redirecting...', false);

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
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
