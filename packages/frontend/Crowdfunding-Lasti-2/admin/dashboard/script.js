// admin/dashboard/script.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000';

  const pendingEl = document.getElementById('stat-pending');
  const activeEl = document.getElementById('stat-active');
  const usersEl = document.getElementById('stat-users');
  const donationsTodayEl = document.getElementById('stat-donations-today');
  const urgentListEl = document.getElementById('urgent-task-list');
  const adminNameEl = document.getElementById('admin-name');

  const formatRupiah = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID');

  const getToken =
    typeof window.getAuthToken === 'function'
      ? window.getAuthToken
      : () => localStorage.getItem('auth_token');

  const getHeaders = () => {
    if (typeof window.getAuthHeaders === 'function') {
      return window.getAuthHeaders();
    }
    return { Authorization: `Bearer ${getToken()}` };
  };

  function setupLogout() {
    const btn = document.querySelector('.logout-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!confirm('Apakah Anda yakin ingin Logout dari sesi Admin?')) return;
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminId');
      } catch (e) {
        console.error(e);
      }
      window.location.href = '../../login/index.html';
    });
  }

  async function ensureAdmin() {
    const token = getToken();
    if (!token) {
      window.location.href = '../../login/index.html';
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      console.log('auth/me (admin dashboard):', data);

      if (!res.ok || data.role !== 'ADMIN') {
        alert('Halaman ini hanya untuk Admin.');
        window.location.href = '../../login/index.html';
        return null;
      }

      if (adminNameEl) adminNameEl.textContent = data.name || 'Admin';
      return data;
    } catch (err) {
      console.error('ensureAdmin error:', err);
      window.location.href = '../../login/index.html';
      return null;
    }
  }

  async function loadDashboard() {
    if (!urgentListEl) return;

    urgentListEl.innerHTML = '<p>Memuat data dashboard...</p>';

    try {
      // 1. Pending campaigns
      const pendingRes = await fetch(`${API_BASE_URL}/admin/campaigns/pending`, {
        headers: getHeaders(),
      });
      const pendingData = await pendingRes.json();

      pendingEl.textContent = Array.isArray(pendingData)
        ? pendingData.length
        : 0;

      // 2. Semua campaign
      const allCampaignRes = await fetch(`${API_BASE_URL}/campaigns`, {
        headers: getHeaders(),
      });
      const allCampaigns = await allCampaignRes.json();

      const activeCampaigns = Array.isArray(allCampaigns)
        ? allCampaigns.filter((c) => c.status === 'PUBLISHED')
        : [];

      activeEl.textContent = activeCampaigns.length;

      // 3. Semua user
      const userRes = await fetch(`${API_BASE_URL}/users`, {
        headers: getHeaders(),
      });
      const users = await userRes.json();
      usersEl.textContent = Array.isArray(users) ? users.length : 0;

      // 4. Donasi hari ini (sementara dummy 0)
      donationsTodayEl.textContent = formatRupiah(0);

      // 5. Tampilkan list pending
      if (!pendingData.length) {
        urgentListEl.innerHTML =
          '<p style="color:var(--color-secondary);">Tidak ada kampanye yang menunggu verifikasi 🎉</p>';
        return;
      }

      urgentListEl.innerHTML = pendingData
        .map(
          (t) => `
          <div class="campaign-item">
            <div class="campaign-info">
              <p>${t.title} (Oleh: ${t.owner?.name || 'Penggalang Dana'})</p>
              <span>
                Diajukan pada: ${new Date(t.createdAt).toLocaleString(
                  'id-ID'
                )} | Kategori: ${t.category || '-'}
              </span>
            </div>
            <button class="btn-verify" data-id="${t.id}">
              TINJAU
            </button>
          </div>
        `
        )
        .join('');

      urgentListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-verify');
        if (!btn) return;
        window.location.href = '../verifikasi/index.html';
      });
    } catch (err) {
      console.error('loadDashboard error:', err);
      urgentListEl.innerHTML =
        '<p>Terjadi error saat memuat data dashboard.</p>';
    }
  }


  (async () => {
    const admin = await ensureAdmin();
    if (!admin) return;
    setupLogout();
    loadDashboard();
  })();
});
