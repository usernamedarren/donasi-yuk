document.addEventListener('DOMContentLoaded', () => {
  // ==============================
  // 1. Dummy Notifications (sementara)
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
    {
      status: "Badge Baru!",
      message: "Selamat! Anda mendapatkan Badge 'Dermawan Setia'.",
      type: "badge",
      time: "1 jam lalu",
      icon: "fas fa-medal",
      color: "#FFD700",
    },
    {
      status: "Peringatan",
      message:
        "Kampanye 'Bantu Korban Banjir' tinggal 2 hari lagi!",
      type: "new",
      time: "3 jam lalu",
      icon: "fas fa-exclamation-triangle",
      color: "var(--color-error)",
    },
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
  // 2. Menu Toggle (mobile)
  // ==============================
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active-menu");

      const icon = menuToggle.querySelector("i");
      if (!icon) return;

      if (navLinks.classList.contains("active-menu")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
      } else {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      }
    });
  }
});
