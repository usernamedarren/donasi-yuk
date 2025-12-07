// admin/register/script.js
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('.register-form');
    const adminKeyInput = document.getElementById('admin-key');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    // Kunci Rahasia Admin untuk membatasi akses registrasi (Simulasi)
    const SECRET_ADMIN_KEY = 'DONASIYUKADMIN2025';
    
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        const adminKey = adminKeyInput.value.trim();
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (adminKey !== SECRET_ADMIN_KEY) {
            alert('Kode Verifikasi Admin salah. Anda tidak memiliki izin untuk mendaftar sebagai Admin.');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Kata sandi dan Konfirmasi Kata Sandi tidak cocok.');
            return;
        }

        if (password.length < 8) {
            alert('Kata sandi minimal harus 8 karakter.');
            return;
        }

        console.log('Pendaftaran Admin Berhasil Disimulasikan.');
        alert(`Pendaftaran Admin untuk ${username} berhasil! Silakan Login.`);
        window.location.href = '../login/index.html'; 
    });
});
