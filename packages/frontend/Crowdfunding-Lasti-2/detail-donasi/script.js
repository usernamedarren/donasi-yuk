console.log('>> detail-donasi/script.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000';

  // ================= TOKEN & HEADER HELPER (LOCAL) =================
  const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'auth_user',
  };

  function getTokenDirect() {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (e) {
      console.error('Error read auth_token from localStorage:', e);
      return null;
    }
  }

  function getHeadersDirect() {
    const token = getTokenDirect();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  console.log('Token (detail-donasi) =', getTokenDirect());

  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  const campaignId = Number(idParam);

  // elemen-elemen atas
  const titleEl = document.getElementById('campaign-title');
  const currentFundEl = document.getElementById('current-fund');
  const goalFundEl = document.getElementById('goal-fund');
  const daysLeftEl = document.getElementById('days-left');
  const mainImageEl = document.querySelector('.campaign-main-image');
  const progressIndicatorEl = document.getElementById('progress-indicator');
  const fullDescSection = document.getElementById('campaign-full-description');

  // form donasi
  const donationForm = document.getElementById('donation-form');
  const nominalInput = document.getElementById('input-nominal');
  const totalDonasiEl = document.getElementById('total-donasi');
  const nominalButtons = document.querySelectorAll('.btn-nominal');

  const formatRupiah = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID');

  if (!idParam || Number.isNaN(campaignId)) {
    console.error('ID kampanye tidak valid di URL');
    if (titleEl) titleEl.textContent = 'Kampanye tidak valid';
    return;
  }

  // ====== LOAD DETAIL KAMPANYE DARI BACKEND ======
  async function loadCampaignDetail() {
    try {
      console.log('Fetch detail ke:', `${API_BASE_URL}/campaigns/${campaignId}`);
      const res = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`);
      const c = await res.json();
      console.log('Data detail kampanye =', c);

      if (!res.ok) {
        console.error('Gagal ambil kampanye:', c);
        if (titleEl) titleEl.textContent = 'Kampanye tidak ditemukan';
        return;
      }

      const collected = c.collectedAmount || 0;
      const goal = c.goalAmount || 0;
      const daysLeft = c.daysLeft ?? 0;

      if (titleEl) titleEl.textContent = c.title || 'Tanpa Judul';
      if (currentFundEl) currentFundEl.textContent = formatRupiah(collected);
      if (goalFundEl) goalFundEl.textContent = formatRupiah(goal);
      if (daysLeftEl) daysLeftEl.textContent = `${daysLeft} Hari`;
      if (mainImageEl) {
        mainImageEl.src = c.image || '../assets/banjir.png';
      }
      if (progressIndicatorEl && goal > 0) {
        const progress = Math.min((collected / goal) * 100, 100).toFixed(0);
        progressIndicatorEl.style.width = `${progress}%`;
      }
      if (fullDescSection) {
        fullDescSection.innerHTML = `
          <h2>Deskripsi Kampanye</h2>
          <p>${c.description || 'Tidak ada deskripsi.'}</p>
        `;
      }
    } catch (err) {
      console.error('Error fetch detail campaign:', err);
      if (titleEl) titleEl.textContent = 'Terjadi error saat memuat kampanye';
    }
  }

  // ====== UPDATE TOTAL DONASI DI UI ======
  function updateTotalDonasiDisplay() {
    if (!totalDonasiEl || !nominalInput) return;
    const amount = Number(nominalInput.value || 0);
    totalDonasiEl.textContent = formatRupiah(amount);
  }

  nominalButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const amount = Number(btn.dataset.amount || 0);
      if (nominalInput) nominalInput.value = amount || '';
      updateTotalDonasiDisplay();
    });
  });

  if (nominalInput) {
    nominalInput.addEventListener('input', updateTotalDonasiDisplay);
  }

  // ====== SUBMIT DONASI ======
  if (donationForm) {
    donationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getTokenDirect();
      if (!token) {
        alert('Silakan login terlebih dahulu untuk berdonasi.');
        window.location.href = '../login/index.html';
        return;
      }

      const amount = Number(nominalInput?.value || 0);

      if (!amount || amount < 10000) {
        alert('Nominal donasi minimal Rp 10.000.');
        return;
      }

      try {
        console.log('Mengirim donasi ke /donations, token =', token);
        const res = await fetch(`${API_BASE_URL}/donations`, {
          method: 'POST',
          headers: getHeadersDirect(),
          body: JSON.stringify({
            campaignId,
            amount,
          }),
        });

        const data = await res.json();
        console.log('Respon donasi =', res.status, data);

        if (!res.ok) {
          alert(data.message || 'Donasi gagal.');
          return;
        }

        alert('Donasi berhasil, terima kasih!');
        donationForm.reset();
        updateTotalDonasiDisplay();
        loadCampaignDetail(); // refresh angka terkumpul
      } catch (err) {
        console.error('Error kirim donasi:', err);
        alert('Terjadi error saat menghubungi server.');
      }
    });
  }

  // INIT
  loadCampaignDetail();
  updateTotalDonasiDisplay();
});
