const AUTH_KEY = "auth_user";            // sama dengan login.js & guard di operator.html
const TIKET_KEY = "antrian_tiket";

// Status (satu ejaan di seluruh file)
const S_MENUNGGU = "Menunggu";
const S_DIPANGGIL = "Dipanggil";
const S_DILEWATI = "Dilewati";
const S_SELESAI = "Selesai";

const $ = id => document.getElementById(id);

// ===== Auth =====
function getUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch { return null; }
}

const user = getUser();
if (!user) {
  location.replace("login.html");
  throw new Error("Belum login");
}

$("info-user").textContent = "Login: " + user.username + " ";
$("btn-logout").addEventListener("click", () => {
  localStorage.removeItem(AUTH_KEY);
  location.replace("login.html");
});

// ===== Penyimpanan tiket =====
function ambilTiket() {
  try { return JSON.parse(localStorage.getItem(TIKET_KEY)) || []; }
  catch { return []; }
}
function simpanTiket(list) {
  localStorage.setItem(TIKET_KEY, JSON.stringify(list)); // sebelumnya: JSON.stringify("list")
  render();
}

// ===== Logika antrian =====
const rank = t => (t.prioritas === "Normal" ? 1 : 0);

function urutAntrian(list) {
  const menunggu = list.filter(t => t.status === S_MENUNGGU)
    .sort((a, b) => rank(a) - rank(b) || a.waktu - b.waktu);
  const dilewati = list.filter(t => t.status === S_DILEWATI)
    .sort((a, b) => (a.waktuLewat || 0) - (b.waktuLewat || 0));
  return [...menunggu, ...dilewati];
}

const tiketAktif = list => list.find(t => t.status === S_DIPANGGIL);

function selesaikanAktif(list) {
  const aktif = tiketAktif(list);
  if (aktif) {
    aktif.status = S_SELESAI;
    aktif.waktuSelesai = Date.now();
  }
}

function panggilBerikutnya() {
  const list = ambilTiket();
  selesaikanAktif(list);
  const berikut = urutAntrian(list)[0];
  if (berikut) {
    berikut.status = S_DIPANGGIL;
    berikut.waktuPanggil = Date.now();
  }
  simpanTiket(list); // sebelumnya tidak disimpan
}

function lewati() {
  const list = ambilTiket();
  const aktif = tiketAktif(list);
  if (!aktif) return;
  aktif.status = S_DILEWATI;
  aktif.waktuLewat = Date.now();
  simpanTiket(list);
}

function selesai() {
  const list = ambilTiket();
  if (!tiketAktif(list)) return;
  selesaikanAktif(list);
  simpanTiket(list);
}

// sebelumnya fungsi ini tidak ada -> ReferenceError
function buatDataContoh() {
  const now = Date.now();
  const contoh = [
    { nomor: "A001", nama: "Budi Santoso", prioritas: "Normal" },
    { nomor: "A002", nama: "Siti Aminah",  prioritas: "Prioritas" },
    { nomor: "A003", nama: "Agus Wijaya",  prioritas: "Normal" },
    { nomor: "A004", nama: "Dewi Lestari", prioritas: "Prioritas" },
  ].map((t, i) => ({ ...t, status: S_MENUNGGU, waktu: now + i }));
  simpanTiket(contoh);
}

// ===== Tampilan =====
function render() {
  const list = ambilTiket();
  const aktif = tiketAktif(list);
  const antrian = urutAntrian(list);
  const berikut = antrian[0];

  $("nomor-aktif").textContent = aktif ? aktif.nomor : "-";
  $("detail-aktif").textContent = aktif ? `${aktif.nama} (${aktif.prioritas})` : "Belum ada tiket dipanggil";

  $("nomor-berikut").textContent = berikut ? berikut.nomor : "-";
  $("detail-berikut").textContent = berikut
    ? `${berikut.nama} (${berikut.prioritas})${berikut.status === S_DILEWATI ? " - sebelumnya dilewati" : ""}`
    : "Antrian kosong";
  $("sisa-antrian").textContent = `Sisa antrian: ${antrian.length}`;

  $("btn-panggil").disabled = !aktif && !berikut;
  $("btn-lewati").disabled = !aktif;
  $("btn-selesai").disabled = !aktif;
  $("btn-contoh").hidden = list.length > 0;

  const tbody = $("daftar-antrian");
  tbody.innerHTML = "";
  const tampil = [...(aktif ? [aktif] : []), ...antrian];
  tampil.forEach(t => {
    const tr = document.createElement("tr");
    [t.nomor, t.nama, t.prioritas, t.status].forEach(v => {
      const td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(td);
    });
    if (t.status === S_DIPANGGIL) tr.className = "baris-aktif";
    tbody.appendChild(tr);
  });
}

$("btn-panggil").addEventListener("click", panggilBerikutnya);
$("btn-lewati").addEventListener("click", lewati);
$("btn-selesai").addEventListener("click", selesai);
$("btn-contoh").addEventListener("click", buatDataContoh);

// Update otomatis jika tab lain mengubah tiket / logout
window.addEventListener("storage", e => {
  if (e.key === TIKET_KEY) render();
  if (e.key === AUTH_KEY && !e.newValue) location.replace("login.html");
});

render();

// ===== Data pasien =====
const daftarPasien = $("daftar-pasien");
const tombolTambah = $("tabel-baru");

function tambahPasien(nama = "", telepon = "", penyakit = "") {
  const baris = document.createElement("tr");

  const buatKolom = (placeholder, nilai) => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.value = nilai;
    td.appendChild(input);
    return td;
  };

  const kolomAksi = document.createElement("td");
  const tombolHapus = document.createElement("button");
  tombolHapus.type = "button";
  tombolHapus.textContent = "Hapus";
  tombolHapus.addEventListener("click", () => baris.remove());
  kolomAksi.appendChild(tombolHapus);

  baris.append(
    buatKolom("nama...", nama),
    buatKolom("no telepon...", telepon),
    buatKolom("penyakit...", penyakit),
    kolomAksi
  );
  daftarPasien.appendChild(baris);
}

tombolTambah.addEventListener("click", () => tambahPasien());
tambahPasien();
