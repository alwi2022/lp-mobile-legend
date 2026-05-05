import styles from "./setup-required.module.css";

export function SetupRequired({
  eyebrow = "Perlu Pengaturan",
  title = "Supabase belum dikonfigurasi",
  description = "Tambahkan kredensial Supabase dulu supaya auth dan dashboard admin bisa aktif.",
  details = "",
}) {
  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <ul className={styles.list}>
        <li>Salin `.env.example` menjadi `.env.local`.</li>
        <li>Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.</li>
        <li>Jalankan migration database ke project Supabase kamu.</li>
        <li>Buat minimal satu row admin di tabel `admins`.</li>
      </ul>
      {details ? <pre className={styles.details}>{details}</pre> : null}
    </div>
  );
}
