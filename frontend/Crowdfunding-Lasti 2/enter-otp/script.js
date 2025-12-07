document.addEventListener('DOMContentLoaded', () => {
    const otpInputs = document.querySelectorAll('.otp-input');
    const otpForm = document.querySelector('.otp-form');
    const targetEmailSpan = document.getElementById('target-email');
    
    
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || 'your-email@example.com';
    targetEmailSpan.textContent = email;

    
    otpInputs.forEach((input, index) => {
        
        input.addEventListener('input', (e) => {
            if (e.target.value.length === e.target.maxLength && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });

        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    
    otpForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        let enteredOTP = '';
        otpInputs.forEach(input => {
            enteredOTP += input.value;
        });

        
        if (enteredOTP.length !== 5) {
            alert('Mohon masukkan kode OTP 5 digit secara lengkap.');
            return;
        }

        console.log('OTP yang dimasukkan:', enteredOTP);

        
        
        
        
        if (enteredOTP === '12345') { 
            alert('Verifikasi OTP Berhasil! Mengarahkan ke halaman reset password.');
            window.location.href = '../reset-password/index.html';
        } else {
            alert('Kode OTP salah. Silakan coba lagi atau kirim ulang.');
        }
    });

    
    const resendLink = document.querySelector('.resend-otp-link');
    resendLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert(`Mengirim ulang OTP ke ${email}...`);
        
    });
});