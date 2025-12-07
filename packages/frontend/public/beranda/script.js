document.addEventListener('DOMContentLoaded', () => {
  // ❗ Catatan:
  // Jangan set .username dan .user-handle di sini.
  // global/api.js akan otomatis mengisi berdasarkan auth_user.

  // ==============================
  // 1. Dummy Notifications (kalau ada)
  // ==============================
  const DUMMY_NOTIFICATIONS = [
    {
      status: "Kampanye Diterima",
      message:
        "Kampanye 'Pengadaan Air Bersih' Anda telah diverifikasi dan TAYANG!",
      type: "verified",
      time: "Baru saja",
      icon: "fas fa-check-circle",
      color: "var(--color-secondary)",
    },
    // dst kalau kamu punya
  ];

  const notificationBell = document.getElementById("notification-bell");
  const notificationModal = document.getElementById("notificationModal");
  const closeNotifBtn = document.querySelector(".close-notif-btn");
  const notificationList = document.getElementById("notification-list");

  const closeNotificationModal = () => {
    if (notificationModal) notificationModal.style.display = "none";
  };

  const renderNotifications = () => {
    if (!notificationList) return;
    notificationList.innerHTML = DUMMY_NOTIFICATIONS.map(
      (notif) => `
        <div class="notif-item">
          <i class="${notif.icon} notif-icon" style="color: ${notif.color};"></i>
          <div class="notif-content">
            <span class="notif-title">${notif.status}</span>
            <p>${notif.message}</p>
            <span class="notif-time">${notif.time}</span>
          </div>
        </div>
      `
    ).join("");
  };

  const toggleNotificationModal = () => {
    if (!notificationModal) return;
    if (notificationModal.style.display === "block") {
      closeNotificationModal();
    } else {
      renderNotifications();
      notificationModal.style.display = "block";
    }
  };

  if (notificationBell) {
    notificationBell.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleNotificationModal();
    });
  }

  if (closeNotifBtn) {
    closeNotifBtn.addEventListener("click", closeNotificationModal);
  }

  window.addEventListener("click", (e) => {
    if (
      notificationModal &&
      notificationModal.style.display === "block" &&
      !e.target.closest(".user-profile-widget") &&
      !e.target.closest(".notification-modal-content")
    ) {
      notificationModal.style.display = "none";
    }
  });

  // ==============================
  // 2. Fetch kampanye untuk beranda (kalau backend sudah siap)
  // ==============================
  const campaignListEl = document.getElementById('campaign-list'); // sesuaikan id-nya

  const loadCampaigns = async () => {
    if (!campaignListEl) return;

    try {
      const res = await fetch(`${API_BASE_URL}/campaigns/public`);
      const data = await res.json();

      if (!res.ok) {
        console.error('Gagal mengambil kampanye:', data);
        return;
      }

      if (!Array.isArray(data)) {
        console.error('Response /campaigns/public bukan array:', data);
        return;
      }

      campaignListEl.innerHTML = data
        .map(
          (c) => `
        <div class="campaign-card">
          <img src="../assets/pendidikan.png" alt="${c.title}" />
          <h3>${c.title}</h3>
          <p>${c.description?.slice(0, 100) || ''}...</p>
          <div class="campaign-progress">
            <span>Terkumpul: Rp ${c.collectedAmount || 0}</span>
            <span>Target: Rp ${c.goalAmount}</span>
          </div>
          <a href="../detail-donasi/index.html?id=${c.id}" class="btn-primary">
            Lihat Kampanye
          </a>
        </div>
        `
        )
        .join('');
    } catch (err) {
      console.error('Error fetch /campaigns/public:', err);
    }
  };

  loadCampaigns();

  // ==============================
  // 3. Menu Toggle (mobile)
  // ==============================
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active-menu');

      const icon = menuToggle.querySelector('i');
      if (!icon) return;

      if (navLinks.classList.contains('active-menu')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
  }
});

// ==== KAMPANYE TERBARU DI BERANDA (pakai data yang sama dengan DONASI) ====
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000';
  const gridEl = document.getElementById('home-campaign-grid');
  if (!gridEl) return;

  const formatRupiah = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID');

  async function loadLatestCampaigns() {
    gridEl.innerHTML = '<p>Memuat kampanye terbaru...</p>';

    try {
      // ⬅️ sama dengan halaman donasi
      const res = await fetch(`${API_BASE_URL}/campaigns`);
      const data = await res.json();
      console.log('Data /campaigns (beranda) =', data);

      if (!res.ok) {
        gridEl.innerHTML = '<p>Gagal memuat kampanye.</p>';
        return;
      }

      let campaigns = Array.isArray(data) ? data : [];

      // urutkan terbaru
      campaigns.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // ambil maksimal 6 kampanye terbaru (biar slider-nya keisi)
      campaigns = campaigns.slice(0, 6);

      if (!campaigns.length) {
        gridEl.innerHTML = '<p>Belum ada kampanye.</p>';
        return;
      }

      gridEl.innerHTML = campaigns
        .map((c) => {
          const collected = c.collectedAmount || 0;
          const goal = c.goalAmount || 1;
          const progress = Math.min(
            (collected / goal) * 100,
            100
          ).toFixed(0);

          return `
            <div class="campaign-card">
              <img
                src="${c.image || '../assets/banjir.png'}"
                alt="${c.title}"
                class="card-image"
              >
              <div class="card-content">
                <h3>${c.title}</h3>
                <p class="organization">
                  Oleh: ${c.owner?.name || 'Organisasi Donasi'}
                </p>

                <div class="progress-bar small">
                  <span style="width:${progress}%;"></span>
                </div>

                <div class="progress-info">
                  <p>Terkumpul:
                    <strong>${formatRupiah(collected)}</strong>
                  </p>
                  <p>Target:
                    <strong>${formatRupiah(goal)}</strong>
                  </p>
                </div>

                <a href="../detail-donasi/index.html?id=${c.id}"
                   class="btn-donasi-sekarang">
                  Donasi Sekarang
                </a>
              </div>
            </div>
          `;
        })
        .join('');
    } catch (err) {
      console.error('Error fetch kampanye (beranda):', err);
      gridEl.innerHTML =
        '<p>Terjadi error saat memuat kampanye.</p>';
    }
  }

  loadLatestCampaigns();
});
