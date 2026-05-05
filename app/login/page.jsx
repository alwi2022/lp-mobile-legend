import { redirect } from "next/navigation";
import { getCurrentAdmin } from "../../lib/auth/admin";
import { normalizeNextPath } from "../../lib/auth/utils";
import { SetupRequired } from "../../components/admin/setup-required";
import { loginAction } from "./actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : "";
  const next = normalizeNextPath(params?.next, "/admin/overview");
  const state = await getCurrentAdmin();

  if (!state.configured) {
    return <SetupRequired />;
  }

  if (!state.error && state.admin?.is_active) {
    redirect("/admin/overview");
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Akses Panitia</p>
        <h1 className={styles.title}>Masuk Admin</h1>
        <p className={styles.copy}>
          Login pakai akun Supabase Auth yang sudah dipetakan ke tabel `admins`.
          Setelah berhasil, akses akan diarahkan ke dashboard panitia.
        </p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <form action={loginAction} className={styles.form}>
          <input type="hidden" name="next" value={next} />

          <label className={styles.field}>
            Email
            <input className={styles.input} type="email" name="email" autoComplete="email" required />
          </label>

          <label className={styles.field}>
            Password
            <input
              className={styles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className={styles.button}>
            Masuk
          </button>
        </form>

        <p className={styles.note}>
          Kalau login berhasil tapi tetap ditolak masuk, biasanya akun tersebut belum
          punya row aktif di tabel `admins`.
        </p>
      </section>
    </div>
  );
}
