console.log('>> donasi/script.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000';

  const gridEl = document.getElementById('campaign-grid-full');
  const searchInput = document.getElementById('campaign-search');
  const categoryItems = document.querySelectorAll('.category-item');

  const notificationBell = document.getElementById('notification-bell');
  const notificationModal = document.getElementById('notificationModal');
  const closeNotifBtn = document.querySelector('.close-notif-btn');
  const notificationList = document.getElementById('notification-list');

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  const formatRupiah = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID');

  let allCampaigns = [];
  let currentCategory = 'all';
  let currentSearch = '';

  if (!gridEl) {
    console.error('#campaign-grid-full tidak ditemukan di DOM');
    return;
  }

  // ====== NOTIFIKASI DUMMY (optional) ======
  const DUMMY_NOTIFICATIONS = [
    {
      status: 'Kampanye Diterima',
      message: "Kampanye 'Pengadaan Air Bersih' Anda telah diverifikasi dan TAYANG!",
      time: 'Baru saja',
      icon: 'fas fa-check-circle',
      color: 'var(--color-secondary)',
    },
  ];

  const renderNotifications = () => {
    if (!notificationList) return;
    notificationList.innerHTML = DUMMY_NOTIFICATIONS.map(
      (n) => `
        <div class="notif-item">
          <i class="${n.icon} notif-icon" style="color:${n.color};"></i>
          <div class="notif-content">
            <span class="notif-title">${n.status}</span>
            <p>${n.message}</p>
            <span class="notif-time">${n.time}</span>
          </div>
        </div>
      `
    ).join('');
  };

  const toggleNotificationModal = () => {
    if (!notificationModal) return;
    if (notificationModal.style.display === 'block') {
      notificationModal.style.display = 'none';
    } else {
      renderNotifications();
      notificationModal.style.display = 'block';
    }
  };

  if (notificationBell) {
    notificationBell.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotificationModal();
    });
  }
  if (closeNotifBtn) {
    closeNotifBtn.addEventListener('click', () => {
      if (notificationModal) notificationModal.style.display = 'none';
    });
  }
  window.addEventListener('click', (e) => {
    if (
      notificationModal &&
      notificationModal.style.display === 'block' &&
      !e.target.closest('.user-profile-widget') &&
      !e.target.closest('.notification-modal-content')
    ) {
      notificationModal.style.display = 'none';
    }
  });

  // ====== MENU RESPONSIVE ======
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active-menu');
      const icon = menuToggle.querySelector('i');
      if (navLinks.classList.contains('active-menu')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
  }

  // ====== RENDER KAMPANYE ======
  function renderCampaigns() {
    let list = [...allCampaigns];

    // filter kategori (jika backend punya field category)
    if (currentCategory !== 'all') {
      list = list.filter(
        (c) => (c.category || '').toLowerCase() === currentCategory
      );
    }

    // filter search (judul / kategori)
    if (currentSearch.trim() !== '') {
      const keyword = currentSearch.toLowerCase();
      list = list.filter((c) => {
        const title = (c.title || '').toLowerCase();
        const category = (c.category || '').toLowerCase();
        return title.includes(keyword) || category.includes(keyword);
      });
    }

    if (list.length === 0) {
      gridEl.innerHTML = '<p>Tidak ada kampanye yang cocok.</p>';
      return;
    }

    gridEl.innerHTML = list
      .map((c) => {
        const collected = c.collectedAmount || 0;
        const goal = c.goalAmount || 1;
        const progress = Math.min((collected / goal) * 100, 100).toFixed(0);

        return `
          <div class="campaign-card">
            <img src="${c.image || '../assets/banjir.png'}"
                alt="${c.title}" class="card-image">
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
                DONASI SEKARANG
              </a>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // ====== LOAD dari BACKEND ======
  async function loadCampaigns() {
    gridEl.innerHTML = '<p>Memuat kampanye...</p>';

    try {
      console.log('Fetch kampanye (donasi) ke:', `${API_BASE_URL}/campaigns`);
      const res = await fetch(`${API_BASE_URL}/campaigns`);
      const data = await res.json();
      console.log('Data /campaigns di halaman Donasi =', data);

      if (!res.ok) {
        gridEl.innerHTML = '<p>Gagal memuat kampanye.</p>';
        return;
      }

      allCampaigns = data;
      if (allCampaigns.length === 0) {
        gridEl.innerHTML = '<p>Belum ada kampanye.</p>';
        return;
      }

      renderCampaigns();
    } catch (err) {
      console.error('Error fetch kampanye (donasi):', err);
      gridEl.innerHTML =
        '<p>Terjadi error saat memuat kampanye. Coba muat ulang.</p>';
    }
  }

  // ====== EVENT: KATEGORI ======
  categoryItems.forEach((item) => {
    item.addEventListener('click', () => {
      categoryItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      currentCategory = item.dataset.category || 'all';
      renderCampaigns();
    });
  });

  // ====== EVENT: SEARCH ======
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value || '';
      renderCampaigns();
    });
  }

  // START
  loadCampaigns();
});
