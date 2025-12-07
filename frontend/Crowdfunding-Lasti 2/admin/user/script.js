// admin/user/script.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000';

  const tableBody = document.getElementById('user-table-body');
  const totalUserCount = document.getElementById('total-user-count');
  const adminNameEl = document.getElementById('admin-name');

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
      console.log('auth/me (user admin):', data);

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

  async function loadUsers() {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">Memuat data user...</td>
      </tr>
    `;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      console.log('/admin/users:', data);

      if (!res.ok) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6">Gagal memuat data user.</td>
          </tr>
        `;
        return;
      }

      const users = Array.isArray(data) ? data : [];
      totalUserCount.textContent = users.length;

      if (!users.length) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6">Belum ada user terdaftar.</td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = users
        .map((u) => {
          const statusClass =
            u.status === 'Suspended'
              ? 'status-suspended'
              : 'status-active';
          return `
            <tr>
              <td>${u.id}</td>
              <td>${u.name || '-'}</td>
              <td>${u.email}</td>
              <td>${u.role}</td>
              <td><span class="${statusClass}">${u.status}</span></td>
              <td>-</td>
            </tr>
          `;
        })
        .join('');
    } catch (err) {
      console.error('loadUsers error:', err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="6">Terjadi error saat memuat user.</td>
        </tr>
      `;
    }
  }

  (async () => {
    const admin = await ensureAdmin();
    if (!admin) return;
    setupLogout();
    loadUsers();
  })();
});
