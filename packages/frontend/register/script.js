document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.querySelector('.register-form');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const termsCheckbox = document.getElementById('terms');

  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!termsCheckbox.checked) {
      alert('Anda harus menyetujui syarat dan ketentuan.');
      return;
    }

    if (!username || !email || !password || !confirmPassword) {
      alert('Semua field harus diisi.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Kata sandi dan Konfirmasi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      alert('Kata sandi minimal 6 karakter.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Registrasi gagal.');
        return;
      }

      alert(`Akun untuk ${username} berhasil dibuat! Silakan Login.`);
      window.location.href = '../login/index.html';
    } catch (err) {
      console.error(err);
      alert('Terjadi error saat menghubungi server.');
    }
  });
});
