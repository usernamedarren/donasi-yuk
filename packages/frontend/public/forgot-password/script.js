document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.querySelector('.forgot-form');
    const emailInput = document.getElementById('email');
    const repeatEmailInput = document.getElementById('repeat-email');
    
    forgotForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        const email = emailInput.value.trim();
        const repeatEmail = repeatEmailInput.value.trim();
        
        
        
        if (email === '' || repeatEmail === '') {
            alert('Mohon isi kedua kolom Email.');
            return;
        }

        if (email !== repeatEmail) {
            alert('Kolom Email dan Ulangi Email harus sama.');
            return;
        }

        
        console.log('Mengirim OTP ke:', email);

        
        
        alert(`OTP telah dikirim ke ${email}! Silakan cek email Anda.`);
        
        
        window.location.href = `../enter-otp/index.html?email=${encodeURIComponent(email)}`;
        
    });
});