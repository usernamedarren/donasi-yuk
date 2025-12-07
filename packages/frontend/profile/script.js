// profile/script.js

// ========= State =========
let currentUser = null;
let currentBadges = [];
let volunteerRewards = [];

// ========= Utils =========
function mapCampaignStatusDisplay(campaign) {
  const status = campaign.status;
  const collected = campaign.collectedAmount ?? 0;
  const target = campaign.goalAmount ?? 0;

  if (status === 'PENDING') {
    return 'Menunggu verifikasi admin';
  }

  if (status === 'REJECTED') {
    return 'Ditolak admin';
  }

  if (status === 'PUBLISHED') {
    if (target > 0 && collected >= target) {
      return 'Selesai';
    }
    return 'Aktif';
  }

  // fallback kalau ada status aneh
  return status;
}

async function loadMyCampaigns() {
  const listEl = document.getElementById('my-campaign-list');
  if (!listEl) return;

  listEl.innerHTML = '<p>Memuat kampanye...</p>';

  try {
    const res = await fetch(`${API_BASE_URL}/campaigns/me`, {
      headers: getAuthHeaders(),
    });
    console.log('status /campaigns/me:', res.status);
    const data = await res.json();
    console.log('response /campaigns/me:', data);

    if (!res.ok) {
      listEl.innerHTML = '<p>Gagal memuat kampanye.</p>';
      return;
    }

    const campaigns = Array.isArray(data) ? data : [];

    if (!campaigns.length) {
      listEl.innerHTML =
        '<p>Belum ada kampanye yang Anda buat.</p>';
      return;
    }

    listEl.innerHTML = campaigns
      .map((c) => {
        const collected = c.collectedAmount ?? 0;
        const target = c.goalAmount ?? 0;
        const progress =
          target > 0
            ? Math.min(100, Math.round((collected / target) * 100))
            : 0;

        const statusLabel = mapCampaignStatusDisplay(c);

        return `
          <div class="history-item-row">
            <div>
              <strong>${c.title}</strong>
              <p class="text-secondary">
                Status: <strong>${statusLabel}</strong><br>
                Terkumpul: ${formatRupiah(collected)} dari ${formatRupiah(
          target,
        )} (${progress}%)
              </p>
            </div>
            <span class="history-date">${formatDate(c.createdAt)}</span>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    console.error('Error loadMyCampaigns:', err);
    listEl.innerHTML =
      '<p>Terjadi error saat memuat kampanye.</p>';
  }
}

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

// ========= Render User Info =========
function renderUserInfo() {
  if (!currentUser) return;

  const nameHeaderEl = document.getElementById('profile-name');
  const handleEl = document.getElementById('profile-handle');

  const infoNameEl = document.getElementById('info-name');
  const infoEmailEl = document.getElementById('info-email');
  const infoJoinDateEl = document.getElementById('info-join-date');
  const infoPointsEl = document.getElementById('info-points');

  if (nameHeaderEl) nameHeaderEl.textContent = currentUser.name || '-';

  if (handleEl) {
    const base =
      (currentUser.name && currentUser.name.split(' ')[0]) ||
      (currentUser.email && currentUser.email.split('@')[0]) ||
      'user';
    handleEl.textContent = `@${base}`;
  }

  if (infoNameEl) infoNameEl.textContent = currentUser.name || '-';
  if (infoEmailEl) infoEmailEl.textContent = currentUser.email || '-';
  if (infoJoinDateEl) infoJoinDateEl.textContent = formatDate(
    currentUser.createdAt,
  );
  if (infoPointsEl) {
    const pts = currentUser.totalPoints ?? 0;
    infoPointsEl.textContent = `${pts} poin`;
  }
}

// ========= Load User Profile (/auth/me) =========
async function loadUserProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    console.log('status /auth/me:', res.status, data);

    if (!res.ok) {
      window.location.href = '../login/index.html';
      return;
    }

    currentUser = data;
    renderUserInfo();
  } catch (err) {
    console.error('Error loadUserProfile:', err);
  }
}

// ========= Donasi (total, kampanye didukung, riwayat) =========
async function loadDonationHistory() {
  const historyListEl = document.getElementById('history-list');
  const totalDonationsEl = document.getElementById('total-donations');
  const campaignsSupportedEl = document.getElementById('campaigns-supported');

  if (historyListEl) {
    historyListEl.innerHTML =
      '<div class="history-item-row"><span>Memuat...</span></div>';
  }

  try {
    const res = await fetch(`${API_BASE_URL}/donations/me`, {
      headers: getAuthHeaders(),
    });
    console.log('status /donations/me:', res.status);
    const data = await res.json();
    console.log('response /donations/me:', data);

    const donations = Array.isArray(data) ? data : [];

    if (!donations.length) {
      if (historyListEl) {
        historyListEl.innerHTML =
          '<div class="history-item-row"><span>Belum ada donasi. Yuk mulai berdonasi!</span></div>';
      }
      if (totalDonationsEl) totalDonationsEl.textContent = 'Rp 0';
      if (campaignsSupportedEl) campaignsSupportedEl.textContent = '0';
      return;
    }

    let totalAmount = 0;
    const campaignSet = new Set();

    donations.forEach((d) => {
      const amount = d.amount ?? d.nominal ?? 0;
      totalAmount += Number(amount) || 0;

      if (d.campaignId) campaignSet.add(d.campaignId);
      else if (d.campaign?.id) campaignSet.add(d.campaign.id);
    });

    if (totalDonationsEl)
      totalDonationsEl.textContent = formatRupiah(totalAmount);
    if (campaignsSupportedEl)
      campaignsSupportedEl.textContent = String(campaignSet.size);

    if (historyListEl) {
      const topDonations = donations.slice(0, 5);
      historyListEl.innerHTML = topDonations
        .map(
          (d) => `
          <div class="history-item-row">
            <span class="history-campaign-title">${d.campaign?.title || 'Kampanye'}</span>
            <span class="history-date">${formatDate(d.createdAt)}</span>
            <span class="history-amount">${formatRupiah(
              d.amount ?? d.nominal ?? 0,
            )}</span>
          </div>
        `,
        )
        .join('');
    }
  } catch (err) {
    console.error('Error loadDonationHistory:', err);
    if (historyListEl) {
      historyListEl.innerHTML =
        '<div class="history-item-row"><span>Terjadi error saat memuat riwayat donasi.</span></div>';
    }
    if (totalDonationsEl) totalDonationsEl.textContent = 'Rp 0';
    if (campaignsSupportedEl) campaignsSupportedEl.textContent = '0';
  }
}

// ========= Badges =========
function renderBadges() {
  const badgeListEl = document.getElementById('badge-list');
  const badgesCollectedEl = document.getElementById('badges-collected');
  const redeemableBadgesEl = document.getElementById('redeemable-badges');
  const openRedeemBtn = document.getElementById('open-redeem-modal');

  const count = currentBadges.length || 0;

  if (badgesCollectedEl) badgesCollectedEl.textContent = String(count);
  if (redeemableBadgesEl) redeemableBadgesEl.textContent = String(count);

  if (openRedeemBtn) {
    openRedeemBtn.disabled = count === 0;
  }

  if (!badgeListEl) return;

  if (!count) {
    badgeListEl.innerHTML =
      '<p>Belum ada badge. Yuk terus berdonasi untuk mendapatkan badge pertama kamu!</p>';
    return;
  }

  badgeListEl.innerHTML = currentBadges
    .map(
      (b) => `
      <div class="badge-item">
        <div class="badge-icon">🏅</div>
        <div class="badge-info">
          <strong>${b.name}</strong>
          <p>${b.description || ''}</p>
        </div>
      </div>
    `,
    )
    .join('');
}

async function loadBadgesFromBackend() {
  try {
    const res = await fetch(`${API_BASE_URL}/user/badges`, {
      headers: getAuthHeaders(),
    });
    console.log('status /user/badges:', res.status);
    const data = await res.json();
    console.log('response /user/badges:', data);

    if (!res.ok) {
      currentBadges = [];
      renderBadges();
      return;
    }

    currentBadges = Array.isArray(data) ? data : [];
    renderBadges();
  } catch (err) {
    console.error('Error loadBadgesFromBackend:', err);
    currentBadges = [];
    renderBadges();
  }
}

// ========= Volunteer Rewards =========
async function loadVolunteerRewards() {
  try {
    const res = await fetch(`${API_BASE_URL}/rewards/volunteer`);
    console.log('status /rewards/volunteer:', res.status);
    const data = await res.json();
    console.log('response /rewards/volunteer:', data);

    if (!res.ok) {
      volunteerRewards = [];
      return;
    }

    volunteerRewards = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error loadVolunteerRewards:', err);
    volunteerRewards = [];
  }
}

function renderVolunteerRewardsModal() {
  const listEl = document.getElementById('volunteer-reward-list');
  const badgeCountEl = document.getElementById('modal-badge-count');
  if (badgeCountEl) {
    badgeCountEl.textContent = String(currentBadges.length || 0);
  }
  if (!listEl) return;

  if (!volunteerRewards.length) {
    listEl.innerHTML =
      '<p>Belum ada kampanye volunteer yang tersedia saat ini.</p>';
    return;
  }

  listEl.innerHTML = volunteerRewards
    .map((r) => {
      const title = r.name || 'Kampanye Volunteer';
      const desc =
        r.description || 'Reward badge relawan untuk kegiatan volunteer.';
      const cost = r.costPoints ?? r.cost ?? 0;

      return `
        <div class="volunteer-item-row">
          <div class="volunteer-info">
            <strong>${title}</strong>
            <p>${desc}</p>
            <p>Biaya: ${cost} poin</p>
          </div>
          <button
            class="btn-primary btn-redeem-reward"
            data-reward-id="${r.id}"
          >
            Tukar &amp; Daftar
          </button>
        </div>
      `;
    })
    .join('');
}

// ========= Modal Volunteer =========
function openRedeemModal() {
  const modal = document.getElementById('redeemModal');
  if (!modal) return;
  renderVolunteerRewardsModal();
  modal.style.display = 'block';
}

function closeRedeemModal() {
  const modal = document.getElementById('redeemModal');
  if (!modal) return;
  modal.style.display = 'none';
}

// ========= Redeem Reward =========
async function handleRedeemClick(e) {
  const btn = e.target;
  const rewardId = btn.dataset.rewardId;
  if (!rewardId) return;

  if (!confirm('Yakin ingin menukar poin untuk reward ini?')) return;

  try {
    const res = await fetch(`${API_BASE_URL}/rewards/redeem`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rewardId: Number(rewardId) }),
    });

    const data = await res.json();
    console.log('response /rewards/redeem:', res.status, data);

    if (!res.ok) {
      alert(data.message || 'Gagal menukar reward.');
      return;
    }

    alert(data.message || 'Berhasil menukar reward.');

    // refresh data setelah redeem
    await loadUserProfile();
    await loadBadgesFromBackend();
    await loadVolunteerRewards();
    await loadVolunteerHistory();
    renderVolunteerRewardsModal();
    closeRedeemModal();
  } catch (err) {
    console.error('Error redeem reward:', err);
    alert('Terjadi kesalahan saat menukar reward.');
  }
}

// ========= Volunteer History =========
async function loadVolunteerHistory() {
  const listEl = document.getElementById('volunteer-history-list');
  if (!listEl) return;

  listEl.innerHTML = '<p>Memuat riwayat volunteer...</p>';

  try {
    const res = await fetch(`${API_BASE_URL}/rewards/redemptions/me`, {
      headers: getAuthHeaders(),
    });
    console.log('status /rewards/redemptions/me:', res.status);
    const data = await res.json();
    console.log('response /rewards/redemptions/me:', data);

    if (!res.ok) {
      listEl.innerHTML = '<p>Gagal memuat riwayat volunteer.</p>';
      return;
    }

    const redemptions = Array.isArray(data) ? data : [];

    if (!redemptions.length) {
      listEl.innerHTML = '<p>Belum ada pendaftaran volunteer.</p>';
      return;
    }

    listEl.innerHTML = redemptions
      .map((r) => {
        const reward = r.reward || {};
        const title = reward.name || 'Program Volunteer';
        const desc = reward.description || 'Kegiatan volunteer';
        const status = r.status || 'PENDING';

        return `
          <div class="history-item-row">
            <div>
              <strong>${title}</strong>
              <p class="text-secondary">${desc}</p>
            </div>
            <span class="history-date">${formatDate(r.createdAt)}</span>
            <span class="history-amount">
              ${status === 'PENDING' ? 'Menunggu konfirmasi' : status}
            </span>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    console.error('Error loadVolunteerHistory:', err);
    listEl.innerHTML =
      '<p>Terjadi error saat memuat riwayat volunteer.</p>';
  }
}

// ========= Init & Event Listeners =========
function initProfilePage() {
  // ambil token dengan cara yang kompatibel dengan global/api.js
  const token =
    typeof getAuthToken === 'function'
      ? getAuthToken()
      : typeof getToken === 'function'
      ? getToken()
      : localStorage.getItem('auth_token');

  if (!token) {
    // belum login
    window.location.href = '../login/index.html';
    return;
  }

  // tombol logout (pakai clearAuth kalau ada)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (typeof clearAuth === 'function') {
        clearAuth();
      } else {
        // fallback kalau clearAuth nggak ada
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }

      window.location.href = '../login/index.html';
    });
  }

  // click di luar modal
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('redeemModal');
    if (modal && e.target === modal) {
      closeRedeemModal();
    }
  });

  // buka modal volunteer
  const openRedeemBtn = document.getElementById('open-redeem-modal');
  if (openRedeemBtn) {
    openRedeemBtn.addEventListener('click', openRedeemModal);
  }

  // close modal (tanda X)
  const closeBtn = document.querySelector('#redeemModal .close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeRedeemModal);
  }

  // delegasi tombol Redeem
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-redeem-reward')) {
      handleRedeemClick(e);
    }
  });

  // load data awal
  loadUserProfile();
  loadBadgesFromBackend();
  loadDonationHistory();
  loadVolunteerRewards();
  loadVolunteerHistory();
  loadMyCampaigns();
}

  // delegasi tombol Redeem
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-redeem-reward')) {
      handleRedeemClick(e);
    }
  });

  // load data awal
  loadUserProfile();
  loadBadgesFromBackend();
  loadDonationHistory();
  loadVolunteerRewards();
  loadVolunteerHistory();
  loadMyCampaigns();

function initLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();

    try {
      // Sesuaikan dengan STORAGE_KEYS di global/api.js
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } catch (err) {
      console.error('Error clearing auth storage:', err);
    }

    window.location.href = '../login/index.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProfilePage();    // yang lama, untuk load profil & badge
  initLogoutButton();   // ⬅️ tambahkan ini
});