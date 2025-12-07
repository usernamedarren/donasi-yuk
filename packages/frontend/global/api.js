// global/api.js
const API_BASE_URL = 'https://donasiyuk.vercel.app';

const STORAGE_KEYS = {
  TOKEN: 'auth_token',   // PILIH SATU NAMA KUNCI KONSISTEN
  USER: 'auth_user',
};

// ------ HELPER AUTH ------

function saveAuth(token, user) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user || {}));
}

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Gagal parse auth_user:', e);
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

function getAuthHeaders() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

// ------ SINKRONKAN NAVBAR USER ------

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  const nameEls = document.querySelectorAll('.username');
  const handleEls = document.querySelectorAll('.user-handle');

  if (!user) return; // belum login → biarkan teks default di HTML

  const name = user.name || 'User';
  const handle =
    user.handle ||
    (user.email ? '@' + user.email.split('@')[0] : '@user');

  nameEls.forEach((el) => (el.textContent = name));
  handleEls.forEach((el) => (el.textContent = handle));
});
