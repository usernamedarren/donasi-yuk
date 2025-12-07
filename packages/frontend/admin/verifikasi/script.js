// admin/verifikasi/script.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000';

  const listEl = document.getElementById('campaign-list');
  const detailEl = document.getElementById('campaign-detail-pane');
  const countEl = document.getElementById('campaign-count');
  const adminNameEl = document.getElementById('admin-name');

  let pendingCampaigns = [];
  let selectedId = null;

  const formatRupiah = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID');

  const formatDate = (str) => {
    if (!str) return '-';
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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
      alert('Anda harus login sebagai admin.');
      window.location.href = '../../login/index.html';
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      console.log('auth/me (verifikasi):', data);

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

  function renderList() {
    const list = pendingCampaigns;
    if (countEl) countEl.textContent = list.length;

    if (!list.length) {
      listEl.innerHTML = `
        <p style="text-align:center;color:var(--color-secondary);padding:20px;">
          <i class="fas fa-check-circle"></i>
          Semua kampanye sudah diverifikasi!
        </p>
      `;
      detailEl.innerHTML =
        '<div class="detail-placeholder">Tidak ada kampanye untuk ditinjau.</div>';
      return;
    }

    listEl.innerHTML = list
      .map(
        (c) => `
      <div class="campaign-item-card" data-id="${c.id}">
        <h4>${c.title}</h4>
        <p>Oleh: ${c.owner?.name || 'Penggalang Dana'}</p>
        <p style="margin-top:5px;">
          Diajukan: ${formatDate(c.createdAt)}
        </p>
      </div>
    `,
      )
      .join('');

    // klik pilih
    listEl.querySelectorAll('.campaign-item-card').forEach((el) => {
      el.addEventListener('click', () => {
        selectCampaign(el.dataset.id);
      });
    });

    if (!selectedId && list[0]) {
      selectCampaign(list[0].id);
    } else if (selectedId) {
      selectCampaign(selectedId);
    }
  }

  function renderDetail(c) {
    const desc = c.description || '';
    const parts = desc.split(/\n\s*\n/);
    const shortDesc = parts[0] || '-';
    const fullStory = parts.slice(1).join('\n\n') || shortDesc;

    detailEl.innerHTML = `
      <div class="detail-header">
        <h2>${c.title}</h2>
      </div>

      <div class="detail-section" style="padding-top:5px;padding-bottom:5px;">
        <p><strong>Status:</strong> Menunggu Verifikasi</p>
        <p><strong>Penggalang:</strong> ${c.owner?.name || 'Penggalang Dana'}</p>
      </div>
      
      <div class="detail-section">
        <h3>Informasi Utama</h3>
        <p><strong>Kategori:</strong> ${c.category || '-'}</p>
        <p><strong>Target Dana:</strong> ${formatRupiah(c.goalAmount)}</p>
        <p><strong>Dana Terkumpul:</strong> ${formatRupiah(
          c.collectedAmount || 0,
        )}</p>
        <p><strong>Diajukan Pada:</strong> ${formatDate(c.createdAt)}</p>
      </div>

      <div class="detail-section">
        <h3>Deskripsi & Narasi Lengkap</h3>
        <p><strong>Deskripsi Singkat:</strong> ${shortDesc}</p>
        <p style="margin-top:15px;">
          <strong>Narasi Lengkap:</strong><br>${fullStory}
        </p>
      </div>

      <div class="detail-section" style="border-left:5px solid var(--color-alert-warning);">
        <h3>Dokumentasi & Verifikasi (Catatan Admin)</h3>
        <p style="font-style:italic;color:var(--color-grey-dark);">
          Pastikan data penggalang dana dan tujuan kampanye sesuai dengan kebijakan DonasiYuk.
        </p>
      </div>

      <div class="action-buttons">
        <button class="btn-reject" id="btn-reject">
          <i class="fas fa-times"></i> TOLAK KAMPANYE
        </button>
        <button class="btn-approve" id="btn-approve">
          <i class="fas fa-check"></i> SETUJUI & TAYANGKAN
        </button>
      </div>
    `;

    document
      .getElementById('btn-approve')
      .addEventListener('click', handleApprove);
    document
      .getElementById('btn-reject')
      .addEventListener('click', handleReject);
  }

  function selectCampaign(id) {
    selectedId = id;

    document
      .querySelectorAll('.campaign-item-card')
      .forEach((el) => el.classList.remove('selected'));

    const activeEl = document.querySelector(
      `.campaign-item-card[data-id="${id}"]`,
    );
    if (activeEl) activeEl.classList.add('selected');

    const c = pendingCampaigns.find((x) => String(x.id) === String(id));
    if (c) {
      renderDetail(c);
    }
  }

  async function handleApprove() {
    const c = pendingCampaigns.find((x) => String(x.id) === String(selectedId));
    if (!c) return;
    if (
      !confirm(
        `Yakin ingin MENYETUJUI dan menayangkan kampanye "${c.title}"?`,
      )
    )
      return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/campaigns/${c.id}/approve`,
        {
          method: 'PATCH',
          headers: getHeaders(),
        },
      );
      const data = await res.json();
      console.log('approve resp:', data);

      if (!res.ok) {
        alert(data.message || 'Gagal menyetujui kampanye.');
        return;
      }

      alert('Kampanye berhasil disetujui dan tayang.');
      await loadCampaigns();
    } catch (err) {
      console.error('approve error:', err);
      alert('Terjadi kesalahan saat menyetujui kampanye.');
    }
  }

  async function handleReject() {
    const c = pendingCampaigns.find((x) => String(x.id) === String(selectedId));
    if (!c) return;

    const reason = prompt(
      `Yakin ingin MENOLAK kampanye "${c.title}"? Masukkan alasan penolakan:`,
    );
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Alasan penolakan tidak boleh kosong.');
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/campaigns/${c.id}/reject`,
        {
          method: 'PATCH',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        },
      );
      const data = await res.json();
      console.log('reject resp:', data);

      if (!res.ok) {
        alert(data.message || 'Gagal menolak kampanye.');
        return;
      }

      alert('Kampanye berhasil ditolak.');
      await loadCampaigns();
    } catch (err) {
      console.error('reject error:', err);
      alert('Terjadi kesalahan saat menolak kampanye.');
    }
  }

  async function loadCampaigns() {
    listEl.innerHTML =
      '<p style="text-align:center;padding:20px;">Memuat daftar kampanye...</p>';
    detailEl.innerHTML = '';

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/campaigns?status=PENDING`,
        { headers: getHeaders() },
      );
      const data = await res.json();
      console.log('/admin/campaigns?status=PENDING:', data);

      if (!res.ok) {
        listEl.innerHTML = '<p>Gagal memuat kampanye.</p>';
        return;
      }

      pendingCampaigns = Array.isArray(data) ? data : [];
      selectedId = null;
      renderList();
    } catch (err) {
      console.error('loadCampaigns error:', err);
      listEl.innerHTML =
        '<p>Terjadi error saat memuat kampanye. Coba muat ulang.</p>';
    }
  }

  (async () => {
    const admin = await ensureAdmin();
    if (!admin) return;
    setupLogout();
    loadCampaigns();
  })();
});
