import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "../../app/admin/actions";
import { AdminNav } from "./admin-nav";
import { AdminPageHeader } from "./admin-page-header";
import styles from "./admin-shell.module.css";

const NAV_GROUPS = [
  {
    label: "Menu Utama",
    items: [
      { href: "/admin/overview", label: "Overview", icon: "overview" },
      { href: "/admin/registrations", label: "Pendaftaran", icon: "registrations" },
      { href: "/admin/teams", label: "Tim Resmi", icon: "teams" },
      { href: "/admin/matches", label: "Pertandingan", icon: "matches" },
      { href: "/admin/bracket", label: "Bracket", icon: "bracket" },
      { href: "/admin/streams", label: "Siaran", icon: "streams" },
    ],
  },
  {
    label: "Pengelolaan",
    items: [
      { href: "/admin/settings", label: "Website", icon: "settings" },
      { href: "/admin/management", label: "Management", icon: "management" },
    ],
  },
];

export function AdminShell({
  admin,
  title = "Dashboard Turnamen",
  description = "Panel kerja utama untuk operasional turnamen.",
  children,
}) {
  return (
    <div className={styles.app}>
      <div className={styles.frame}>
        <aside className={styles.sidebar}>
          <div className={styles.brandBlock}>
            <Image
              src="/sg.png"
              alt="Satria Gear"
              width={64}
              height={64}
              className={styles.brandMark}
              priority
            />
            <div>
              <h1 className={styles.brandTitle}>Satria Gear</h1>
              <p className={styles.brandCopy}>Tournament CMS</p>
            </div>
          </div>

          <AdminNav groups={NAV_GROUPS} />
        </aside>

        <main className={styles.content}>
          <header className={styles.topbar}>
            <AdminPageHeader fallbackTitle={title} fallbackDescription={description} />

            <details className={styles.accountMenu}>
              <summary className={styles.accountSummary}>
                <span className={styles.accountName}>{admin.full_name}</span>
                <span className={styles.accountAvatar} aria-hidden="true">
                  {admin.full_name?.slice(0, 1) || "A"}
                </span>
              </summary>
              <div className={styles.accountDropdown}>
                <form action={logoutAction}>
                  <button type="submit" className={styles.logoutButton}>
                    Logout
                  </button>
                </form>
              </div>
            </details>
          </header>

          <div className={styles.children}>{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminSection({ title, description = "", actions = null, children }) {
  return (
    <section className={styles.pageSection}>
      {title || description || actions ? (
        <div className={styles.pageSectionHeader}>
          <div>
            {title ? <h3 className={styles.pageSectionTitle}>{title}</h3> : null}
            {description ? <p className={styles.sectionIntro}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.pageSectionHeaderActions}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminMessage({ type = "", message = "" }) {
  if (!message) {
    return null;
  }

  const className = [
    styles.message,
    type === "error" ? styles.messageError : "",
    type === "success" ? styles.messageSuccess : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <p className={className}>{message}</p>;
}

export function AdminStatCard({ label, value, helper = "", compact = false }) {
  return (
    <article className={[styles.metaStat, compact ? styles.metaStatCompact : ""].join(" ")}>
      <span className={styles.metaLabel}>{label}</span>
      <strong className={styles.metaStatValue}>{value}</strong>
      {helper ? <p className={styles.subtle}>{helper}</p> : null}
    </article>
  );
}

export function AdminStatusBadge({ label, tone = "neutral" }) {
  const toneClassName = {
    neutral: styles.statusNeutral,
    info: styles.statusInfo,
    success: styles.statusSuccess,
    warning: styles.statusWarning,
    danger: styles.statusDanger,
    accent: styles.statusAccent,
  }[tone];

  return (
    <span className={[styles.statusPill, toneClassName].filter(Boolean).join(" ")}>
      {label}
    </span>
  );
}

export function AdminEmptyState({ title, description, action = null }) {
  return (
    <div className={styles.emptyState}>
      <strong className={styles.cardTitle}>{title}</strong>
      <p className={styles.subtle}>{description}</p>
      {action ? <div className={styles.buttonRow}>{action}</div> : null}
    </div>
  );
}

export function AdminDetailCard({ label, children }) {
  return (
    <div className={styles.detailCard}>
      <span className={styles.detailLabel}>{label}</span>
      {children}
    </div>
  );
}

export function AdminInfoGrid({ items }) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <article key={item.title} className={styles.card}>
          <h4 className={styles.cardTitle}>{item.title}</h4>
          <p className={styles.pageCopy}>{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export function AdminList({ items }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function AdminInlineLink({ href, children }) {
  return (
    <Link href={href} className={styles.filterLink}>
      {children}
    </Link>
  );
}

export function AdminWelcomeCard({ title, description }) {
  return (
    <section className={styles.welcomeCard}>
      <h2 className={styles.welcomeTitle}>{title}</h2>
      <p className={styles.welcomeCopy}>{description}</p>
    </section>
  );
}
