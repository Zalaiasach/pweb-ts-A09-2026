interface LayarJenisAntrian {
  kode: string;
  nama: string;
  aktif: boolean;
  lastCounter: number;
}

interface LayarTiketAntrian {
  id: string;
  nomor: string;
  kodeJenis: string;
  prioritas: "Normal" | "Lansia" | "Disabilitas" | "VIP";
  status: "Menunggu" | "Dipanggil" | "Selesai" | "Dilewati";
  timestamp: number;
}

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEYS = {
    TOKEN: "auth_token",
    ROLE: "user_role",
    JENIS_ANTRIAN: "data_jenis_antrian",
    TIKET: "data_tiket_antrian",
  };

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const role = localStorage.getItem(STORAGE_KEYS.ROLE);

  if (!token || !role || !["admin", "moderator", "user"].includes(role)) {
    window.location.href = "login.html";
    return;
  }

  const daftarLayarEl = document.getElementById("daftar-layar") as HTMLElement;
  const emptyLayarEl = document.getElementById("empty-layar") as HTMLParagraphElement;
  const lastUpdateEl = document.getElementById("last-update") as HTMLSpanElement;
  const fullscreenBtn = document.getElementById("btn-fullscreen") as HTMLButtonElement;

  renderLayar();
  window.setInterval(renderLayar, 2500);

  fullscreenBtn.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenBtn.textContent = document.fullscreenElement ? "Keluar Fullscreen" : "Fullscreen";
  });

  function renderLayar() {
    const jenisList = getJenisAntrianList().filter((jenis) => jenis.aktif);
    const tiketList = getTiketList();

    daftarLayarEl.innerHTML = "";
    emptyLayarEl.hidden = jenisList.length > 0;

    jenisList.forEach((jenis) => {
      const tiketDipanggil = tiketList
        .filter((tiket) => tiket.kodeJenis === jenis.kode && tiket.status === "Dipanggil")
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      const waitingCount = tiketList.filter(
        (tiket) => tiket.kodeJenis === jenis.kode && tiket.status === "Menunggu"
      ).length;

      const card = document.createElement("article");
      card.className = "display-card";
      card.innerHTML = `
        <h2>${jenis.nama}</h2>
        <div class="called-number">${tiketDipanggil ? tiketDipanggil.nomor : "-"}</div>
        <div class="display-meta">
          <div>
            <span>Kode layanan</span>
            <strong>${jenis.kode}</strong>
          </div>
          <div>
            <span>Menunggu</span>
            <strong>${waitingCount}</strong>
          </div>
        </div>
      `;
      daftarLayarEl.appendChild(card);
    });

    lastUpdateEl.textContent = `Update ${new Date().toLocaleTimeString("id-ID")}`;
  }

  function getJenisAntrianList(): LayarJenisAntrian[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.JENIS_ANTRIAN) || "[]");
  }

  function getTiketList(): LayarTiketAntrian[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TIKET) || "[]");
  }
});
