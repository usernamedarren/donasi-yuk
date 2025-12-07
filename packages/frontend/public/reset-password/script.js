document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.querySelector('.reset-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    resetForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        const newPassword = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        
        if (newPassword.length < 8) {
            alert('Kata sandi minimal harus 8 karakter.');
            return;
        }

        
        if (newPassword !== confirmPassword) {
            alert('Kata sandi baru dan Konfirmasi Kata Sandi tidak cocok.');
            return;
        }

        
        
        console.log('Kata Sandi Baru:', newPassword);

        
        
        
        
        alert('Kata Sandi Berhasil diubah! Silakan login dengan kata sandi baru Anda.');
        
        
        window.location.href = '../login/index.html'; 
    });
});