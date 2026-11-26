# Cara Pakai Paraf

**Buka aplikasinya di sini: https://logbook-sooty-eight.vercel.app**

## Paraf itu apa?

Paraf **bukan** tempat mendaftar atau melamar magang. Paraf adalah **buku logbook harian** untuk orang yang **sudah** magang.

Bayangkan buku logbook kertas yang biasa diisi anak magang, lalu ditandatangani pembimbing lapangan. Paraf sama seperti itu, tapi versi digital, dan aturannya dijaga oleh blockchain, bukan oleh orang:

1. **Tidak bisa ditulis mundur.** Halaman hari Senin hanya bisa ditulis pada hari Senin. Lupa menulis? Hari itu tercatat "Terlewat".
2. **Pembimbing punya batas waktu.** Setiap halaman harus diparaf (disetujui) atau ditolak sebelum waktunya habis.
3. **Diam = disetujui.** Kalau pembimbing sibuk dan tidak sempat memparaf sampai waktunya habis, halaman tetap dihitung disetujui. Anak magang tidak lagi "digantung".
4. **Uang saku terkunci (opsional).** Uang saku dikunci sejak awal dan hanya bisa diambil untuk hari yang disetujui.

Semua halaman bisa dicek siapa saja lewat sebuah link, jadi tidak ada yang bisa memalsukannya.

---

## Ada 4 peran

| Peran | Di dunia nyata, ini siapa? | Tugasnya | Buka tab |
|---|---|---|---|
| **Koordinator** | Kampus, dosen, atau HRD | Mendaftarkan magang, cukup sekali di awal | **Daftar** |
| **Magang** | Mahasiswa yang magang | Menulis 1 halaman setiap hari | **Magang** |
| **Pembimbing** | Pembimbing lapangan di kantor | Memparaf atau menolak halaman | **Pembimbing** |
| **Siapa saja** | Dosen, orang tua, juri, dan lain-lain | Mengecek logbook, tanpa perlu dompet | **Cek Publik** |

> Jadi tab **Daftar** itu bukan untuk melamar magang. Tab itu dipakai koordinator untuk **mencatat** magang yang sudah berjalan ke dalam sistem.

---

## Alurnya dari awal sampai akhir

```
1. Koordinator mendaftarkan magang      →  dapat link, lalu dikirim ke magang dan pembimbing
2. Magang menulis halaman hari ini      →  status: "Menunggu paraf"
3. Pembimbing memparaf atau menolak     →  status: "Diparaf" atau "Ditolak"
      (kalau pembimbing diam sampai waktunya habis)
      → siapa saja klik "Sahkan"         →  status: "Disetujui karena diam"
4. Ulangi langkah 2 dan 3 setiap hari
5. Magang mengambil uang saku untuk hari yang disetujui (kalau ada)
6. Siapa saja bisa mengecek semuanya lewat link
```

---

## Panduan dompet (Phantom)

### Dompet itu apa?

Dompet di sini mirip e-wallet seperti DANA, OVO, atau GoPay, tapi untuk blockchain Solana. Di Paraf, dompet punya dua fungsi:

- **Tanda tangan digital.** Setiap kali kamu menulis logbook atau memparaf, dompetmu yang "menandatangani". Jadi semua orang tahu siapa yang melakukannya, dan tidak ada yang bisa memalsukannya.
- **Membayar biaya kecil.** Setiap aksi di blockchain ada biayanya, tapi sangat kecil, dan dibayar dengan SOL.

Ada satu bedanya dengan e-wallet biasa: **tidak ada customer service.** Kalau kamu kehilangan kunci cadangannya (Secret Recovery Phrase), tidak ada yang bisa membukakan dompetmu lagi.

Kabar baiknya, Paraf berjalan di **devnet**, yaitu Solana versi latihan. SOL di devnet adalah **uang mainan**: gratis, tidak bisa dijual, dan tidak bisa dibeli. Jadi tidak ada uang sungguhan yang terpakai.

| Peran | Butuh dompet? |
|---|---|
| Koordinator | Ya |
| Magang | Ya |
| Pembimbing | Ya |
| Cek Publik | **Tidak** |

**Satu orang, satu dompet.** Dompet magang dan dompet pembimbing **harus berbeda**.

> Nama tombol di Phantom kadang sedikit berbeda dari panduan ini, karena aplikasinya sering diperbarui. Kalau bingung, cari tombol yang artinya paling mirip.

### Langkah 1: Pasang Phantom dan buat dompet

1. Buka **phantom.com** di Chrome. Pastikan alamatnya persis, karena banyak situs palsu yang mirip. Klik **Download**, lalu **Add to Chrome**.
2. Phantom akan terbuka. Pilih **Create a new wallet**.
3. Buat kata sandi. Kata sandi ini hanya untuk membuka Phantom di laptopmu.
4. Phantom akan menampilkan **Secret Recovery Phrase**, yaitu 12 kata acak. **Tulis di kertas, lalu simpan baik-baik.** Ini kunci cadangan dompetmu.
   - **Jangan pernah** kirim 12 kata ini ke siapa pun, termasuk teman satu tim, dan jangan ketik di website mana pun. Siapa saja yang tahu 12 kata ini bisa mengambil alih dompetmu.
5. Supaya Phantom gampang dibuka, klik ikon puzzle 🧩 di kanan atas Chrome, lalu klik ikon pin 📌 di sebelah Phantom. Ikon hantu ungu akan selalu tampil.

### Langkah 2: Nyalakan mode latihan (Devnet)

1. Klik ikon Phantom.
2. Klik foto profil (ikon akun) di kiri atas, lalu pilih **Settings**, lalu **Developer Settings**.
3. Nyalakan **Testnet Mode**, lalu pilih **Solana Devnet**. Jangan pilih "Solana Testnet", karena itu jaringan yang berbeda.

Kalau mode ini tidak dinyalakan, Paraf tidak bisa mengirim apa pun dari dompetmu.

### Langkah 3: Salin alamat dompetmu

Alamat dompet itu seperti **nomor rekening**. Alamat ini aman dibagikan, dan dipakai orang lain untuk mengirim SOL kepadamu atau untuk mendaftarkanmu di Paraf.

1. Klik ikon Phantom, lalu klik **Receive**.
2. Salin alamat **Solana**. Bentuknya deretan huruf dan angka yang panjang (sekitar 44 karakter).

### Langkah 4: Isi SOL devnet (gratis)

**Cara A: minta dari faucet**
1. Buka **faucet.solana.com**.
2. Pilih **devnet**, tempel alamat dompetmu, lalu klik **Confirm Airdrop**.
3. Tunggu sebentar, saldonya akan muncul di Phantom.

Jatah faucet terbatas, sekitar 2 kali setiap 8 jam. Kalau kamu login dengan GitHub (**Connect your GitHub**), jatahnya lebih besar.

**Cara B: minta kiriman teman**
Teman yang sudah punya SOL devnet klik **Send** di Phantom, pilih **SOL**, tempel alamatmu, isi jumlahnya, lalu kirim.

**Berapa yang dibutuhkan?**

| Peran | Kira-kira cukup |
|---|---|
| Koordinator | 0,1 SOL (ditambah jumlah uang saku, kalau diisi) |
| Magang | 0,05 SOL (setiap halaman butuh sekitar 0,003 SOL) |
| Pembimbing | 0,01 SOL (biaya memparaf sangat kecil) |

### Langkah 5: Sambungkan dompet ke Paraf

1. Buka **https://logbook-sooty-eight.vercel.app**
2. Klik tombol **Pilih Dompet** (atau **Sambungkan**) di bagian atas, lalu pilih **Phantom**.
3. Di jendela Phantom, klik **Connect**.

Klik Connect **tidak memindahkan uang apa pun**. Kamu hanya mengizinkan web melihat alamat dompetmu, seperti menunjukkan kartu nama.

### Langkah 6: Setiap aksi, klik Confirm dalam 1 menit

Setiap kali kamu menekan tombol yang mengubah data (Daftarkan magang, Kirim halaman, Paraf, Tolak, Sahkan, Ambil uang saku):

1. Jendela Phantom muncul, berisi perkiraan biayanya.
2. Klik **Confirm** dengan **cepat, kurang dari 1 menit**. Transaksi Solana kedaluwarsa setelah sekitar 1 menit.
3. Tunggu beberapa detik sampai web menampilkan **Berhasil.**

Kalau terlambat, web akan menampilkan "Kamu terlalu lama sebelum klik Confirm". Tidak ada yang rusak dan tidak ada SOL yang terpakai, tinggal klik tombolnya lagi.

### Mau mencoba semua peran sendirian? Pakai beberapa akun

Satu Phantom bisa punya beberapa akun, seperti punya beberapa rekening di satu aplikasi bank.

1. Klik ikon Phantom, klik nama akun di kiri atas, pilih **Add / Connect Wallet**, lalu **Create New Account**. Beri nama, misalnya **Magang**.
2. Kirim sedikit SOL dari akun utama ke akun baru (lihat Langkah 4, Cara B).
3. Untuk pindah akun, klik nama akun di kiri atas Phantom, lalu pilih akun yang lain.
4. **Penting:** setelah pindah akun di Phantom, klik **Ganti akun** di web Paraf. Bisa juga klik tombol dompet, pilih **Putuskan**, lalu sambungkan lagi. Kalau tidak, web masih memakai akun yang lama dan akan menampilkan "Tidak ada magang untuk dompet ini".

### Yang boleh dan tidak boleh dibagikan

| Boleh dibagikan | **Jangan pernah dibagikan** |
|---|---|
| Alamat dompet | Secret Recovery Phrase (12 kata) |
| Link logbook dari Paraf | Private key |
| | Kata sandi Phantom |

---

## Langkah per peran

### 1. Koordinator: mendaftarkan magang (tab Daftar)

1. Sambungkan dompet koordinator, lalu buka tab **Daftar**.
2. Isi formulirnya:
   - **Alamat dompet magang**: minta alamat dompet Phantom si anak magang. Kalau mau mencoba sendiri, klik **Pakai dompetku**.
   - **Alamat dompet pembimbing**: minta alamat dompet Phantom pembimbingnya.
   - **Tempat magang**: misalnya "PT Maju Jaya".
   - **Mulai**: pilih **Sekarang**.
   - **Panjang satu hari**: pilih **Hari sungguhan (24 jam)**. Untuk mencoba cepat, pilih **Demo (3 menit)**, jadi satu "hari" hanya 3 menit.
   - **Jendela paraf**: berapa lama pembimbing boleh memparaf, misalnya **2 hari**. Untuk mencoba cepat, pilih **Demo (2 menit)**.
   - **Jumlah hari (halaman)**: berapa hari magangnya.
   - **Uang saku**: boleh dikosongkan.
3. Klik **Daftarkan magang**, lalu **Confirm** di Phantom.
4. Akan muncul **"Magang berhasil didaftarkan"** beserta sebuah link. **Kirim link itu ke magang dan pembimbing.**

### 2. Magang: menulis halaman hari ini (tab Magang)

1. Sambungkan dompet magang, lalu buka tab **Magang**.
2. Di **Ringkasan publik**, tulis apa yang kamu kerjakan hari ini dalam 1 atau 2 kalimat. Contoh: *"Membantu input data wajib pajak dan merapikan arsip."*
   Ringkasan ini **bisa dibaca siapa saja dan tidak bisa dihapus**, jadi jangan menulis hal rahasia kantor.
3. **Catatan lengkap** boleh diisi, boleh juga tidak. Isinya tidak dikirim ke internet, hanya "sidik jari"-nya yang disimpan.
4. Klik **Kirim halaman hari ini**, lalu **Confirm** di Phantom.
5. Kalau kamu mengisi catatan lengkap, klik **Simpan sebagai .txt** dan simpan filenya. File ini nanti bisa dipakai untuk membuktikan bahwa catatanmu tidak pernah diubah.

Di bagian **Halaman-halamanmu**, kamu bisa melihat status setiap hari. Ada juga kotak **Coba curang (demo)** untuk membuktikan bahwa menulis mundur memang ditolak. Coba saja, aman dan tidak ada yang terkirim.

### 3. Pembimbing: memparaf atau menolak (tab Pembimbing)

1. Sambungkan dompet pembimbing, lalu buka tab **Pembimbing**.
2. Di bagian **Menunggu paraf**, kamu akan melihat halaman dari magang bimbinganmu beserta **sisa waktu paraf**.
3. Kalau setuju, klik **Paraf**, lalu **Confirm**. Stempel **PARAF** akan muncul 🟢
4. Kalau tidak setuju, pilih **Alasan menolak** (Tidak hadir, Kurang lengkap, Lainnya, atau Tanpa alasan), lalu klik **Tolak**.

Kalau waktunya sudah habis, tombol Paraf dan Tolak tidak bisa dipakai lagi.

### 4. Kalau pembimbing diam: tombol Sahkan

Kalau waktu paraf habis dan pembimbing belum memutuskan apa-apa, status halaman berubah menjadi **"Didiamkan: siap disahkan"**.

Tinggal satu langkah lagi: **siapa saja** yang punya dompet (magang, koordinator, atau orang lain) klik **Sahkan (diam = setuju)**. Ibaratnya hakim mengetok palu. Stempel **SAH** muncul, dan halamannya resmi berstatus **Disetujui karena diam**.

Tombol Sahkan ada di tab Magang, tab Pembimbing, dan tab Cek Publik.

### 5. Magang: mengambil uang saku (opsional)

Bagian ini hanya muncul kalau koordinator mengisi uang saku saat mendaftar.

Di tab **Magang**, bagian **Uang saku**, klik **Ambil uang saku**. Kamu hanya mendapat uang untuk hari yang **disetujui**. Kalau masih ada halaman yang "siap disahkan", sahkan dulu supaya ikut terhitung.

### 6. Siapa saja: mengecek logbook (tab Cek Publik)

Bagian ini **tidak perlu dompet**.

1. Buka link yang dibagikan koordinator. Atau buka tab **Cek Publik**, tempel **Alamat magang**, lalu klik **Cek**.
2. Kamu akan melihat siapa magang dan pembimbingnya, jadwalnya, jumlah halaman yang disetujui atau ditolak, dan **kalender**.
3. Klik salah satu hari di kalender untuk membaca halamannya.
4. Kalau magang memberimu file `.txt`-nya, unggah file itu di bagian **Cek catatan lengkap**. Kalau hasilnya **"Cocok"**, berarti catatannya asli dan tidak pernah diubah.

Kalau ada label **"Didaftarkan sendiri"**, artinya magang mendaftarkan dirinya sendiri, jadi belum ada pihak kampus atau kantor yang menjamin tempat magangnya.

---

## Arti status

| Status | Artinya |
|---|---|
| **Hari ini** | Hari yang sedang berjalan. Halamannya bisa ditulis sekarang. |
| **Menunggu paraf** | Halaman sudah ditulis, pembimbing belum memutuskan. |
| **Diparaf** | Disetujui pembimbing ✅ |
| **Ditolak** | Ditolak pembimbing, ada alasannya. |
| **Didiamkan: siap disahkan** | Waktu paraf habis dan pembimbing diam. Tinggal klik Sahkan. |
| **Disetujui karena diam** | Sudah disahkan, dihitung sama dengan disetujui ✅ |
| **Terlewat** | Hari itu tidak ada halaman yang ditulis. |
| **Akan datang** | Harinya belum tiba. |

---

## Mau coba bertiga? (sekitar 15 menit)

Setiap orang memegang satu peran:

| Siapa | Peran | Buka tab |
|---|---|---|
| **Nadjwa** | Koordinator | **Daftar** |
| **Syakira** | Magang | **Magang** |
| **Widya** | Pembimbing | **Pembimbing** |

**Persiapan:** ketiganya pasang Phantom (mode Devnet) dan isi SOL devnet gratis dari faucet. Lalu **Syakira** dan **Widya** kirim alamat dompetnya ke **Nadjwa**.

**Daftar (Nadjwa)**
1. Buka tab **Daftar**, lalu isi:
   - Alamat dompet magang: alamat dompet **Syakira**
   - Alamat dompet pembimbing: alamat dompet **Widya**
   - Tempat magang: bebas, misalnya "PT Maju Jaya"
   - Mulai: **Sekarang**
   - Panjang satu hari: **Demo (3 menit)**
   - Jendela paraf: **Demo (2 menit)**
   - Jumlah hari: **3**
2. Klik **Daftarkan magang**, lalu kirim link yang muncul ke Syakira dan Widya.

**Hari 1: diparaf**
1. **Syakira** buka tab **Magang**, tulis ringkasan, lalu klik **Kirim halaman hari ini**.
2. **Widya** buka tab **Pembimbing**, lalu klik **Paraf**. Stempel **PARAF** muncul 🎉

**Hari 2: pembimbing diam** (mulai 3 menit setelah pendaftaran)
1. **Syakira** menulis halaman hari ke-2.
2. **Widya diam saja**, jangan klik apa-apa.
3. Setelah 2 menit, statusnya menjadi "Didiamkan: siap disahkan". **Nadjwa** (atau siapa saja) klik **Sahkan**. Stempel **SAH** muncul: diam = disetujui 🎉

**Hari 3: ditolak**
1. **Syakira** menulis halaman hari ke-3.
2. **Widya** pilih alasan **Kurang lengkap**, lalu klik **Tolak**.

**Lihat hasilnya:** buka link tadi di tab **Cek Publik**. Kalendernya akan menunjukkan ketiga hasil: diparaf, disetujui karena diam, dan ditolak. Bagian ini bisa dibuka siapa saja, bahkan tanpa dompet.

---

## Mau coba sendirian? (2 akun Phantom, sekitar 25 menit)

Cara ini cocok kalau teman satu tim sedang tidak bisa ikut. Buat 2 akun di Phantom (caranya ada di bagian **Mau mencoba semua peran sendirian?** di atas).

| Akun Phantom | Peran |
|---|---|
| Akun utama | Koordinator sekaligus pembimbing |
| Akun **Magang** | Magang |

Kali ini waktunya sengaja dibuat lebih panjang dari mode Demo, supaya kamu tidak terburu-buru saat berganti akun.

1. **Daftar (akun utama).** Buka tab **Daftar**, lalu isi:
   - Alamat dompet magang: alamat akun **Magang**
   - Alamat dompet pembimbing: alamat akun utama. Caranya, klik tombol dompet di web, lalu pilih **Salin alamat**.
   - Panjang satu hari: **Atur sendiri**, isi **600** detik (10 menit)
   - Jendela paraf: **Atur sendiri**, isi **300** detik (5 menit)
   - Jumlah hari: **3**
   - Uang saku: **0.005**
   - Klik **Daftarkan magang**, lalu **Confirm**.
2. **Tulis hari 1 (akun Magang).** Pindah ke akun Magang di Phantom, lalu klik **Ganti akun** di web. Buka tab **Magang**, tulis ringkasan, lalu klik **Kirim halaman hari ini**.
3. **Paraf hari 1 (akun utama).** Pindah ke akun utama, lalu klik **Ganti akun**. Buka tab **Pembimbing**, lalu klik **Paraf**.
4. **Hari 2: diam = disetujui (akun Magang).** Tunggu sampai hari 2 dimulai, yaitu 10 menit setelah pendaftaran. Tulis halaman lagi, lalu **diamkan** selama 5 menit. Setelah itu klik **Sahkan**.
5. **Ambil uang saku (akun Magang).** Di tab **Magang**, klik **Ambil uang saku**. Seharusnya masuk **0,01 SOL** (2 hari disetujui × 0,005).
6. **Cek tanpa dompet.** Tekan **Ctrl + Shift + N** di Chrome untuk membuka jendela Incognito, lalu buka link logbook-nya. Datanya tetap tampil walaupun tidak ada dompet yang tersambung.

---

## Sudah teruji di devnet

Semua aturan Paraf sudah dicoba di devnet sungguhan dengan dua cara: lewat skrip otomatis dan lewat web dengan Phantom (25 November 2026).

| Yang dicek | Skrip otomatis | Web + Phantom |
|---|---|---|
| Daftar magang, uang saku langsung terkunci | ✔ | ✔ |
| Magang menulis logbook hari ini | ✔ | ✔ |
| Menulis halaman hari kemarin (mundur) | ✔ ditolak | – |
| Menulis halaman hari besok (duluan) | ✔ ditolak | – |
| Pembimbing memparaf dan menolak | ✔ | ✔ (memparaf) |
| Orang lain mencoba memparaf | ✔ ditolak | – |
| Mengesahkan sebelum waktu paraf habis | ✔ ditolak | – |
| Pembimbing diam, halaman tetap disetujui | ✔ | ✔ |
| Uang saku hanya dibayar untuk hari yang disetujui | ✔ (2 dari 4 hari) | ✔ (2 dari 3 hari) |
| Mengambil uang saku dua kali | ✔ ditolak | – |
| Logbook bisa dicek tanpa dompet | ✔ | ✔ |

**Hasil tesnya bisa langsung dilihat, tanpa dompet:**
- [Logbook dari skrip otomatis](https://logbook-sooty-eight.vercel.app/?i=6k6SrUa2xmmpK2UA6MdDroDU2maJhuUBDiieWUsN5G26): hari 1 disetujui karena diam, hari 2 diparaf, hari 3 terlewat, hari 4 ditolak.
- [Logbook dari tes lewat web](https://logbook-sooty-eight.vercel.app/?i=77vHcgxVdiZBkBQumZ1njj8Cp4gppqikSM5mahMPSXXs): hari 1 diparaf, hari 2 disetujui karena diam, hari 3 terlewat.

Skrip otomatisnya bisa dijalankan ulang kapan saja dengan perintah `npm run smoke:devnet` di folder `tests`. Selain itu ada 72 tes otomatis lain yang menguji setiap aturan secara terpisah.

---

## Kalau ada masalah

| Masalahnya | Coba ini |
|---|---|
| "Tidak ada magang untuk dompet ini" | Pastikan dompet yang tersambung adalah dompet yang didaftarkan. Kalau baru ganti akun di Phantom, klik **Ganti akun** di web. |
| "SOL devnet di dompetmu tidak cukup" | Minta SOL gratis di **faucet.solana.com**. |
| "Kamu terlalu lama sebelum klik Confirm" | Klik tombolnya lagi, lalu langsung klik **Confirm** di Phantom. |
| Phantom gagal mengirim transaksi | Cek lagi: **Testnet Mode** menyala dan **Solana Devnet** dipilih. |
| "Server devnet sedang sibuk" | Tunggu beberapa detik, lalu coba lagi. |
| Mau mengubah halaman yang sudah dikirim | Tidak bisa. Halaman yang sudah dikirim tidak bisa diubah atau dihapus. Memang itu tujuannya. |

---

## Ingat

- Semua yang ditulis ke blockchain **bisa dibaca siapa saja dan tidak bisa dihapus**. Tulis ringkasan singkat dan jangan pernah menulis hal rahasia.
- Saat ini Paraf berjalan di **devnet**, versi latihan Solana. Semua uangnya uang mainan.
