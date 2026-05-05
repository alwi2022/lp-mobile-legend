import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminEmptyState,
  AdminMessage,
} from "../../../../components/admin/admin-shell";
import { getAdminDetailData } from "../../../../lib/admin/admins";
import { deleteAdminAction, updateAdminAction } from "../actions";
import { AdminFormFields } from "../admin-form-parts";
import styles from "../../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

export default async function AdminManagementDetailPage({ params, searchParams }) {
  const route = await params;
  const query = await searchParams;
  const type = typeof query?.type === "string" ? query.type : "";
  const message = typeof query?.message === "string" ? query.message : "";
  const data = await getAdminDetailData(route.adminId);
  const canManage = data.currentAdmin?.role === "super_admin";

  if (!data.admin && !data.error) {
    notFound();
  }

  return (
    <>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Edit Admin</h1>
        {canManage && data.admin ? (
          <div className={styles.formActions}>
            <Link href="/admin/management" className={styles.filterLink}>
              Cancel
            </Link>
            <form action={deleteAdminAction} className={styles.actionForm}>
              <input type="hidden" name="admin_id" value={data.admin.id} />
              <input type="hidden" name="return_to" value="/admin/management" />
              <button type="submit" className={styles.buttonDanger}>
                Hapus
              </button>
            </form>
            <button type="submit" form="admin-update-form" className={styles.buttonPrimary}>
              Simpan Admin
            </button>
          </div>
        ) : null}
      </div>

      <AdminMessage type={type} message={message || data.error} />

      {canManage && data.admin ? (
        <div className={styles.formCard}>
          <form id="admin-update-form" action={updateAdminAction} className={styles.stack}>
            <input type="hidden" name="admin_id" value={data.admin.id} />
            <input
              type="hidden"
              name="return_to"
              value={`/admin/management/${data.admin.id}`}
            />
            <AdminFormFields admin={data.admin} />
          </form>
        </div>
      ) : (
        <AdminEmptyState
          title="Hanya superadmin yang bisa mengubah admin"
          description="Masuk dengan akun superadmin untuk mengedit data admin."
        />
      )}
    </>
  );
}
