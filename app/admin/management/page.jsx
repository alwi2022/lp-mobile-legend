import Link from "next/link";
import {
  AdminEmptyState,
  AdminMessage,
  AdminSection,
} from "../../../components/admin/admin-shell";
import { getAdminAdminsPageData } from "../../../lib/admin/admins";
import {
  ActivePill,
  AdminAvatar,
  RolePill,
} from "./admin-form-parts";
import { deleteAdminAction } from "./actions";
import styles from "../../../components/admin/admin-shell.module.css";

export const dynamic = "force-dynamic";

function adminMatchesSearch(admin, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    admin.full_name,
    admin.user_id,
    admin.role,
    admin.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminManagementPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : "";
  const message = typeof params?.message === "string" ? params.message : "";
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const data = await getAdminAdminsPageData();
  const canManage = data.currentAdmin?.role === "super_admin";
  const admins = data.admins.filter((admin) => adminMatchesSearch(admin, query));

  return (
    <>
      <AdminMessage type={type} message={message || data.error} />

      <AdminSection>
        <div className={styles.stack}>
          <div className={styles.crudHeader}>
            <h1 className={styles.crudTitle}>Management Admin</h1>
            <div className={styles.crudActions}>
              <form action="/admin/management" className={styles.searchForm}>
                <input
                  className={styles.searchInput}
                  name="q"
                  defaultValue={query}
                  placeholder="Cari admin..."
                />
              </form>
              {canManage ? (
                <Link href="/admin/management/new" className={styles.buttonPrimary}>
                  + Tambah Admin
                </Link>
              ) : null}
            </div>
          </div>

          {admins.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Avatar</th>
                    <th>Nama</th>
                    <th>Role</th>
                    <th>Telepon</th>
                    <th>Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin, index) => (
                    <tr key={admin.id}>
                      <td>{index + 1}</td>
                      <td>
                        <AdminAvatar admin={admin} />
                      </td>
                      <td>
                        <p className={styles.tableTitle}>{admin.full_name}</p>
                      </td>
                      <td>
                        <RolePill role={admin.role} />
                        <p className={styles.tableSubtle}>
                        </p>
                      </td>
                      <td>
                        <p className={styles.tableTitle}>{admin.phone || "-"}</p>
                      </td>
                      <td>
                        <p className={styles.tableTitle}>{formatDateTime(admin.created_at)}</p>
                      </td>
                      <td>
                        {canManage ? (
                          <div className={styles.tableActions}>
                            <Link
                              href={`/admin/management/${admin.id}`}
                              className={styles.filterLink}
                            >
                              Edit
                            </Link>
                            <form action={deleteAdminAction} className={styles.actionForm}>
                              <input type="hidden" name="admin_id" value={admin.id} />
                              <input type="hidden" name="return_to" value="/admin/management" />
                              <button type="submit" className={styles.buttonDanger}>
                                Hapus
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className={styles.tableSubtle}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmptyState
              title="Belum ada admin untuk pencarian ini"
              description="Ubah kata kunci pencarian atau tambahkan admin baru dari tombol di atas."
              action={
                canManage ? (
                  <Link href="/admin/management/new" className={styles.buttonPrimary}>
                    Tambah Admin
                  </Link>
                ) : null
              }
            />
          )}
        </div>
      </AdminSection>
    </>
  );
}
