// login/script.js (frontend user)
document.addEventListener('DOMContentLoaded', () => {
  // Cari elemen form
  const form = document.querySelector('.login-form');
  if (!form) {
    console.warn('login-form tidak ditemukan di halaman ini.');
    return;
  }

  // Cari input email & password (pakai id atau tipe)
  const emailInput =
    form.querySelector('#email') ||
    form.querySelector('input[type="email"]');
  const passwordInput =
    form.querySelector('#password') ||
    form.querySelector('input[type="password"]');

  // Cari tombol submit / login
  const submitButton =
    form.querySelector('button[type="submit"]') ||
    form.querySelector('#login-button') ||
    form.querySelector('button');

  if (!emailInput || !passwordInput) {
    console.error('Input email atau password tidak ditemukan di form login.');
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
      alert('Email dan password wajib diisi.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('Response /auth/login:', res.status, data);

      if (!res.ok) {
        alert(data.message || 'Login gagal. Periksa kembali email dan password.');
        return;
      }

      // Simpan token & user pakai helper dari global/api.js
      if (typeof saveAuth === 'function') {
        saveAuth(data.token, data.user);
      } else {
        // fallback kalau saveAuth belum kebaca (harusnya nggak kepakai kalau script urut)
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }

      alert('Login berhasil!');
      window.location.href = '../beranda/index.html';
    } catch (err) {
      console.error('Error saat login:', err);
      alert('Terjadi kesalahan pada server. Coba beberapa saat lagi.');
    }
  };

  // 1️⃣ Kalau form disubmit (misal user tekan Enter di input), jalankan handleLogin
  form.addEventListener('submit', handleLogin);

  // 2️⃣ Kalau tombol login di-klik, juga jalankan handleLogin
  if (submitButton) {
    submitButton.addEventListener('click', handleLogin);
  } else {
    console.warn('Tombol login tidak ditemukan di form.');
  }
});
