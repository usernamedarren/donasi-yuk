// admin/login/script.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('.login-form');
  const adminIdInput = document.getElementById('admin-id');
  const passwordInput = document.getElementById('password');

  // kalau pakai global/api.js, ini sudah ada:
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000';

  if (!loginForm) {
    console.error('Form login admin tidak ditemukan');
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = adminIdInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert('Email/Admin ID dan password wajib diisi.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('Admin login response:', res.status, data);

      if (!res.ok) {
        alert(data.message || 'Login gagal. Periksa email dan password.');
        return;
      }

      // pastikan ini benar-benar ADMIN
      if (!data.user || data.user.role !== 'ADMIN') {
        alert('Akun ini bukan admin. Gunakan akun dengan role ADMIN.');
        return;
      }

      // simpan token & user pakai helper global kalau ada
      if (typeof saveAuth === 'function') {
        saveAuth(data.token, data.user);
      } else {
        // fallback sederhana
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }

      // flag khusus admin (opsional)
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('adminId', data.user.email || email);

      alert('Admin login berhasil, mengarahkan ke dashboard...');
      window.location.href = '../dashboard/index.html';
    } catch (err) {
      console.error('Error login admin:', err);
      alert('Terjadi kesalahan saat login. Coba lagi.');
    }
  });
});
