// Every piece of text shown in the app lives in this file (in Indonesian).
//
// To add another language later: copy `id` into a new object with the same keys, translate the
// values, and point `t` at it. Because the new object must have the type `Strings`, TypeScript
// will complain if a key is missing.

export const id = {
  app: {
    name: 'Paraf',
    tagline: 'Logbook magang di blockchain. Pembimbing diam = disetujui.',
    network: 'Devnet',
  },

  // The intro at the top of the page.
  hero: {
    eyebrow: 'Logbook magang di Solana',
    // The title in three parts: the middle part gets a highlighter mark.
    titleStart: 'Logbook magang yang jujur, dan ',
    titleMark: 'tidak bisa digantung',
    titleEnd: ' pembimbing.',
    text: 'Magang menulis satu halaman setiap hari. Pembimbing memparaf dalam batas waktu. Kalau pembimbing diam sampai waktunya habis, halaman otomatis disetujui. Semua tercatat di blockchain, jadi siapa saja bisa mengeceknya.',
    ctaIntern: 'Tulis logbook',
    ctaVerify: 'Cek logbook publik',
    replayStamp: 'Klik kertasnya untuk melihat stempel PARAF',
    featuresEyebrow: 'Cara kerja',
    featuresTitle: 'Empat aturan yang dijaga blockchain',
    features: [
      {
        icon: 'clock',
        title: 'Tidak bisa ditulis mundur',
        text: 'Halaman hanya bisa ditulis pada harinya. Jam blockchain yang menentukan "hari ini", bukan jam laptop.',
      },
      {
        icon: 'pen',
        title: 'Diparaf tepat waktu',
        text: 'Pembimbing menyetujui atau menolak setiap halaman di dalam jendela paraf.',
      },
      {
        icon: 'hourglass',
        title: 'Diam = disetujui',
        text: 'Pembimbing sibuk dan tidak sempat memparaf? Setelah waktunya habis, halaman tetap disetujui.',
      },
      {
        icon: 'lock',
        title: 'Uang saku terkunci',
        text: 'Uang saku dikunci sejak awal dan hanya bisa diambil untuk hari yang disetujui.',
      },
    ] as const,
  },

  theme: {
    toDark: 'Ganti ke mode gelap',
    toLight: 'Ganti ke mode terang',
  },

  tabs: {
    label: 'Pilih peranmu',
    eyebrow: 'Coba sekarang',
    title: 'Pilih peranmu',
  },

  // One entry per tab. `tab` is the tab name, `sub` the small line under it.
  roles: {
    register: {
      tab: 'Daftar',
      sub: 'Koordinator',
      label: 'Koordinator',
      title: 'Daftarkan magang',
      intro:
        'Koordinator (misalnya kampus) mendaftarkan magang: siapa magang dan pembimbingnya, berapa lama satu hari, dan berapa lama waktu pembimbing untuk memparaf.',
    },
    intern: {
      tab: 'Magang',
      sub: 'Tulis logbook hari ini',
      label: 'Magang',
      title: 'Logbook-mu',
      intro: 'Tulis satu halaman per hari, pada hari itu juga. Halaman tidak bisa ditulis belakangan, jadi setiap halaman jujur.',
    },
    supervisor: {
      tab: 'Pembimbing',
      sub: 'Paraf atau tolak',
      label: 'Pembimbing',
      title: 'Halaman yang menunggu paraf',
      intro: 'Paraf setiap halaman sebelum waktunya habis. Kalau kamu diam, halaman dihitung disetujui.',
    },
    verify: {
      tab: 'Cek Publik',
      sub: 'Tanpa dompet',
      label: 'Siapa saja',
      title: 'Cek logbook',
      intro: 'Siapa saja bisa mengecek logbook magang langsung dari blockchain. Tidak perlu dompet.',
    },
  },

  common: {
    loading: 'Memuat…',
    copy: 'Salin',
    copied: 'Tersalin',
    day: (day: number) => `Hari ${day}`,
    dayOf: (day: number, total: number) => `Hari ${day} dari ${total}`,
    publicPage: 'Logbook publik',
  },

  wallet: {
    connectIntern: 'Sambungkan dompet magang untuk melihat logbook-mu.',
    connectSupervisor: 'Sambungkan dompet pembimbing untuk melihat halaman yang menunggu paraf.',
    connectCoordinator: 'Sambungkan dompet koordinator. Dompet ini membayar akun magang dan uang saku.',
    phantomHint: 'Pakai Phantom? Buka Settings → Developer Settings → nyalakan Testnet Mode, lalu pilih Solana Devnet.',
    faucetHint: 'Butuh SOL devnet? Gratis di faucet.solana.com.',
    connectedAs: 'Tersambung sebagai',
    switchAccount: 'Ganti akun',
    switchHint: 'Baru ganti akun di Phantom? Klik "Ganti akun" supaya web ikut berganti.',
    // Labels for the wallet button in the header (from @solana/wallet-adapter-react-ui).
    button: {
      'change-wallet': 'Ganti dompet',
      connecting: 'Menyambungkan…',
      'copy-address': 'Salin alamat',
      copied: 'Tersalin',
      disconnect: 'Putuskan',
      'has-wallet': 'Sambungkan',
      'no-wallet': 'Pilih Dompet',
    },
  },

  setup: {
    title: 'Perlu diatur: program ID',
    missing: 'VITE_PROGRAM_ID belum diisi, jadi web tidak tahu program mana yang dipakai.',
    invalid: 'VITE_PROGRAM_ID bukan alamat Solana yang valid.',
    placeholder:
      'VITE_PROGRAM_ID masih berisi contoh 1111…1111. Pakai program ID yang muncul di Solana Playground setelah deploy.',
    steps: [
      'Deploy program dari Solana Playground (beta.solpg.io), lalu salin program ID-nya.',
      'Buat file app/.env.local berisi baris VITE_PROGRAM_ID=<program ID-mu> (lihat app/.env.example).',
      'Jalankan ulang npm run dev. Di Vercel, isi VITE_PROGRAM_ID di Environment Variables lalu deploy ulang.',
    ],
    programMissing:
      'Tidak ada program di alamat VITE_PROGRAM_ID di devnet. Cek ID-nya dan pastikan program sudah di-deploy ke devnet.',
    notProgram: 'Alamat VITE_PROGRAM_ID ada di devnet, tapi bukan program.',
  },

  footer: {
    public: 'Semua yang ditulis ke Solana bersifat publik dan permanen. Tulis ringkasan singkat dan jangan pernah menulis hal rahasia.',
    program: 'Program',
    clockSyncing: 'Jam blockchain: menyinkronkan…',
    clockOffset: (seconds: number) =>
      seconds === 0
        ? 'Jam blockchain: sama dengan perangkatmu'
        : `Jam blockchain: ${Math.abs(seconds)} detik ${seconds > 0 ? 'lebih cepat dari' : 'lebih lambat dari'} perangkatmu`,
  },

  register: {
    internLabel: 'Alamat dompet magang',
    internHelp: 'Dompet yang akan menulis halaman harian.',
    useMyWallet: 'Pakai dompetku',
    supervisorLabel: 'Alamat dompet pembimbing',
    supervisorHelp: 'Dompet yang memparaf atau menolak halaman. Harus berbeda dari dompet magang.',
    hostOrgLabel: 'Tempat magang',
    hostOrgHelp: 'Publik dan permanen.',
    hostOrgPlaceholder: 'Contoh: PT Maju Jaya',
    startLabel: 'Mulai',
    startNow: 'Sekarang',
    startLater: 'Pada waktu tertentu',
    startAtLabel: 'Waktu mulai (waktu lokalmu)',
    startAtHelp: 'Dari sekarang sampai 366 hari ke depan.',
    dayLengthLabel: 'Panjang satu hari',
    dayPresets: {
      real: 'Hari sungguhan (24 jam)',
      demo: 'Demo (3 menit)',
      custom: 'Atur sendiri',
    },
    reviewLabel: 'Jendela paraf',
    reviewHelp: 'Berapa lama pembimbing bisa memparaf sebuah halaman, dihitung sejak halaman dikirim.',
    reviewPresets: {
      twoDays: '2 hari',
      oneDay: '1 hari',
      demo: 'Demo (2 menit)',
      custom: 'Atur sendiri',
    },
    secondsLabel: 'Detik',
    daysLabel: 'Jumlah hari (halaman)',
    stipendLabel: 'Uang saku per hari yang disetujui, dalam SOL (opsional)',
    stipendHelp: 'Kosongkan kalau tidak ada uang saku. Seluruh jumlahnya dikunci dari dompetmu sekarang.',
    stipendPlaceholder: '0.01',
    totalLocked: (sol: string) => `Kamu akan mengunci ${sol} sekarang, ditambah sedikit deposit sewa untuk akun magang.`,
    selfRegistered:
      'Kamu mendaftarkan dompetmu sendiri sebagai magang. Orang yang mengecek akan melihat magang ini sebagai "didaftarkan sendiri (tempat magang belum terverifikasi)".',
    submit: 'Daftarkan magang',
    txLabel: 'Daftarkan magang',
    errors: {
      address: 'Masukkan alamat dompet Solana yang valid.',
      notWallet: 'Ini alamat program (PDA), bukan dompet. Tempel alamat dompet.',
      sameWallet: 'Dompet magang dan pembimbing harus berbeda.',
      hostOrgEmpty: 'Isi tempat magang.',
      hostOrgLong: (bytes: number, max: number) => `Terlalu panjang: ${bytes} dari ${max} byte.`,
      startAt: 'Pilih waktu mulai yang valid.',
      startPast: 'Waktu ini sudah lewat. Pilih waktu mulai dari sekarang, atau pilih "Sekarang".',
      startTooFar: 'Pilih waktu mulai paling lambat 366 hari dari sekarang.',
      seconds: (min: number, max: number) =>
        `Isi detik dalam bilangan bulat dari ${min} sampai ${max.toLocaleString('id-ID')} (31 hari).`,
      days: (max: number) => `Isi bilangan bulat dari 1 sampai ${max}.`,
      stipend: 'Isi jumlah dalam SOL, misalnya 0.01 (paling banyak 9 angka desimal, pakai titik).',
    },
    successTitle: 'Magang berhasil didaftarkan',
    successText: 'Kirim link ini ke magang dan pembimbing. Siapa saja bisa membukanya untuk mengecek logbook.',
    shareLabel: 'Link untuk dibagikan',
    addressLabel: 'Akun magang (PDA)',
    openVerify: 'Buka di Cek Publik',
    another: 'Daftarkan lagi',
  },

  intern: {
    noneTitle: 'Tidak ada magang untuk dompet ini',
    noneText:
      'Minta koordinatormu mendaftarkan dompet ini sebagai magang. Untuk demo, kamu bisa mendaftarkan dirimu sendiri di tab Daftar (akan ditandai belum terverifikasi).',
    choose: 'Magang',
    notStartedTitle: 'Belum dimulai',
    startsIn: 'Mulai dalam',
    endedTitle: 'Magang sudah selesai',
    endedText: 'Semua hari sudah lewat, jadi tidak ada halaman lagi yang bisa ditulis.',
    timeLeft: 'Sisa waktu hari ini',
    chainClockNote: 'Dihitung dengan jam blockchain, bukan jam perangkatmu.',
    writtenTitle: 'Halaman hari ini sudah ditulis',
    nextDayIn: 'Hari berikutnya mulai dalam',
    summaryLabel: 'Ringkasan publik',
    summaryHelp: 'Disimpan di Solana: publik dan permanen. Jangan tulis hal rahasia.',
    summaryPlaceholder: 'Hari ini kamu mengerjakan apa?',
    bytes: (used: number, max: number) => `${used} / ${max} byte`,
    fullTextLabel: 'Catatan lengkap (opsional, pribadi)',
    fullTextHelp:
      'Tetap di perangkat ini. Yang dikirim ke blockchain hanya sidik jarinya: hash SHA-256 dari catatan yang dicampur "salt" acak, jadi tidak ada yang bisa menebak isinya. Nanti kamu bisa membuktikan catatannya tidak diubah.',
    submit: 'Kirim halaman hari ini',
    tooLate: (seconds: number) =>
      `Sisa waktu hari ini kurang dari ${seconds} detik. Tunggu hari berikutnya: blockchain mungkin sudah menghitung halamanmu sebagai milik besok.`,
    rentNote: 'Setiap halaman butuh sedikit deposit sewa (sekitar 0.003 SOL devnet).',
    saveCopyTitle: 'Simpan file halamanmu',
    saveCopyText:
      'Untuk membuktikan halaman ini nanti, kamu butuh file ini: isinya catatan lengkap dan salt acaknya. Tidak ada yang bisa membuatnya ulang, termasuk web ini, jadi simpan sekarang.',
    saveCopy: 'Simpan sebagai .txt',
    txSubmit: (day: number) => `Kirim halaman hari ${day}`,
    historyTitle: 'Halaman-halamanmu',
    historyEmpty: 'Belum ada hari yang dimulai.',
    reviewLeft: 'Pembimbing masih bisa memparaf selama',
    silentNote: 'Pembimbing diam sampai waktunya habis. Klik Sahkan supaya halaman ini dihitung disetujui.',
    missingNote: 'Tidak ada halaman yang ditulis pada hari ini.',
    todayNotWritten: 'Belum ditulis.',
    stipendTitle: 'Uang saku',
    stipendPerDay: 'Per hari disetujui',
    approvedDays: 'Hari disetujui',
    paidDays: 'Hari dibayar',
    claimable: 'Bisa diambil',
    stillLocked: 'Masih terkunci',
    claim: 'Ambil uang saku',
    txClaim: 'Ambil uang saku',
    finalizeFirst: (count: number) =>
      `${count} halaman yang didiamkan pembimbing siap disahkan. Sahkan dulu supaya ikut dihitung.`,
    backdateTitle: 'Coba curang (demo)',
    backdateText:
      'Minta program menerima halaman untuk hari lain. Ini hanya simulasi: dompetmu tidak diminta tanda tangan dan tidak ada yang dikirim.',
    backdateButton: (day: number) => `Coba tulis mundur ke hari ${day}`,
    futureButton: (day: number) => `Coba tulis hari ${day} duluan`,
    backdateNone: 'Belum ada yang bisa dicoba: tidak ada hari lain yang belum punya halaman.',
    backdateRunning: 'Bertanya ke program…',
    backdateBlocked: 'Ditolak program',
    backdateAllowed: 'Simulasinya lolos. Seharusnya tidak begitu, jadi cek programnya.',
  },

  supervisor: {
    noneTitle: 'Dompet ini belum menjadi pembimbing di magang mana pun',
    noneText: 'Setelah koordinator mendaftarkanmu sebagai pembimbing, halaman logbook magangmu muncul di sini.',
    queueTitle: 'Menunggu paraf',
    queueEmpty: 'Tidak ada yang perlu diparaf sekarang.',
    timeLeft: 'Sisa waktu paraf',
    submittedAt: 'Dikirim',
    approve: 'Paraf',
    reject: 'Tolak',
    reasonLabel: 'Alasan menolak',
    hasFullText: 'Magang melampirkan catatan lengkap pribadi (sidik jarinya ada di blockchain).',
    noFullText: 'Tidak ada catatan lengkap pribadi.',
    silentTitle: 'Lewat tanpa paraf',
    silentText: 'Kamu diam sampai waktunya habis, jadi halaman ini dihitung disetujui setelah ada yang mengesahkannya.',
    internshipsTitle: 'Magang bimbinganmu',
    internLabel: 'Magang',
    txApprove: (day: number) => `Paraf hari ${day}`,
    txReject: (day: number) => `Tolak hari ${day}`,
  },

  // Reason codes the supervisor can pick when rejecting. The index is the code stored on-chain.
  reasons: ['Tanpa alasan', 'Tidak hadir', 'Kurang lengkap', 'Lainnya'],
  unknownReason: (code: number) => `Kode alasan ${code}`,

  verify: {
    lookupLabel: 'Alamat magang',
    lookupHelp: 'Alamat akun magang, seperti di link yang dibagikan (…?i=<alamat>).',
    lookupButton: 'Cek',
    invalid: 'Itu bukan alamat Solana yang valid.',
    notFound: 'Tidak ada magang Paraf di alamat ini di devnet.',
    selfRegistered: 'Didaftarkan sendiri (tempat magang belum terverifikasi)',
    selfRegisteredHelp: 'Magang mendaftarkan magang ini dengan dompetnya sendiri, jadi belum ada yang menjamin tempat magangnya.',
    walletsTitle: 'Dompet',
    internWallet: 'Magang',
    supervisorWallet: 'Pembimbing',
    coordinatorWallet: 'Koordinator',
    scheduleTitle: 'Jadwal',
    startsAt: 'Mulai',
    dayLength: 'Panjang satu hari',
    reviewWindow: 'Jendela paraf',
    progress: 'Progres',
    notStarted: 'Belum dimulai',
    finished: 'Selesai',
    totalsTitle: 'Ringkasan',
    submitted: 'Halaman ditulis',
    approved: 'Disetujui (termasuk karena diam)',
    autoApproved: 'Disetujui karena diam',
    rejected: 'Ditolak',
    missing: 'Hari terlewat',
    stipendPaid: 'Uang saku dibayar',
    calendarTitle: 'Kalender',
    calendarHelp: 'Pilih satu hari untuk melihat halamannya.',
    submittedAt: 'Dikirim',
    reviewedAt: 'Diparaf',
    finalizedAt: 'Disahkan',
    reason: 'Alasan',
    fingerprint: 'Sidik jari catatan lengkap (SHA-256 dengan salt)',
    noFingerprint: 'Tidak ada catatan lengkap pribadi yang dilampirkan.',
    pageAccount: 'Akun halaman',
    internshipAccount: 'Akun magang',
    noPage: 'Tidak ada halaman untuk hari ini.',
    hashTitle: 'Cek catatan lengkap',
    hashHelp:
      'Buka file yang disimpan magang untuk halaman ini, atau tempel isinya. File itu berisi catatan lengkap dan salt acaknya. Keduanya di-hash di browser-mu lalu dibandingkan dengan sidik jari di blockchain. Tidak ada yang diunggah.',
    hashFileLabel: 'File halaman yang disimpan (.txt)',
    hashLabel: 'Isi file',
    hashButton: 'Cek',
    hashMatch: 'Cocok: ini persis catatan yang dulu dikirim.',
    hashNoMatch: 'Tidak cocok: file ini milik halaman lain, atau isinya sudah diubah.',
    hashNotAFile: 'Ini bukan file halaman Paraf. File harus punya baris "Salt:" dan baris "Full text".',
  },

  status: {
    approved: 'Diparaf',
    autoApproved: 'Disetujui karena diam',
    rejected: 'Ditolak',
    pending: 'Menunggu paraf',
    silent: 'Didiamkan: siap disahkan',
    missing: 'Terlewat',
    today: 'Hari ini',
    upcoming: 'Akan datang',
    legend: 'Keterangan',
  },

  // The big stamp that drops onto the screen when a page is approved.
  stamp: {
    approved: 'PARAF',
    approvedSub: 'Disetujui pembimbing',
    autoApproved: 'SAH',
    autoApprovedSub: 'Diam = disetujui',
  },

  finalize: {
    button: 'Sahkan (diam = setuju)',
    needWallet: 'Sambungkan dompet apa saja untuk membayar biaya jaringan yang sangat kecil.',
    tx: (day: number) => `Sahkan hari ${day}`,
  },

  tx: {
    simulating: 'Mengecek ke program…',
    signing: 'Menunggu konfirmasi di dompetmu… (klik Confirm dalam 1 menit)',
    confirming: 'Mencatat ke devnet…',
    done: 'Berhasil.',
    failed: 'Tidak berhasil.',
    viewTx: 'Lihat transaksi',
    recent: 'Transaksi terbaru',
    dismiss: 'Tutup',
    logs: 'Log program',
  },

  // Readable Indonesian for each error of the Paraf program (by its name in lib.rs).
  programErrors: {
    SupervisorIsIntern: 'Dompet pembimbing dan magang harus berbeda.',
    HostOrgTooLong: 'Nama tempat magang terlalu panjang (maksimal 40 byte).',
    InvalidSchedule: 'Jadwal tidak valid: cek waktu mulai, panjang hari, jendela paraf, dan jumlah hari.',
    MathOverflow: 'Angkanya terlalu besar.',
    NotStarted: 'Magang ini belum dimulai.',
    InternshipEnded: 'Magang ini sudah selesai.',
    NotCurrentPeriod: 'Kamu hanya bisa menulis halaman untuk hari ini.',
    InvalidSummary: 'Ringkasan harus 1 sampai 160 byte.',
    NotIntern: 'Hanya magang di magang ini yang bisa melakukannya.',
    NotSupervisor: 'Hanya pembimbing magang ini yang bisa memparaf.',
    WrongInternship: 'Halaman ini milik magang lain.',
    NotPending: 'Halaman ini sudah diparaf.',
    ReviewWindowClosed: 'Waktu paraf sudah habis.',
    ReviewWindowOpen: 'Waktu paraf belum habis.',
    NothingToClaim: 'Belum ada uang saku yang bisa diambil.',
    InsufficientFunds: 'Sisa uang saku di magang ini tidak cukup.',
  } as Record<string, string>,

  errors: {
    programRule: (name: string, code: number) => `Ditolak program Paraf (${name}, error ${code}). Tidak ada yang berubah.`,
    anchorRule: (code: number) => `Ditolak Anchor, framework yang dipakai program ini (error ${code}).`,
    cancelled: 'Kamu membatalkan permintaan di dompetmu.',
    noSol: 'SOL devnet di dompetmu tidak cukup. Minta SOL devnet gratis di faucet.solana.com, lalu coba lagi.',
    alreadyExists: 'Ini sudah ada di blockchain. Satu hari hanya bisa punya satu halaman.',
    programMissing: 'Program Paraf tidak ditemukan di devnet. Cek VITE_PROGRAM_ID.',
    expired: 'Transaksinya kedaluwarsa sebelum tercatat. Silakan coba lagi.',
    tooSlow: 'Kamu terlalu lama sebelum klik Confirm di dompet.',
    tooSlowHint: 'Transaksi Solana hanya berlaku sekitar 1 menit. Klik tombolnya lagi, lalu langsung klik Confirm.',
    rateLimited: 'Server devnet sedang sibuk (terlalu banyak permintaan). Tunggu beberapa detik lalu coba lagi.',
    network: 'Tidak bisa terhubung ke server Solana devnet. Cek koneksi internetmu.',
    wallet: 'Dompetmu tidak bisa mengirim transaksinya.',
    walletHint: 'Kalau pakai Phantom, pastikan Testnet Mode menyala dan Solana Devnet dipilih.',
    connectFirst: 'Sambungkan dompetmu dulu.',
    insecureHash: 'Browser-mu hanya mengizinkan hashing di halaman aman (https atau localhost).',
    txFailed: 'Jaringan menolak transaksi ini.',
    unknown: 'Terjadi kesalahan.',
  },

  time: {
    day: (n: number) => `${n} hari`,
    hour: (n: number) => `${n} jam`,
    minute: (n: number) => `${n} menit`,
    second: (n: number) => `${n} detik`,
    // Short units for countdowns, for example "2 mnt 05 dtk".
    short: { d: ' hari', h: ' jam', m: ' mnt', s: ' dtk' },
  },
};

export type Strings = typeof id;

/** The text currently in use. */
export const t: Strings = id;
