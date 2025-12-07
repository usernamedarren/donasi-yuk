// kampanye/script.js – versi rapi sesuai UI front-end asli

let myCampaigns = [];
let currentStatusFilter = 'all'; // all | pending | active | completed

// ================= Utils =================
function formatRupiah(angka) {
  const num = Number(angka || 0);
  return num.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// status + label + class untuk badge
function mapStatusInfo(campaign) {
  const status = campaign.status;
  const collected = campaign.collectedAmount ?? 0;
  const target = campaign.goalAmount ?? 0;

  let label = status || '-';
  let pillClass = 'status-pill--default';
  let filterType = 'all';

  if (status === 'PENDING') {
    label = 'Menunggu verifikasi admin';
    pillClass = 'status-pill--pending';
    filterType = 'pending';
  } else if (status === 'REJECTED') {
    label = 'Ditolak admin';
    pillClass = 'status-pill--rejected';
    filterType = 'pending';
  } else if (status === 'PUBLISHED') {
    if (target > 0 && collected >= target) {
      label = 'Selesai';
      pillClass = 'status-pill--completed';
      filterType = 'completed';
    } else {
      label = 'Aktif';
      pillClass = 'status-pill--active';
      filterType = 'active';
    }
  }

  return { label, pillClass, filterType };
}

// ================= Stats (card di atas) =================
function renderStats() {
  const totalDonasiEl = document.getElementById('total-donasi');
  const totalKampanyeEl = document.getElementById('total-kampanye');
  const kategoriListEl = document.getElementById('kategori-list');

  const campaigns = myCampaigns || [];

  // total kampanye
  if (totalKampanyeEl) {
    totalKampanyeEl.textContent = campaigns.length.toString();
  }

  // total donasi (dari collectedAmount)
  const totalCollected = campaigns.reduce(
    (sum, c) => sum + (Number(c.collectedAmount) || 0),
    0,
  );
  if (totalDonasiEl) {
    totalDonasiEl.textContent = formatRupiah(totalCollected);
  }

  // kategori donasi (list <li> di dalam #kategori-list)
  if (kategoriListEl) {
    if (!campaigns.length) {
      kategoriListEl.innerHTML =
        '<li>Belum ada kampanye.</li>';
      return;
    }

    const byCategory = {};
    campaigns.forEach((c) => {
      const cat = c.category || 'Lainnya';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    kategoriListEl.innerHTML = Object.entries(byCategory)
      .map(
        ([cat, count]) =>
          `<li>${cat} &mdash; ${count} kampanye</li>`,
      )
      .join('');
  }
}

// ================= List Kampanye (card di bawah) =================
function renderCampaignGrid() {
  const grid = document.getElementById('campaign-grid');
  if (!grid) return;

  let campaigns = myCampaigns || [];

  // terapkan filter status (SEMUA, MENUNGGU, AKTIF, SELESAI)
  if (currentStatusFilter !== 'all') {
    campaigns = campaigns.filter((c) => {
      const info = mapStatusInfo(c);
      return info.filterType === currentStatusFilter;
    });
  }

  if (!campaigns.length) {
    grid.innerHTML =
      '<p>Belum ada kampanye untuk filter ini. Yuk buat kampanye baru!</p>';
    return;
  }

  grid.innerHTML = campaigns
    .map((c) => {
      const { label, pillClass } = mapStatusInfo(c);
      const collected = c.collectedAmount ?? 0;
      const target = c.goalAmount ?? 0;
      const progress =
        target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;

      const shortDesc =
        c.description && c.description.length > 90
          ? c.description.slice(0, 90) + '...'
          : c.description || '';

      return `
        <div class="campaign-card-user">
          <div class="card-content-user">
            
            <!-- Kotak status di atas judul -->
            <div class="campaign-status-row">
              <span class="campaign-status-box ${pillClass}">
                ${label}
              </span>
            </div>

            <h3 class="campaign-title-user">${c.title}</h3>
            <p class="description-user">${shortDesc}</p>

            <div class="progress-bar-user">
              <span style="width: ${progress}%;"></span>
            </div>

            <div class="progress-info-user">
              <span>${formatRupiah(collected)} terkumpul</span>
              <span>Target ${formatRupiah(target)} · ${progress}%</span>
            </div>

            <!-- Bagian bawah: tanggal + tombol -->
            <div class="campaign-meta-row">
              <span class="campaign-date">
                Dibuat: ${formatDate(c.createdAt)}
              </span>
              <a href="../detail-donasi/index.html?id=${c.id}" class="btn-outline">
                Lihat Detail
              </a>
            </div>

          </div>
        </div>
      `;
    })
    .join('');
}

// ================= Load dari Backend =================
async function loadMyCampaigns() {
  const grid = document.getElementById('campaign-grid');
  if (grid) {
    grid.innerHTML = '<p>Memuat kampanye Anda...</p>';
  }

  const token =
    typeof getAuthToken === 'function'
      ? getAuthToken()
      : typeof getToken === 'function'
      ? getToken()
      : localStorage.getItem('auth_token');

  if (!token) {
    window.location.href = '../login/index.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/campaigns/me`, {
      headers:
        typeof getAuthHeaders === 'function'
          ? getAuthHeaders()
          : {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
    });

    const data = await res.json();
    console.log('status /campaigns/me:', res.status, data);

    if (!res.ok) {
      if (grid) {
        grid.innerHTML =
          '<p>Gagal memuat kampanye Anda.</p>';
      }
      if (res.status === 401) {
        window.location.href = '../login/index.html';
      }
      return;
    }

    myCampaigns = Array.isArray(data) ? data : [];
    renderStats();
    renderCampaignGrid();
  } catch (err) {
    console.error('Error loadMyCampaigns:', err);
    if (grid) {
      grid.innerHTML =
        '<p>Terjadi kesalahan saat memuat kampanye.</p>';
    }
  }
}

// ================= Filter Buttons =================
function initStatusFilters() {
  const container = document.querySelector('.status-filters');
  if (!container) return;

  const buttons = container.querySelectorAll('.filter-btn');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      currentStatusFilter = btn.dataset.status || 'all';
      renderCampaignGrid();
    });
  });
}

// ================= Init =================
function initCampaignDashboardPage() {
  initStatusFilters();
  loadMyCampaigns();
  renderDonationChart(); // ✅ INI YANG PENTING UNTUK GRAFIK

  const createBtn = document.getElementById('btn-create-campaign');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      window.location.href = '../create-campaign/index.html';
    });
  }
}


document.addEventListener('DOMContentLoaded', initCampaignDashboardPage);

// ================= Chart Donasi =================
let donationChart = null;

function renderDonationChart() {
  const canvas = document.getElementById('donationChart');
  if (!canvas) {
    console.warn('Canvas donationChart tidak ditemukan');
    return;
  }

  const ctx = canvas.getContext('2d');

  // Contoh data dummy (nanti bisa dari backend)
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'];
  const data = [200000, 500000, 800000, 700000, 1200000, 450000, 900000];

  if (donationChart) {
    donationChart.destroy();
  }

  donationChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Donasi (Rp)',
          data,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

