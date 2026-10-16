interface OperatorJenisAntrian {
  kode: string;
  nama: string;
  aktif: boolean;
  lastCounter: number;
}

interface OperatorTiketAntrian {
  id: string;
  nomor: string;
  kodeJenis: string;
  prioritas: "Normal" | "Lansia" | "Disabilitas" | "VIP";
  status: "Menunggu" | "Dipanggil" | "Selesai" | "Dilewati";
  timestamp: number;
}

const OPERATOR_STORAGE_KEYS = {
  TOKEN: "auth_token",
  ROLE: "user_role",
  NAME: "firstName",
  JENIS_ANTRIAN: "data_jenis_antrian",
  TIKET: "data_tiket_antrian",
};

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem(OPERATOR_STORAGE_KEYS.TOKEN);
  const role = localStorage.getItem(OPERATOR_STORAGE_KEYS.ROLE);
  const firstName = localStorage.getItem(OPERATOR_STORAGE_KEYS.NAME) || "Operator";

  if (!token || !role) {
    window.location.href = "login.html";
    return;
  }

  if (role !== "admin" && role !== "moderator") {
    window.location.href = "ambil-antrian.html";
    return;
  }

  const infoUserEl = document.getElementById("info-user") as HTMLSpanElement;
  const panelLayananEl = document.getElementById("daftar-panel-layanan") as HTMLElement;
  const emptyOperatorEl = document.getElementById("empty-operator") as HTMLParagraphElement;
  const logoutBtn = document.getElementById("btn-logout") as HTMLButtonElement;

  infoUserEl.textContent = `${firstName} (${role.toUpperCase()})`;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(OPERATOR_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(OPERATOR_STORAGE_KEYS.ROLE);
    localStorage.removeItem(OPERATOR_STORAGE_KEYS.NAME);
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });

  renderOperator();
  window.setInterval(renderOperator, 2500);
  window.addEventListener("storage", (event: StorageEvent) => {
    if (
      event.key === OPERATOR_STORAGE_KEYS.JENIS_ANTRIAN ||
      event.key === OPERATOR_STORAGE_KEYS.TIKET
    ) {
      renderOperator();
    }
  });

  function renderOperator() {
    const jenisAktif = getJenisAntrianList().filter((jenis) => jenis.aktif);
    const tiketList = getTiketList();

    panelLayananEl.innerHTML = "";
    emptyOperatorEl.hidden = jenisAktif.length > 0;

    jenisAktif.forEach((jenis) => {
      const tiketDipanggil = getTiketDipanggil(tiketList, jenis.kode);
      const tiketBerikutnya = getTiketBerikutnya(tiketList, jenis.kode);
      const waitingCount = tiketList.filter(
        (tiket) => tiket.kodeJenis === jenis.kode && tiket.status === "Menunggu"
      ).length;

      const card = document.createElement("article");
      card.className = "kartu-layanan";
      card.innerHTML = `
        <div class="kartu-header">
          <div>
            <h2>${jenis.nama}</h2>
            <span>Kode ${jenis.kode}</span>
          </div>
          <strong>${waitingCount} menunggu</strong>
        </div>

        <div class="status-grid">
          <div class="kartu kartu-aktif">
            <h3>Sedang Dipanggil</h3>
            <div class="nomor">${tiketDipanggil ? tiketDipanggil.nomor : "-"}</div>
            <div class="detail">${tiketDipanggil ? tiketDipanggil.prioritas : "Tidak ada panggilan"}</div>
          </div>

          <div class="kartu">
            <h3>Nomor Berikutnya</h3>
            <div class="nomor kecil">${tiketBerikutnya ? tiketBerikutnya.nomor : "-"}</div>
            <div class="detail">${tiketBerikutnya ? tiketBerikutnya.prioritas : "Antrian kosong"}</div>
          </div>
        </div>

        <div class="aksi">
          <button type="button" class="btn-panggil" data-kode="${jenis.kode}" ${tiketBerikutnya ? "" : "disabled"}>
            Panggil Berikutnya
          </button>
          <button type="button" class="btn-lewati" data-kode="${jenis.kode}" ${tiketDipanggil ? "" : "disabled"}>
            Lewati
          </button>
          <button type="button" class="btn-selesai" data-kode="${jenis.kode}" ${tiketDipanggil ? "" : "disabled"}>
            Selesai
          </button>
        </div>

        <table class="tabel-antrian">
          <thead>
            <tr>
              <th>No. Tiket</th>
              <th>Prioritas</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${renderTiketRows(tiketList, jenis.kode)}
          </tbody>
        </table>
      `;

      panelLayananEl.appendChild(card);
    });

    attachActionListeners();
  }

  function renderTiketRows(tiketList: OperatorTiketAntrian[], kodeJenis: string) {
    const items = tiketList
      .filter((tiket) => tiket.kodeJenis === kodeJenis && tiket.status !== "Selesai")
      .sort((a, b) => {
        if (a.status === "Dipanggil" && b.status !== "Dipanggil") return -1;
        if (b.status === "Dipanggil" && a.status !== "Dipanggil") return 1;
        if (a.status === "Menunggu" && b.status !== "Menunggu") return -1;
        if (b.status === "Menunggu" && a.status !== "Menunggu") return 1;
        return a.timestamp - b.timestamp;
      });

    if (items.length === 0) {
      return `<tr><td colspan="3" class="empty-cell">Belum ada tiket.</td></tr>`;
    }

    return items
      .map(
        (tiket) => `
          <tr class="${tiket.status === "Dipanggil" ? "baris-aktif" : ""}">
            <td>${tiket.nomor}</td>
            <td>${tiket.prioritas}</td>
            <td>${tiket.status}</td>
          </tr>
        `
      )
      .join("");
  }

  function attachActionListeners() {
    document.querySelectorAll(".btn-panggil").forEach((button) => {
      button.addEventListener("click", (event) => {
        const kode = (event.currentTarget as HTMLButtonElement).dataset.kode;
        if (kode) panggilBerikutnya(kode);
      });
    });

    document.querySelectorAll(".btn-lewati").forEach((button) => {
      button.addEventListener("click", (event) => {
        const kode = (event.currentTarget as HTMLButtonElement).dataset.kode;
        if (kode) ubahStatusAktif(kode, "Dilewati");
      });
    });

    document.querySelectorAll(".btn-selesai").forEach((button) => {
      button.addEventListener("click", (event) => {
        const kode = (event.currentTarget as HTMLButtonElement).dataset.kode;
        if (kode) ubahStatusAktif(kode, "Selesai");
      });
    });
  }

  function panggilBerikutnya(kodeJenis: string) {
    const tiketList = getTiketList();
    const tiketAktif = getTiketDipanggil(tiketList, kodeJenis);
    const tiketBerikutnya = getTiketBerikutnya(tiketList, kodeJenis);

    if (tiketAktif) {
      tiketAktif.status = "Selesai";
    }

    if (tiketBerikutnya) {
      tiketBerikutnya.status = "Dipanggil";
    }

    saveTiket(tiketList);
    renderOperator();
  }

  function ubahStatusAktif(kodeJenis: string, status: "Selesai" | "Dilewati") {
    const tiketList = getTiketList();
    const tiketAktif = getTiketDipanggil(tiketList, kodeJenis);

    if (tiketAktif) {
      tiketAktif.status = status;
      saveTiket(tiketList);
      renderOperator();
    }
  }

  function getTiketDipanggil(tiketList: OperatorTiketAntrian[], kodeJenis: string) {
    return tiketList
      .filter((tiket) => tiket.kodeJenis === kodeJenis && tiket.status === "Dipanggil")
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  function getTiketBerikutnya(tiketList: OperatorTiketAntrian[], kodeJenis: string) {
    return tiketList
      .filter((tiket) => tiket.kodeJenis === kodeJenis && tiket.status === "Menunggu")
      .sort((a, b) => {
        const priorityDiff = getPriorityWeight(a.prioritas) - getPriorityWeight(b.prioritas);
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      })[0];
  }

  function getPriorityWeight(prioritas: OperatorTiketAntrian["prioritas"]) {
    return prioritas === "Normal" ? 2 : 1;
  }

  function getJenisAntrianList(): OperatorJenisAntrian[] {
    return JSON.parse(localStorage.getItem(OPERATOR_STORAGE_KEYS.JENIS_ANTRIAN) || "[]");
  }

  function getTiketList(): OperatorTiketAntrian[] {
    return JSON.parse(localStorage.getItem(OPERATOR_STORAGE_KEYS.TIKET) || "[]");
  }

  function saveTiket(tiketList: OperatorTiketAntrian[]) {
    localStorage.setItem(OPERATOR_STORAGE_KEYS.TIKET, JSON.stringify(tiketList));
  }
});
