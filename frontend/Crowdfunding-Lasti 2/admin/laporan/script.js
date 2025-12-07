// admin/laporan/script.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000';

  const financialSummaryContainer =
    document.getElementById('financial-summary');
  const categoryBreakdownContainer =
    document.getElementById('category-breakdown');
  const campaignReportContainer =
    document.getElementById('campaign-report');
  const adminNameEl = document.getElementById('admin-name');

  const formatRupiah = (number) =>
    'Rp ' + Number(number || 0).toLocaleString('id-ID');

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
      if (!confirm('Apakah Anda yakin ingin Logout?')) return;
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
      console.log('auth/me (laporan admin):', data);

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

  function renderFinancialSummary(fin) {
    financialSummaryContainer.innerHTML = `
      <div class="summary-item">
        <p>Total Dana Terkumpul</p>
        <strong>${formatRupiah(fin.totalRaised)}</strong>
      </div>
      <div class="summary-item">
        <p>Total Dana Disalurkan (Net)</p>
        <strong>${formatRupiah(fin.netToCauses)}</strong>
      </div>
      <div class="summary-item">
        <p>Biaya Operasional Platform (1%)</p>
        <strong>${formatRupiah(fin.platformFee)}</strong>
      </div>
      <div class="summary-item">
        <p>Rata-rata Donasi</p>
        <strong>${formatRupiah(fin.avgDonation)}</strong>
      </div>
      <div class="summary-item">
        <p>Total Donatur Unik</p>
        <strong>${(fin.usersDonated || 0).toLocaleString('id-ID')}</strong>
      </div>
    `;
  }

  function renderCategoryBreakdown(categories) {
    categoryBreakdownContainer.innerHTML = '';
    const sorted = [...categories].sort((a, b) => b.funds - a.funds);

    sorted.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${item.name}</span>
        <strong>${formatRupiah(item.funds)}</strong>
      `;
      categoryBreakdownContainer.appendChild(li);
    });
  }

  function renderCampaignReport(statusList) {
    campaignReportContainer.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'breakdown-list';

    statusList.forEach((item) => {
      const label = (() => {
        const s = (item.status || '').toUpperCase();
        if (s === 'PUBLISHED') return 'Aktif';
        if (s === 'PENDING') return 'Menunggu Verifikasi';
        if (s === 'REJECTED') return 'Ditolak';
        return s || 'Lainnya';
      })();

      const li = document.createElement('li');
      li.innerHTML = `
        <span>${label}</span>
        <strong>${item.count} Kampanye</strong>
      `;
      ul.appendChild(li);
    });

    campaignReportContainer.appendChild(ul);
  }

  async function loadReport() {
    financialSummaryContainer.innerHTML = '<p>Memuat laporan...</p>';

    try {
      const res = await fetch(`${API_BASE_URL}/admin/reports/summary`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      console.log('/admin/reports/summary:', data);

      if (!res.ok) {
        financialSummaryContainer.innerHTML =
          '<p>Gagal memuat laporan.</p>';
        return;
      }

      const fin = data.financial || {};
      const categories = data.categoryBreakdown || [];
      const status = data.campaignStatus || [];

      renderFinancialSummary(fin);
      renderCategoryBreakdown(categories);
      renderCampaignReport(status);
    } catch (err) {
      console.error('loadReport error:', err);
      financialSummaryContainer.innerHTML =
        '<p>Terjadi error saat memuat laporan.</p>';
    }
  }

  (async () => {
    const admin = await ensureAdmin();
    if (!admin) return;
    setupLogout();
    loadReport();
  })();
});
