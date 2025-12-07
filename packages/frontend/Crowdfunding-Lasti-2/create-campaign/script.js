document.addEventListener('DOMContentLoaded', () => {
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
  // 2. Form Create Campaign
  // ==============================
  const campaignForm = document.getElementById("campaign-form");
  const submitButton = document.getElementById("submit-button");
  const saveDraftButton = document.getElementById("save-draft-button");
  const categorySelect = document.getElementById("category");
  const imagePreview = document.getElementById("campaign-image-preview");
  const mainImageInput = document.getElementById("main-image");

  const CATEGORY_IMAGE_MAP = {
    Pendidikan: "../assets/pendidikan.png",
    "Air Bersih": "../assets/airbersih.png",
    Kesehatan: "../assets/kelaparan.png",
    "Komunitas Lokal": "../assets/banjir.png",
    Lingkungan: "../assets/lingkungan.png",
    Lainnya: "../assets/kasih.jpg",
  };

  const updateImagePreview = () => {
    if (!categorySelect || !imagePreview) return;
    const selectedCategory = categorySelect.value;
    const imagePath = CATEGORY_IMAGE_MAP[selectedCategory];

    if (imagePath) {
      imagePreview.src = imagePath;
      imagePreview.style.display = "block";
    } else {
      imagePreview.src = "";
      imagePreview.style.display = "none";
    }
  };

  if (categorySelect) {
    categorySelect.addEventListener("change", updateImagePreview);
  }

  if (mainImageInput && imagePreview) {
    mainImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = "block";
      } else if (!categorySelect || !categorySelect.value) {
        imagePreview.style.display = "none";
      } else {
        updateImagePreview();
      }
    });
  }

  // Set awal preview kategori
  updateImagePreview();

  // ------------------------------
  // Submit ke backend
  // ------------------------------
  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();

    const titleEl = document.getElementById("title");
    const goalEl = document.getElementById("goal");
    const deadlineEl = document.getElementById("deadline");
    const shortDescEl = document.getElementById("short-desc");
    const fullStoryEl = document.getElementById("full-story");
    const termsAgreeEl = document.getElementById("terms-agree");
    const verificationAgreeEl = document.getElementById("verification-agree");

    const campaignData = {
      title: titleEl ? titleEl.value.trim() : "",
      category: categorySelect ? categorySelect.value : "",
      goal: goalEl ? goalEl.value : "",
      deadline: deadlineEl ? deadlineEl.value : "",
      shortDesc: shortDescEl ? shortDescEl.value.trim() : "",
      fullStory: fullStoryEl ? fullStoryEl.value.trim() : "",
      mainImage:
        mainImageInput && mainImageInput.files[0]
          ? mainImageInput.files[0]
          : null,
      status: isDraft ? "Draft" : "Menunggu Verifikasi",
    };

    // Validasi basic
    if (!campaignData.title || !campaignData.category || !campaignData.goal) {
      alert("Judul, kategori, dan target dana wajib diisi.");
      return;
    }

    if (!isDraft) {
      if (!termsAgreeEl?.checked || !verificationAgreeEl?.checked) {
        alert("Mohon setujui semua persyaratan sebelum mengajukan verifikasi.");
        return;
      }

      if (parseInt(campaignData.goal, 10) < 5000000) {
        alert("Target Dana minimum adalah Rp 5.000.000.");
        return;
      }
    }

    // Pastikan user sudah login
    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("Silakan login terlebih dahulu sebelum membuat kampanye.");
      window.location.href = "../login/index.html";
      return;
    }

    // Payload sesuai backend
    const payload = {
      title: campaignData.title,
      description: `${campaignData.shortDesc}\n\n${campaignData.fullStory}`,
      goalAmount: Number(campaignData.goal),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/campaigns`, {
        method: "POST",
        headers:
          typeof getAuthHeaders === "function"
            ? getAuthHeaders()
            : {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("response /campaigns:", res.status, data);

      if (!res.ok) {
        alert(data.message || "Gagal membuat kampanye.");
        return;
      }

      const successMessage = isDraft
        ? "Kampanye Anda berhasil disimpan sebagai DRAFT (server saat ini tetap menyimpan sebagai PENDING)."
        : 'Pengajuan kampanye berhasil! Kampanye Anda kini berstatus "Menunggu Verifikasi" dan akan ditinjau oleh Admin.';

      alert(successMessage);
      window.location.href = "../kampanye/index.html";
    } catch (err) {
      console.error("Error POST /campaigns:", err);
      alert("Terjadi kesalahan saat mengirim kampanye ke server.");
    }
  };

  if (submitButton) {
    submitButton.addEventListener("click", (e) => handleSubmit(e, false));
  }

  if (saveDraftButton) {
    saveDraftButton.addEventListener("click", (e) => handleSubmit(e, true));
  }

  // ==============================
  // 3. Menu Toggle (mobile)
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
