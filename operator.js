const daftarPasien = document.getElementById("daftar-pasien");
const tombolTambah = document.getElementById("tabel-baru");

function tambahPasien(nama = "", telepon = "", penyakit = ""){
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

    tombolHapus.addEventListener("click", function(){
        baris.remove();
    });

    kolomAksi.appendChild(tombolHapus);
    
    baris.append(
        kolomNama, kolomTelepon, kolomPenyakit, kolomAksi
    );

    daftarPasien.appendChild(baris);
}

tombolTambah.addEventListener("click", function(){ 
    tambahPasien();
});

tambahPasien();