import { CloudinaryUploadField } from "../../../components/admin/cloudinary-upload-field";
import { AdminStatusBadge } from "../../../components/admin/admin-shell";
import { ADMIN_ROLE_OPTIONS } from "../../../lib/admin/admins";
import styles from "../../../components/admin/admin-shell.module.css";

export function ActivePill({ active }) {
  return (
    <AdminStatusBadge
      label={active ? "aktif" : "nonaktif"}
      tone={active ? "success" : "danger"}
    />
  );
}

export function RolePill({ role }) {
  const config = {
    super_admin: { label: "superadmin", tone: "accent" },
    admin: { label: "admin", tone: "info" },
    operator: { label: "operator", tone: "neutral" },
  }[role] || { label: String(role).replaceAll("_", " "), tone: "neutral" };

  return <AdminStatusBadge label={config.label} tone={config.tone} />;
}

export function AdminAvatar({ admin, className = "" }) {
  if (admin?.avatar_url) {
    return (
      <img
        src={admin.avatar_url}
        alt={admin.full_name || "Avatar admin"}
        className={[styles.tableAvatarImage, className].filter(Boolean).join(" ")}
      />
    );
  }

  const initial = admin?.full_name?.slice(0, 1)?.toUpperCase() || "A";

  return (
    <span className={[styles.tableAvatarFallback, className].filter(Boolean).join(" ")}>
      {initial}
    </span>
  );
}

export function AdminFormFields({ admin = null }) {
  return (
    <div className={styles.stack}>
      <CloudinaryUploadField
        label="Avatar"
        name="avatar_url"
        defaultValue={admin?.avatar_url || ""}
        folder="satria-gear/admins"
        variant="avatar"
      />

      <div className={styles.formGrid}>
       

        <label className={styles.field}>
          Nama Lengkap
          <input
            className={styles.input}
            name="full_name"
            defaultValue={admin?.full_name || ""}
            required
          />
        </label>

        <label className={styles.field}>
          Peran
          <select
            className={styles.select}
            name="role"
            defaultValue={admin?.role || "operator"}
          >
            {ADMIN_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Telepon
          <input
            className={styles.input}
            name="phone"
            defaultValue={admin?.phone || ""}
            placeholder="Opsional"
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull} ${styles.checkboxField}`}>
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={admin ? Boolean(admin.is_active) : true}
          />
          Admin aktif
        </label>
      </div>
    </div>
  );
}
