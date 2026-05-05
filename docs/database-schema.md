# Database Schema Blueprint

Skema awal ini dibuat untuk Phase 3 dan ditujukan untuk `Supabase Postgres`.
Migration yang sekarang sudah tersedia:

- [supabase/migrations/0001_initial_schema.sql](/c:/Users/imamb/Desktop/mobilelegend/supabase/migrations/0001_initial_schema.sql:1)
- [supabase/migrations/0002_auth_rls.sql](/c:/Users/imamb/Desktop/mobilelegend/supabase/migrations/0002_auth_rls.sql:1)
- [supabase/migrations/0003_public_registration.sql](/c:/Users/imamb/Desktop/mobilelegend/supabase/migrations/0003_public_registration.sql:1)

## Tujuan

- Menjadi source of truth semua data operasional turnamen.
- Mendukung alur `registrasi -> approval -> team resmi -> match -> live score -> bracket`.
- Menyiapkan dasar untuk admin dashboard tanpa CMS terpisah.

## Tabel Inti

- `tournaments`
  Menyimpan event turnamen, kuota slot, format, jadwal penting, dan status keseluruhan turnamen.

- `site_settings`
  Menyimpan konten website publik yang tadi masih hardcode di halaman utama. Satu row per turnamen.

- `admins`
  Mapping user Supabase Auth ke role aplikasi seperti `super_admin`, `admin`, dan `operator`.

- `registrations`
  Submission publik dari form pendaftaran. Belum otomatis jadi tim resmi.

- `registration_players`
  Roster pemain yang dikirim saat registrasi.

- `teams`
  Tim resmi hasil approval admin. Tabel ini yang nanti dipakai untuk jadwal, match, dan bracket.

- `team_players`
  Roster final tim resmi.

- `matches`
  Series match per ronde, venue, best-of, team yang bertanding, total score, winner, dan loser.

- `match_games`
  Detail game di dalam satu series BO3/BO5.

- `bracket_slots`
  Mapping posisi bracket per match, sisi `team_a/team_b`, dan relasi dari winner/loser match sebelumnya.

- `streams`
  Data stream publik seperti YouTube ID, featured stream, dan status live.

## Enum yang Disiapkan

- `tournament_status`
- `tournament_format`
- `admin_role`
- `registration_status`
- `team_status`
- `roster_role`
- `match_status`
- `match_game_status`
- `bracket_slot_side`
- `bracket_source_outcome`
- `stream_platform`
- `stream_status`

## Business Flow yang Sudah Dicakup

### 1. Registrasi Publik

- User submit ke `registrations`
- Roster masuk ke `registration_players`
- Status awal default `pending`
- Submission publik sekarang diproses lewat function `public.submit_registration(...)`
- Jika slot utama sudah penuh, submission baru otomatis masuk `waitlisted`

### 2. Approval Tim

Function `public.promote_registration_to_team(...)` akan:

- mengecek registration target
- mengecek sisa slot turnamen
- membuat row baru di `teams`
- menyalin roster ke `team_players`
- mengubah registration menjadi `approved`

Ini sengaja dibuat di level database supaya flow approval tetap konsisten walaupun nanti dipanggil dari admin dashboard.

### 3. Slot Otomatis

Function `public.remaining_team_slots(...)` dan view `public.tournament_slot_summary` dipakai untuk:

- menghitung jumlah tim approved
- menghitung pending/waitlisted
- menghitung sisa slot riil

### 4. Live Score Series

Trigger di `match_games` akan memanggil `public.refresh_match_scores(...)` untuk:

- menjumlahkan total win team A / team B
- update `score_a_total` dan `score_b_total`
- menentukan `winner_team_id` dan `loser_team_id`
- mengubah status match ke `finished` saat series selesai

### 5. Bracket Otomatis

`bracket_slots` sudah disiapkan untuk model progression:

- tiap match punya 2 slot: `team_a` dan `team_b`
- slot bisa diisi langsung oleh `team_id`
- atau berasal dari `source_match_id + source_outcome`

Artinya saat masuk ke Phase 9 nanti kita tidak perlu ubah struktur dasar lagi, tinggal menambahkan logic auto-advance winner.

## View yang Sudah Disediakan

- `registration_roster_counts`
  Untuk cek jumlah pemain per registration.

- `team_roster_counts`
  Untuk cek jumlah pemain per team resmi.

- `tournament_slot_summary`
  Untuk dashboard admin dan ringkasan slot publik.

## Catatan Desain

- Audit fields `created_at`, `updated_at`, `created_by`, `updated_by` disiapkan hampir di semua tabel.
- `created_by` dan `updated_by` direferensikan ke `auth.users(id)` supaya nanti gampang dipakai dengan Supabase Auth.
- `slugify(...)` disediakan di database untuk mengurangi logic duplikat di aplikasi.
- Partial unique index dipakai untuk mencegah duplicate registration aktif berdasarkan `team_name` dan `captain_contact`.

## Next Step Setelah Schema

Setelah schema ini, langkah implementasi yang paling pas adalah:

1. sambungkan project ke Supabase
2. jalankan migration
3. buat auth + role check untuk admin
4. scaffold `/admin`
5. mulai dari halaman `Registrations`, `Settings`, dan `Matches`

Catatan:

- Fondasi auth SSR + `/admin` shell sekarang sudah ada di app Next.js.
- Yang belum tinggal koneksi ke project Supabase nyata, apply migration, dan isi data admin awal.

## Catatan Validasi

Migration SQL ini sudah disusun agar siap dipakai di Postgres/Supabase, tetapi belum saya eksekusi ke instance database nyata di repo ini karena koneksi Supabase belum dikonfigurasi.
