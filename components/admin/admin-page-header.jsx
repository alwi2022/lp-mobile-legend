"use client";

import { usePathname } from "next/navigation";
import styles from "./admin-shell.module.css";

const PAGE_META = [
  {
    prefix: "/admin/overview",
    eyebrow: "Operasional",
    title: "Overview",
    description:
      "Lihat ringkasan slot, pendaftaran, pertandingan, dan aksi yang paling butuh perhatian panitia hari ini.",
  },
  {
    prefix: "/admin/registrations/",
    eyebrow: "Turnamen",
    title: "Detail Pendaftaran",
    description:
      "Review data tim, cek roster, lalu putuskan apakah tim disetujui, masuk daftar tunggu, atau ditolak.",
  },
  {
    prefix: "/admin/registrations",
    eyebrow: "Turnamen",
    title: "Pendaftaran Peserta",
    description:
      "Pantau semua pendaftaran yang masuk, filter statusnya, lalu buka detail hanya saat perlu mengambil keputusan.",
  },
  {
    prefix: "/admin/teams/",
    eyebrow: "Turnamen",
    title: "Detail Tim Resmi",
    description:
      "Rapikan data tim final, kelola roster, dan pastikan setiap tim siap dipakai di pertandingan.",
  },
  {
    prefix: "/admin/teams",
    eyebrow: "Turnamen",
    title: "Tim Resmi",
    description:
      "Daftar utama semua tim yang sudah lolos verifikasi dan sudah sah dipakai untuk match, bracket, dan publik.",
  },
  {
    prefix: "/admin/matches/new",
    eyebrow: "Turnamen",
    title: "Buat Pertandingan",
    description:
      "Tambahkan satu pertandingan baru dengan struktur ronde, jadwal, dan peserta yang jelas sejak awal.",
  },
  {
    prefix: "/admin/matches/",
    eyebrow: "Turnamen",
    title: "Detail Pertandingan",
    description:
      "Kelola informasi pertandingan, pairing, dan skor per game dalam satu halaman kerja operator.",
  },
  {
    prefix: "/admin/matches",
    eyebrow: "Turnamen",
    title: "Jadwal Pertandingan",
    description:
      "Lihat seluruh pertandingan secara ringkas, filter statusnya, lalu masuk ke detail untuk update skor dan pairing.",
  },
  {
    prefix: "/admin/bracket/",
    eyebrow: "Turnamen",
    title: "Bracket Landing Page",
    description:
      "Bracket publik dibentuk dari match yang sudah dibuat di halaman Pertandingan.",
  },
  {
    prefix: "/admin/bracket",
    eyebrow: "Turnamen",
    title: "Bracket Landing Page",
    description:
      "Cek apakah match Quarter Final, Semi Final, dan Grand Final sudah siap tampil di landing page.",
  },
  {
    prefix: "/admin/streams/new",
    eyebrow: "Turnamen",
    title: "Buat Siaran",
    description:
      "Tambahkan siaran baru, hubungkan ke pertandingan, lalu tentukan mana yang tampil sebagai siaran utama.",
  },
  {
    prefix: "/admin/streams/",
    eyebrow: "Turnamen",
    title: "Detail Siaran",
    description:
      "Kelola status live, link tontonan, embed, dan featured stream tanpa memenuhi halaman daftar siaran.",
  },
  {
    prefix: "/admin/streams",
    eyebrow: "Turnamen",
    title: "Siaran Turnamen",
    description:
      "Daftar semua siaran yang aktif, segera tayang, atau diarsipkan. Halaman ini dibuat untuk scan cepat dan pemilihan stream.",
  },
  {
    prefix: "/admin/settings",
    eyebrow: "Website",
    title: "Pengaturan Website",
    description:
      "Ubah identitas brand, copy beranda, bagian pendaftaran, siaran, dan footer dari satu panel yang lebih terstruktur.",
  },
  {
    prefix: "/admin/management",
    eyebrow: "Akses",
    title: "Akses Admin",
    description:
      "Atur siapa yang boleh masuk dashboard, tentukan perannya, dan jaga supaya akses operasional tetap aman.",
  },
  {
    prefix: "/admin",
    eyebrow: "Operasional",
    title: "Overview",
    description:
      "Lihat ringkasan slot, pendaftaran, pertandingan, dan aksi yang paling butuh perhatian panitia hari ini.",
  },
];

function getPageMeta(pathname, fallbackTitle, fallbackDescription) {
  const match = PAGE_META.find((item) => {
    if (item.prefix === "/admin") {
      return pathname === "/admin";
    }

    return pathname === item.prefix || pathname.startsWith(item.prefix);
  });

  if (match) {
    return match;
  }

  return {
    eyebrow: "Operasional",
    title: fallbackTitle,
    description: fallbackDescription,
  };
}

export function AdminPageHeader({ fallbackTitle, fallbackDescription }) {
  const pathname = usePathname();
  const meta = getPageMeta(pathname, fallbackTitle, fallbackDescription);

  return (
    <div className={styles.header}>
      <span className={styles.menuButton} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <div className={styles.headerMeta}>
        <h1 className={styles.pageTitle}>{meta.title}</h1>
        <p className={styles.pageTrail}>{meta.eyebrow}</p>
      </div>
    </div>
  );
}
