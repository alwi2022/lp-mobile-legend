export const DEFAULT_SITE_SETTINGS = {
  brandMark: "/sg.png",
  brandMarkAlt: "Logo Satria Gear",
  brandText: "Satria Gear",
  navItems: [
    { label: "Beranda", href: "/" },
    { label: "Jadwal", href: "/jadwal" },
    { label: "Bracket", href: "/bracket" },
    { label: "Tim", href: "/tim" },
    { label: "Daftar", href: "/register" },
  ],
  hero: {
    eyebrow: "Turnamen Mobile Legends",
    title: "Satria Gear",
    description:
      "Versi website yang lebih rapi dan simpel untuk sistem single elimination. Tim yang kalah langsung tereliminasi, dan tim yang terus menang akan maju sampai grand final lalu jadi juara.",
    primaryAction: { label: "Daftar Tim", href: "/register" },
    secondaryAction: { label: "Lihat Bracket", href: "/bracket" },
    format: "Single Elimination BO3",
  },
  register: {
    eyebrow: "Pendaftaran Tim",
    title: "Pendaftaran tim dipusatkan lewat form internal",
    description:
      "Halaman ini tetap jadi pusat info turnamen, sementara form pendaftarannya diarahkan ke form internal supaya data langsung masuk ke dashboard panitia.",
    checkInDate: "23 April 2026",
    technicalMeeting: "23 April 2026, 19.00 WIB",
    notes: [
      "Setiap tim minimal menyiapkan 5 pemain inti dan 1 cadangan.",
      "Kapten tim wajib aktif di WhatsApp untuk koordinasi jadwal dan briefing.",
      "Format pertandingan menggunakan sistem single elimination BO3.",
      "Tim yang terlambat check-in lebih dari 15 menit bisa dinyatakan WO.",
      "Setelah isi form internal, tim akan masuk antrean verifikasi panitia.",
    ],
    contactLabel: "Kontak Panitia",
    contactValue: "Admin Turnamen: 08xx-xxxx-xxxx",
    ctaLabel: "Form Internal",
    ctaTitle: "Daftar via Form Internal",
    ctaDescription:
      "Pendaftaran tim dipusatkan ke form internal supaya pengiriman data, persetujuan, slot, dan dashboard panitia tetap sinkron.",
    ctaItems: [
      { label: "Metode", value: "Form Internal" },
      { label: "Durasi Isi", value: "1-2 Menit" },
      { label: "Akses", value: "Langsung di Website" },
      { label: "Status", value: "Menunggu Verifikasi" },
    ],
    ctaAction: {
      label: "Daftar Sekarang",
      href: "/register",
    },
  },
  schedule: {
    eyebrow: "Jadwal Pertandingan",
    title: "Jadwal pertandingan",
  },
  status: {
    eyebrow: "Status Turnamen",
    title: "Sistem knockout tanpa lower bracket",
    description:
      "Alurnya langsung 8 tim ke quarter final, lalu 4 tim ke semi final, 2 tim ke grand final, dan yang menang di final jadi juara.",
  },
  bracket: {
    eyebrow: "Playoff Bracket",
    title: "Bracket playoff versi preview",
    description:
      "Preview bracket saya tampilkan dalam ukuran lebih kecil supaya tetap rapi di landing page, tapi bentuk dan garisnya tetap sama seperti halaman bracket penuh.",
  },
  teams: {
    eyebrow: "Daftar Tim",
    title: "Tim utama dan tim yang sudah mendaftar",
    description:
      "Tabel kiri berisi tim resmi. Tabel kanan bisa dipakai untuk menampilkan tim yang sudah dikonfirmasi panitia setelah mengisi form internal.",
  },
  live: {
    eyebrow: "Siaran Langsung",
    title: "Video utama dan daftar pertandingan live",
    description:
      "Pilih match dari daftar di sebelah kanan untuk menampilkan video utama. Nanti tinggal ganti YouTube ID kalau link live resminya sudah ada.",
    featuredLabel: "Siaran Utama",
    listLabel: "Daftar Pertandingan",
    listDescription:
      "Pilih salah satu match di bawah ini untuk mengganti video utama.",
  },
  footer: {
    title: "Satria Gear",
    description: "",
  },
};

export const DEFAULT_TOURNAMENT_CONFIG = {
  maxTeamSlots: 8,
};

export const DEFAULT_BANNER_SLIDES = [
  {
    id: "slide-1",
    imageSrc: "/banner_1.webp",
    alt: "Banner Satria Tournament pembuka pendaftaran season 01",
    href: "/register",
  },
  {
    id: "slide-2",
    imageSrc: "/banner_2.webp",
    alt: "Banner Satria Tournament untuk jadwal dan bracket",
    href: "/bracket",
  },
  {
    id: "slide-3",
    imageSrc: "/banner_3.webp",
    alt: "Banner Satria Tournament untuk tim, siaran, dan FAQ",
    href: "/tim",
  },
];

export const DEFAULT_ABOUT_ITEMS = [
  {
    title: "Format Turnamen",
    description:
      "Turnamen memakai sistem single elimination. Setiap tim yang kalah langsung gugur, sementara tim yang menang lanjut sampai grand final.",
  },
  {
    title: "Alur Pendaftaran",
    description:
      "Semua pendaftaran masuk lewat form internal supaya data tim, roster, persetujuan, dan slot panitia tetap sinkron dalam satu dashboard.",
  },
  {
    title: "Operasional Match",
    description:
      "Panitia bisa mengatur jadwal, input skor per game, sinkronkan bracket, dan memilih siaran utama langsung dari panel admin.",
  },
];

export const DEFAULT_FAQ_ITEMS = [
  {
    question: "Bagaimana cara mendaftar turnamen?",
    answer:
      "Pendaftaran dilakukan lewat halaman /register. Setelah form dikirim, data tim akan masuk ke dashboard panitia untuk diverifikasi sebelum dianggap resmi.",
  },
  {
    question: "Berapa jumlah minimal pemain dalam satu tim?",
    answer:
      "Tim wajib memiliki minimal 5 pemain inti. Jika ingin lebih aman saat hari pertandingan, panitia menyarankan menambahkan 1 pemain cadangan.",
  },
  {
    question: "Apakah turnamen ini online atau offline?",
    answer:
      "Sementara ini format turnamen disiapkan untuk online. Seluruh update jadwal, hasil pertandingan, dan siaran bisa dipantau lewat website.",
  },
  {
    question: "Bagaimana sistem pertandingan berjalan?",
    answer:
      "Turnamen memakai format single elimination. Tim yang kalah langsung gugur, sedangkan tim yang menang akan otomatis maju ke ronde berikutnya sampai grand final.",
  },
  {
    question: "Kapan tim dianggap resmi ikut turnamen?",
    answer:
      "Tim dianggap resmi setelah pendaftaran disetujui panitia. Setelah itu tim akan muncul di halaman tim dan bisa dipakai untuk pertandingan.",
  },
  {
    question: "Di mana saya bisa melihat jadwal dan bracket terbaru?",
    answer:
      "Jadwal lengkap tersedia di halaman /jadwal dan bagan turnamen penuh tersedia di halaman /bracket. Keduanya akan ikut berubah saat admin memperbarui data.",
  },
  {
    question: "Bagaimana kalau link siaran belum tersedia?",
    answer:
      "Jika siaran belum dipublikasikan, halaman /siaran akan tetap menampilkan status terbaru. Setelah admin mengisi link live resmi, video utama akan langsung muncul di sana.",
  },
  {
    question: "Kalau ada pertanyaan operasional, hubungi siapa?",
    answer:
      "Untuk sementara gunakan kontak panitia yang tampil di website. Nanti kontak ini bisa diganti langsung dari dashboard admin tanpa mengubah kode halaman publik.",
  },
  {
    question:
      "Apakah pergantian roster masih boleh setelah pendaftaran dikirim?",
    answer:
      "Untuk versi dummy ini, perubahan roster masih dianggap melalui persetujuan panitia. Praktiknya nanti panitia bisa mengecek ulang roster final dari dashboard admin sebelum hari pertandingan dimulai.",
  },
  {
    question: "Bagaimana sistem check-in sebelum match dimulai?",
    answer:
      "Setiap tim wajib check-in sebelum jadwal pertandingan berjalan. Jika tim belum siap sampai batas toleransi waktu, panitia berhak memberikan keputusan teknis sesuai peraturan turnamen.",
  },
  {
    question:
      "Ke mana peserta harus melapor kalau ada kendala saat pertandingan?",
    answer:
      "Peserta bisa langsung menghubungi kontak panitia yang tampil di website. Untuk versi berikutnya, alur kontak dan tiket kendala bisa ditambah langsung dari dashboard admin.",
  },
];

export const EMPTY_BRACKET_PREVIEW = {
  cards: [],
  connectorBoxes: [
    { id: "box-1", left: 330, top: 91, width: 42, height: 110 },
    { id: "box-2", left: 330, top: 385, width: 42, height: 110 },
    { id: "box-3", left: 330, top: 679, width: 42, height: 110 },
    { id: "box-4", left: 330, top: 973, width: 42, height: 110 },
    { id: "box-5", left: 760, top: 146, width: 46, height: 294 },
    { id: "box-6", left: 760, top: 734, width: 46, height: 294 },
    { id: "box-7", left: 1190, top: 293, width: 48, height: 588 },
  ],
  connectorMids: [
    { id: "mid-1", left: 372, top: 146, width: 98 },
    { id: "mid-2", left: 372, top: 440, width: 98 },
    { id: "mid-3", left: 372, top: 734, width: 98 },
    { id: "mid-4", left: 372, top: 1028, width: 98 },
    { id: "mid-5", left: 806, top: 293, width: 94 },
    { id: "mid-6", left: 806, top: 881, width: 94 },
    { id: "mid-7", left: 1238, top: 587, width: 87 },
  ],
};
