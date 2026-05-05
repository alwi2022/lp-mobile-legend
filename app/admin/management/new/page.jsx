import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
} from "../../../../components/admin/admin-shell";
import { getAdminAdminsPageData } from "../../../../lib/admin/admins";
import { createAdminAction } from "../actions";
import { AdminFormFields } from "../admin-form-parts";
import styles from "../../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

export default async function AdminManagementNewPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const data = await getAdminAdminsPageData();
  const canManage = data.currentAdmin?.role === "super_admin";

  return (
    <>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Tambah Admin</h1>
        {canManage ? (
          <div className={styles.formActions}>
            <Link href="/admin/management" className={styles.filterLink}>
              Cancel
            </Link>
            <button type="submit" form="admin-create-form" className={styles.buttonPrimary}>
              Simpan Admin
            </button>
          </div>
        ) : null}
      </div>

      <AdminMessage type={type} message={message || data.error} />

      {canManage ? (
        <div className={styles.formCard}>
          <form id="admin-create-form" action={createAdminAction} className={styles.stack}>
            <input type="hidden" name="return_to" value="/admin/management/new" />
            <AdminFormFields />
          </form>
        </div>
      ) : (
        <AdminEmptyState
          title="Hanya superadmin yang bisa menambah admin"
          description="Masuk dengan akun superadmin untuk membuat admin baru."
        />
      )}
    </>
  );
}
