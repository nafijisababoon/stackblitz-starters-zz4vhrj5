function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('sl_current_user'));
    } catch {
      return null;
    }
  }
  
  function updateNavbar() {
    const loginLink = document.getElementById('loginNavLink');
    const profileLink = document.getElementById('profileNavLink');
  
    const user = getCurrentUser();
  
    if (!loginLink || !profileLink) return;
  
    if (user && user.username) {
      loginLink.style.display = 'none';
      profileLink.style.display = 'inline-block';
      profileLink.textContent = user.username;
    } else {
      loginLink.style.display = 'inline-block';
      profileLink.style.display = 'none';
    }
  }
  
  document.addEventListener('DOMContentLoaded', updateNavbar);