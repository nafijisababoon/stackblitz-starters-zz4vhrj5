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
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem('sl_users', JSON.stringify(users));
}

function usernameExists(username) {
  return getUsers().some(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
}

if (signupForm) {
  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
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

    if (usernameExists(username)) {
      showMessage('That username already exists.');
      return;
    }

    if (password.length < 8) {
      showMessage('Password must be at least 8 characters.');
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

    showMessage('Account created successfully. Redirecting to login...', false);

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
  });
}

if (backToLoginBtn) {
  backToLoginBtn.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
}
