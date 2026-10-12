interface JenisAntrian {
  kode: string;
  nama: string;
  aktif: boolean;
  lastCounter: number;
}

interface TiketAntrian {
  id: string;
  nomor: string;
  kodeJenis: string;
  prioritas: "Normal" | "Lansia" | "Disabilitas" | "VIP";
  status: "Menunggu" | "Dipanggil" | "Selesai" | "Dilewati";
  timestamp: number;
}

const STORAGE_KEYS = {
  TOKEN: "auth_token",
  ROLE: "user_role",
  NAME: "firstName",
  JENIS_ANTRIAN: "data_jenis_antrian",
  TIKET: "data_tiket_antrian",
};

document.addEventListener("DOMContentLoaded", () => {
  // 1. Auth Guard & Role Guard
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const role = localStorage.getItem(STORAGE_KEYS.ROLE);
  const firstName = localStorage.getItem(STORAGE_KEYS.NAME) || "Admin";

  if (!token || !role || (role !== "admin" && role !== "moderator")) {
    window.location.href = "login.html";
    return;
  }

  // Set Profile Navbar
  const userInfoEl = document.getElementById("user-info") as HTMLSpanElement;
  userInfoEl.textContent = `${firstName} (${role.toUpperCase()})`;

  // Inisialisasi Data dari Local Storage
  let jenisAntrianList: JenisAntrian[] = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.JENIS_ANTRIAN) || "[]"
  );
  let tiketList: TiketAntrian[] = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.TIKET) || "[]"
  );

  // Default Jenis Antrian jika kosong
  if (jenisAntrianList.length === 0) {
    jenisAntrianList = [
      { kode: "A", nama: "UMUM-1", aktif: true, lastCounter: 0 },
      { kode: "B", nama: "UMUM-2", aktif: true, lastCounter: 0 },
      { kode: "C", nama: "UMUM-3", aktif: true, lastCounter: 0 },
      { kode: "G", nama: "GIGI", aktif: true, lastCounter: 0 },
      { kode: "F", nama: "FARMASI", aktif: true, lastCounter: 0 },
      { kode: "P", nama: "PSIKOLOG", aktif: true, lastCounter: 0 },
    ];
    saveJenisAntrian();
  }

  // Elemen DOM
  const formJenis = document.getElementById("form-jenis-antrian") as HTMLFormElement;
  const inputKode = document.getElementById("input-kode") as HTMLInputElement;
  const inputNama = document.getElementById("input-nama") as HTMLInputElement;
  const errorJenisEl = document.getElementById("error-jenis") as HTMLDivElement;
  const daftarJenisEl = document.getElementById("daftar-jenis-antrian") as HTMLDivElement;
  const selectJenis = document.getElementById("select-jenis") as HTMLSelectElement;
  const formTiket = document.getElementById("form-tiket-manual") as HTMLFormElement;
  const selectPrioritas = document.getElementById("select-prioritas") as HTMLSelectElement;
  const daftarKategoriEl = document.getElementById("daftar-antrian-kategori") as HTMLDivElement;
  const btnLogout = document.getElementById("btn-logout") as HTMLButtonElement;
  const btnReset = document.getElementById("btn-reset-antrian") as HTMLButtonElement;

  // Render Pertama Kali
  renderJenisAntrian();
  renderKategoriAntrian();

  // 2. Logout Handler
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.NAME);
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });

  // 3. Reset Antrian Handler
  btnReset.addEventListener("click", () => {
    if (confirm("Apakah yakin ingin mereset seluruh antrian ke awal hari ini?")) {
      tiketList = [];
      jenisAntrianList.forEach((j) => (j.lastCounter = 0));
      saveTiket();
      saveJenisAntrian();
      renderJenisAntrian();
      renderKategoriAntrian();
    }
  });

  // 4. Tambah Jenis Antrian Baru
  formJenis.addEventListener("submit", (e: Event) => {
    e.preventDefault();
    errorJenisEl.textContent = "";

    const kode = inputKode.value.trim().toUpperCase();
    const nama = inputNama.value.trim();

    if (!/^[A-Z]$/.test(kode)) {
      errorJenisEl.textContent = "Kode wajib berupa 1 huruf kapital (A-Z).";
      return;
    }

    // Validasi Duplikasi (case-insensitive)
    const duplikatKode = jenisAntrianList.some(
      (j) => j.kode.toUpperCase() === kode
    );
    const duplikatNama = jenisAntrianList.some(
      (j) => j.nama.toLowerCase() === nama.toLowerCase()
    );

    if (duplikatKode) {
      errorJenisEl.textContent = `Kode '${kode}' sudah terdaftar!`;
      return;
    }
    if (duplikatNama) {
      errorJenisEl.textContent = `Nama jenis antrian '${nama}' sudah ada!`;
      return;
    }

    jenisAntrianList.push({
      kode,
      nama,
      aktif: true,
      lastCounter: 0,
    });

    saveJenisAntrian();
    inputKode.value = "";
    inputNama.value = "";
    renderJenisAntrian();
  });

  // 5. Penerbitan Tiket Manual
  formTiket.addEventListener("submit", (e: Event) => {
    e.preventDefault();
    const selectedKode = selectJenis.value;
    const prioritas = selectPrioritas.value as TiketAntrian["prioritas"];

    const jenis = jenisAntrianList.find((j) => j.kode === selectedKode);
    if (!jenis || !jenis.aktif) {
      alert("Jenis antrian tidak valid atau sedang nonaktif.");
      return;
    }

    jenis.lastCounter += 1;
    const formattedNumber = `${jenis.kode}-${String(jenis.lastCounter).padStart(3, "0")}`;

    const newTiket: TiketAntrian = {
      id: Date.now().toString(),
      nomor: formattedNumber,
      kodeJenis: jenis.kode,
      prioritas,
      status: "Menunggu",
      timestamp: Date.now(),
    };

    tiketList.push(newTiket);
    saveTiket();
    saveJenisAntrian();
    renderJenisAntrian();
    renderKategoriAntrian();
  });

  // --- Fungsi Render & Utilitas ---

  function saveJenisAntrian() {
    localStorage.setItem(STORAGE_KEYS.JENIS_ANTRIAN, JSON.stringify(jenisAntrianList));
  }

  function saveTiket() {
    localStorage.setItem(STORAGE_KEYS.TIKET, JSON.stringify(tiketList));
  }

  function renderJenisAntrian() {
    daftarJenisEl.innerHTML = "";
    selectJenis.innerHTML = '<option value="" disabled selected>Pilih jenis antrian</option>';

    jenisAntrianList.forEach((item) => {
      // Hitung antrian berstatus 'Menunggu'
      const waitingCount = tiketList.filter(
        (t) => t.kodeJenis === item.kode && t.status === "Menunggu"
      ).length;

      // Render Baris di Kolom Kiri
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-info">
          <span class="item-title">${item.nama} (${item.kode})</span>
          <span class="item-count">${waitingCount} menunggu</span>
        </div>
        <div class="item-actions">
          <button class="btn-action toggle-btn" data-kode="${item.kode}">
            ${item.aktif ? "Nonaktifkan" : "Aktifkan"}
          </button>
          <button class="btn-action danger delete-btn" data-kode="${item.kode}">Hapus</button>
        </div>
      `;
      daftarJenisEl.appendChild(row);

      // Render Option di Form Tiket (hanya jika aktif)
      if (item.aktif) {
        const option = document.createElement("option");
        option.value = item.kode;
        option.textContent = `${item.nama} (${item.kode})`;
        selectJenis.appendChild(option);
      }
    });

    // Event Listener Toggle Aktif/Nonaktif
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const kode = (e.target as HTMLElement).getAttribute("data-kode");
        const target = jenisAntrianList.find((j) => j.kode === kode);
        if (target) {
          target.aktif = !target.aktif;
          saveJenisAntrian();
          renderJenisAntrian();
        }
      });
    });

    // Event Listener Hapus Jenis Antrian
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const kode = (e.target as HTMLElement).getAttribute("data-kode");
        if (confirm(`Hapus kategori antrian (${kode}) beserta seluruh tiket terkait?`)) {
          jenisAntrianList = jenisAntrianList.filter((j) => j.kode !== kode);
          tiketList = tiketList.filter((t) => t.kodeJenis !== kode);
          saveJenisAntrian();
          saveTiket();
          renderJenisAntrian();
          renderKategoriAntrian();
        }
      });
    });
  }

  function renderKategoriAntrian() {
    daftarKategoriEl.innerHTML = "";

    // Prioritas pengurutan tiket: VIP (1) -> Disabilitas (2) -> Lansia (3) -> Normal (4)
    const priorityWeight: Record<TiketAntrian["prioritas"], number> = {
      VIP: 1,
      Disabilitas: 2,
      Lansia: 3,
      Normal: 4,
    };

    jenisAntrianList.forEach((jenis) => {
      const block = document.createElement("div");
      block.className = "kategori-block";

      const title = document.createElement("div");
      title.className = "kategori-title";
      title.textContent = jenis.nama;
      block.appendChild(title);

      const items = tiketList
        .filter((t) => t.kodeJenis === jenis.kode)
        .sort((a, b) => {
          // Status Dipanggil selalu paling atas
          if (a.status === "Dipanggil" && b.status !== "Dipanggil") return -1;
          if (b.status === "Dipanggil" && a.status !== "Dipanggil") return 1;

          // Urutkan berdasarkan bobot prioritas
          const weightDiff = priorityWeight[a.prioritas] - priorityWeight[b.prioritas];
          if (weightDiff !== 0) return weightDiff;

          // FIFO berdasarkan timestamp
          return a.timestamp - b.timestamp;
        });

      if (items.length === 0) {
        const emptyText = document.createElement("p");
        emptyText.style.fontSize = "0.8rem";
        emptyText.style.color = "#94a3b8";
        emptyText.textContent = "Belum ada tiket antrian.";
        block.appendChild(emptyText);
      } else {
        const table = document.createElement("table");
        table.className = "antrian-table";

        items.forEach((item) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td style="font-weight: 700;">${item.nomor}</td>
            <td><span class="badge-prioritas ${item.prioritas}">${item.prioritas}</span></td>
            <td style="color: ${item.status === "Dipanggil" ? "#d97706" : "#64748b"}; font-weight: 600;">
              ${item.status}
            </td>
            <td style="text-align: right;">
              ${
                item.status === "Dipanggil"
                  ? `<button class="btn-action selesaikan-btn" data-id="${item.id}">Selesai</button>`
                  : item.status === "Menunggu"
                  ? `<button class="btn-action panggil-btn" data-id="${item.id}">Panggil</button>
                     <button class="btn-action danger lewati-btn" data-id="${item.id}">Lewati</button>`
                  : ""
              }
            </td>
          `;
          table.appendChild(tr);
        });
        block.appendChild(table);
      }

      daftarKategoriEl.appendChild(block);
    });

    attachTiketActionListeners();
  }

  function attachTiketActionListeners() {
    document.querySelectorAll(".panggil-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.target as HTMLElement).getAttribute("data-id");
        const tiket = tiketList.find((t) => t.id === id);
        if (tiket) {
          tiket.status = "Dipanggil";
          saveTiket();
          renderKategoriAntrian();
        }
      });
    });

    document.querySelectorAll(".selesaikan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.target as HTMLElement).getAttribute("data-id");
        const tiket = tiketList.find((t) => t.id === id);
        if (tiket) {
          tiket.status = "Selesai";
          saveTiket();
          renderKategoriAntrian();
        }
      });
    });

    document.querySelectorAll(".lewati-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.target as HTMLElement).getAttribute("data-id");
        const tiket = tiketList.find((t) => t.id === id);
        if (tiket) {
          tiket.status = "Dilewati";
          saveTiket();
          renderKategoriAntrian();
        }
      });
    });
  }
});