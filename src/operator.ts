document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("auth_token");
  const role = localStorage.getItem("user_role");

  if (!token || !role) {
    window.location.href = "login.html";
    return;
  }

  if (role !== "admin" && role !== "moderator") {
    window.location.href = "ambil-antrian.html";
    return;
  }

  const daftarPasien = document.getElementById("daftar-pasien") as HTMLTableSectionElement;
  const tombolTambah = document.getElementById("tabel-baru") as HTMLButtonElement;

  function tambahPasien(nama = "", telepon = "", penyakit = "") {
    const baris = document.createElement("tr");

    const kolomNama = document.createElement("td");
    const inputNama = document.createElement("input");
    inputNama.type = "text";
    inputNama.placeholder = "nama...";
    inputNama.value = nama;
    kolomNama.appendChild(inputNama);

    const kolomTelepon = document.createElement("td");
    const inputTelepon = document.createElement("input");
    inputTelepon.type = "text";
    inputTelepon.placeholder = "no telepon...";
    inputTelepon.value = telepon;
    kolomTelepon.appendChild(inputTelepon);

    const kolomPenyakit = document.createElement("td");
    const inputPenyakit = document.createElement("input");
    inputPenyakit.type = "text";
    inputPenyakit.placeholder = "penyakit...";
    inputPenyakit.value = penyakit;
    kolomPenyakit.appendChild(inputPenyakit);

    const kolomAksi = document.createElement("td");
    const tombolHapus = document.createElement("button");
    tombolHapus.type = "button";
    tombolHapus.textContent = "Hapus";

    tombolHapus.addEventListener("click", () => {
      baris.remove();
    });

    kolomAksi.appendChild(tombolHapus);
    baris.append(kolomNama, kolomTelepon, kolomPenyakit, kolomAksi);
    daftarPasien.appendChild(baris);
  }

  tombolTambah.addEventListener("click", () => {
    tambahPasien();
  });

  tambahPasien();
});
