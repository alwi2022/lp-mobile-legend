# Panduan Workflow

## Alur Umum

Sistem ini dibagi menjadi 2 sisi:

- `Website publik`
  Dipakai pengunjung dan calon peserta untuk melihat info turnamen, jadwal, bracket, tim, siaran, dan mengirim pendaftaran.

- `Panel admin`
  Dipakai panitia untuk mengelola konten website, memeriksa pendaftaran, mengatur tim resmi, membuat pertandingan, mengisi skor, mengelola bracket, dan mengatur siaran.

## Workflow Panitia

### 1. Login Admin

Masuk lewat `/login` menggunakan akun yang ada di `Supabase Auth` dan sudah terdaftar di tabel `admins`.

### 2. Siapkan Turnamen

Masuk ke `/admin/settings`.

Kalau belum ada turnamen aktif:
- klik `Buat Turnamen Awal`

Kalau sudah ada:
- ubah konten halaman depan
- ubah judul hero
- ubah CTA pendaftaran
- ubah kontak panitia
- ubah copy siaran dan footer

### 3. Terima Pendaftaran Publik

Pendaftaran publik masuk dari `/register`.

Semua kiriman akan masuk ke:
- `/admin/registrations`

Di halaman ini panitia bisa:
- `Setujui`
- `Daftar Tunggu`
- `Tolak`

Kalau pendaftaran disetujui:
- data tim akan dipromosikan menjadi tim resmi
- tim akan masuk ke tabel `teams`

### 4. Kelola Tim Resmi

Masuk ke `/admin/teams`.

Di sini panitia bisa:
- membuat tim resmi manual
- mengubah status tim
- mengatur unggulan
- mengatur kapten
- mengelola roster final

Halaman ini dipakai untuk memastikan tim yang tampil di pertandingan memang sudah final.

### 5. Buat Jadwal Pertandingan

Masuk ke `/admin/matches`.

Di sini panitia bisa:
- membuat pertandingan
- memilih tim A dan tim B
- mengatur ronde
- mengatur nomor pertandingan
- mengatur format BO
- mengatur venue
- mengatur status pertandingan

### 6. Input Skor per Game

Masih di `/admin/matches`, setiap pertandingan punya section `Skor Live per Game`.

Operator bisa:
- tambah game 1, game 2, game 3, dst
- isi skor tim A dan tim B
- pilih pemenang game
- ubah status game

Setelah skor game masuk:
- total skor seri akan terhitung otomatis
- pemenang pertandingan akan ikut terisi otomatis

### 7. Atur Struktur Bracket

Masuk ke `/admin/bracket`.

Di sini panitia bisa:
- membuat slot bracket
- menentukan slot `team_a` atau `team_b`
- menaruh tim langsung ke slot
- atau menghubungkan slot ke hasil pertandingan sebelumnya lewat `source_match` dan `source_outcome`

Kalau struktur slot sudah benar:
- klik `Sinkronkan Progres Bracket`

Saat hasil pertandingan selesai:
- pemenang bisa naik otomatis ke slot berikutnya
- pairing pertandingan berikutnya ikut tersinkron

### 8. Atur Siaran

Masuk ke `/admin/streams`.

Di sini panitia bisa:
- membuat siaran baru
- menghubungkan siaran ke pertandingan
- memilih siaran utama
- mengisi YouTube ID / URL siaran / URL sematan
- mengatur status siaran

## Workflow Pengunjung

### 1. Lihat Website

Pengunjung membuka `/`.

Website publik akan menampilkan:
- info turnamen
- sisa slot
- jadwal
- status tim
- bracket
- daftar tim
- siaran

### 2. Daftar Turnamen

Pengunjung membuka `/register`.

Peserta mengisi:
- nama tim
- singkatan tim
- nama kapten
- kontak kapten
- email kapten
- region / kota
- roster pemain

Setelah dikirim:
- data masuk ke antrean admin
- panitia meninjau dari `/admin/registrations`

### 3. Lihat Hasil Setelah Disetujui

Kalau sudah disetujui:
- tim bisa muncul di halaman publik
- tim bisa dipakai di pertandingan
- bracket dan jadwal akan mengikuti data admin

## Urutan Operasional Yang Disarankan

Urutan pakai sistem yang paling aman saat event:

1. `Pengaturan`
2. `Pendaftaran`
3. `Tim`
4. `Pertandingan`
5. `Bracket`
6. `Siaran`
7. `Skor Live`

## Catatan Penting

- Kalau `turnamen` belum ada, banyak halaman admin akan menunggu data dasar.
- Kalau `tim` belum ada, pertandingan dan bracket belum bisa berjalan normal.
- Kalau `slot bracket` belum dipetakan, pemenang pertandingan belum punya tujuan otomatis.
- Kalau `siaran` belum dihubungkan, homepage tetap aman tapi bagian live belum maksimal.
