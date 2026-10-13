interface AmbilJenisAntrian {
  kode: string;
  nama: string;
  aktif: boolean;
  lastCounter: number;
}

interface AmbilTiketAntrian {
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
    NAME: "firstName",
    JENIS_ANTRIAN: "data_jenis_antrian",
    TIKET: "data_tiket_antrian",
  };

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const role = localStorage.getItem(STORAGE_KEYS.ROLE);
  const firstName = localStorage.getItem(STORAGE_KEYS.NAME) || "User";

  if (!token || !role || !["admin", "moderator", "user"].includes(role)) {
    window.location.href = "login.html";
    return;
  }

  const userInfoEl = document.getElementById("user-info") as HTMLSpanElement;
  const daftarLayananEl = document.getElementById("daftar-layanan") as HTMLDivElement;
  const emptyLayananEl = document.getElementById("empty-layanan") as HTMLParagraphElement;
  const selectLayanan = document.getElementById("select-layanan") as HTMLSelectElement;
  const selectPrioritas = document.getElementById("select-prioritas") as HTMLSelectElement;
  const formAmbil = document.getElementById("form-ambil-antrian") as HTMLFormElement;
  const hasilTiket = document.getElementById("hasil-tiket") as HTMLDivElement;
  const nomorTiketEl = document.getElementById("nomor-tiket") as HTMLElement;
  const detailTiketEl = document.getElementById("detail-tiket") as HTMLParagraphElement;

  userInfoEl.textContent = `${firstName} (${role.toUpperCase()})`;

  let selectedKode = "";

  renderLayanan();
  window.setInterval(renderLayanan, 2500);

  formAmbil.addEventListener("submit", (event: Event) => {
    event.preventDefault();

    const jenisList = getJenisAntrianList();
    const tiketList = getTiketList();
    const kode = selectLayanan.value;
    const prioritas = selectPrioritas.value as AmbilTiketAntrian["prioritas"];
    const jenis = jenisList.find((item) => item.kode === kode && item.aktif);

    if (!jenis) {
      alert("Layanan tidak tersedia atau sedang nonaktif.");
      renderLayanan();
      return;
    }

    jenis.lastCounter += 1;

    const tiketBaru: AmbilTiketAntrian = {
      id: Date.now().toString(),
      nomor: `${jenis.kode}-${String(jenis.lastCounter).padStart(3, "0")}`,
      kodeJenis: jenis.kode,
      prioritas,
      status: "Menunggu",
      timestamp: Date.now(),
    };

    tiketList.push(tiketBaru);
    saveJenisAntrian(jenisList);
    saveTiket(tiketList);

    selectedKode = jenis.kode;
    nomorTiketEl.textContent = tiketBaru.nomor;
    detailTiketEl.textContent = `${jenis.nama} - ${prioritas}. Silakan menunggu panggilan operator.`;
    hasilTiket.hidden = false;
    renderLayanan();
  });

  function renderLayanan() {
    const jenisList = getJenisAntrianList().filter((item) => item.aktif);
    const tiketList = getTiketList();

    daftarLayananEl.innerHTML = "";
    selectLayanan.innerHTML = '<option value="" disabled selected>Pilih layanan</option>';
    emptyLayananEl.hidden = jenisList.length > 0;

    jenisList.forEach((jenis) => {
      const waitingCount = tiketList.filter(
        (tiket) => tiket.kodeJenis === jenis.kode && tiket.status === "Menunggu"
      ).length;

      const option = document.createElement("option");
      option.value = jenis.kode;
      option.textContent = `${jenis.nama} (${jenis.kode})`;
      selectLayanan.appendChild(option);

      const button = document.createElement("button");
      button.type = "button";
      button.className = jenis.kode === selectedKode ? "service-card selected" : "service-card";
      button.innerHTML = `
        <span class="service-name">${jenis.nama}</span>
        <span class="service-code">Kode ${jenis.kode}</span>
        <span class="service-count">${waitingCount} menunggu</span>
      `;
      button.addEventListener("click", () => {
        selectedKode = jenis.kode;
        selectLayanan.value = jenis.kode;
        renderLayanan();
      });

      daftarLayananEl.appendChild(button);
    });

    if (selectedKode && jenisList.some((jenis) => jenis.kode === selectedKode)) {
      selectLayanan.value = selectedKode;
    } else {
      selectedKode = "";
    }
  }

  function getJenisAntrianList(): AmbilJenisAntrian[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.JENIS_ANTRIAN) || "[]");
  }

  function getTiketList(): AmbilTiketAntrian[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TIKET) || "[]");
  }

  function saveJenisAntrian(jenisList: AmbilJenisAntrian[]) {
    localStorage.setItem(STORAGE_KEYS.JENIS_ANTRIAN, JSON.stringify(jenisList));
  }

  function saveTiket(tiketList: AmbilTiketAntrian[]) {
    localStorage.setItem(STORAGE_KEYS.TIKET, JSON.stringify(tiketList));
  }
});
