# Panduan Memasang Program Paraf

Panduan ini untuk kamu yang baru pertama kali. Ikuti langkahnya satu per satu.

**Kamus kecil**

| Istilah | Artinya |
|---|---|
| Program | Kode Paraf yang dipasang di Solana. Isinya aturan logbook. |
| Devnet | Solana versi latihan. Uangnya uang mainan, gratis. |
| SOL | Uang di Solana. Di devnet, ini uang mainan. |
| Dompet / wallet | Aplikasi untuk menyimpan SOL, misalnya Phantom. |
| Deploy | Memasang program ke Solana. |
| Program ID | "Alamat" program setelah dipasang. Bentuknya deretan huruf dan angka. |
| File kunci (keypair) | File rahasia yang membuktikan kamu pemilik dompet atau program. |

---

## Bagian 1: Siapkan dompet dan uang mainan

1. Pasang **Phantom** di Chrome, cuma dari situs resminya: **phantom.com**.
2. Ubah ke mode latihan: klik foto profil (kiri atas) → **Settings** → **Developer Settings** → nyalakan **Testnet Mode** → pilih **Solana Devnet**. Jangan pilih "Solana Testnet".
3. Di Phantom, klik **Receive**, lalu salin alamat Solana-mu.
4. Buka **faucet.solana.com**, pilih **devnet**, tempel alamatmu, lalu klik **Confirm Airdrop**.
   - Kalau punya akun GitHub, klik **Connect your GitHub** dulu supaya jatahnya lebih besar.
   - Jatahnya cuma 2 kali setiap 8 jam. Minta Widya ikut minta, lalu kirim ke dompetmu.
   - Bagian ini harus kamu sendiri yang klik. Situsnya melarang AI.
5. Kumpulkan sampai **sekitar 5 SOL**.

---

## Bagian 2: Pasang program di Solana Playground

Solana Playground adalah situs untuk menulis dan memasang program Solana langsung dari browser, tanpa install apa-apa.

> Nama tombol di situsnya bisa sedikit berbeda dari panduan ini. Kalau bingung, kirim screenshot ke asisten AI-mu.

1. Buka **beta.solpg.io** di Chrome.
2. **Buat dompet Playground.** Klik tulisan **Not connected** di kiri bawah. Kalau ditawari menyimpan file kunci (**Save keypair**), **simpan**. Taruh di folder aman di luar `D:\paraf`, misalnya `D:\kunci-paraf`.
3. **Isi dompet Playground.** Salin alamat dompet Playground (di kiri bawah). Lalu di Phantom klik **Send**, tempel alamat itu, dan kirim **3,5 SOL**.
4. **Buat proyek baru.** Di panel **Explorer** (kiri), pilih **Create a new project**, beri nama `paraf`, pilih **Anchor (Rust)**, lalu klik **Create**.
5. **Tempel kodenya.** Buka file `src/lib.rs` di Playground, hapus semua isinya, lalu tempel seluruh isi file `D:\paraf\program\src\lib.rs`. Cara cepatnya: buka file itu di VS Code, tekan **Ctrl+A** lalu **Ctrl+C**, kemudian di Playground tekan **Ctrl+A** lalu **Ctrl+V**.
6. **Build.** Buka panel **Build & Deploy** (ikon palu), lalu klik **Build**. Tunggu sampai muncul tulisan berhasil. Baris "Stack offset ... switchboard" boleh diabaikan.
7. **Deploy.** Klik **Deploy**. Tunggu sampai selesai, bisa sekitar 1 menit.
8. **Salin Program ID.** Di panel **Build & Deploy**, cari **Program ID**, lalu salin.
9. **Simpan file kunci program.** Masih di bagian Program ID, klik **Export**. Simpan di folder aman yang sama (`D:\kunci-paraf`).
10. **Kirim Program ID ke asisten AI-mu.** Cukup Program ID-nya saja. **Jangan pernah kirim isi file kunci.**

---

## Bagian 3: Hal yang tidak boleh dilakukan

- **Jangan hapus data browser** (cookies, riwayat, "clear site data") untuk situs beta.solpg.io. Kunci programmu disimpan di sana. Kalau terhapus dan kamu belum menyimpan file kuncinya, programmu tidak bisa diubah lagi.
- **Jangan ganti browser atau laptop** untuk memasang ulang. Cukup satu orang dan satu browser yang memasang program.
- **Jangan unggah file kunci** ke GitHub, WhatsApp, atau ke mana pun.
- **Jangan tulis data rahasia tempat magang** di logbook. Semua yang ditulis ke Solana bisa dibaca siapa saja, selamanya.
