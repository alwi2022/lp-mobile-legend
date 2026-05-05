"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin-shell.module.css";

const ICONS = {
  overview: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1.3" />
      <rect x="14" y="4" width="6" height="6" rx="1.3" />
      <rect x="4" y="14" width="6" height="6" rx="1.3" />
      <rect x="14" y="14" width="6" height="6" rx="1.3" />
    </>
  ),
  registrations: (
    <>
      <path d="M7 4h10l3 3v13H4V4h3Z" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
      <path d="M8 18h5" />
    </>
  ),
  teams: (
    <>
      <path d="M12 4 20 8v8l-8 4-8-4V8l8-4Z" />
      <path d="M8.5 12h7" />
      <path d="M12 8.5v7" />
    </>
  ),
  matches: (
    <>
      <path d="M6 5h12v14H6z" />
      <path d="M9 9h6" />
      <path d="M9 13h6" />
      <path d="M9 17h3" />
    </>
  ),
  bracket: (
    <>
      <path d="M6 6h5v4H6z" />
      <path d="M6 14h5v4H6z" />
      <path d="M16 10h4v4h-4z" />
      <path d="M11 8h2v8h-2" />
      <path d="M13 12h3" />
    </>
  ),
  streams: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9" />
      <path d="M16.5 7.5a6.4 6.4 0 0 1 0 9" />
      <path d="M4.5 4.5a10.8 10.8 0 0 0 0 15" />
      <path d="M19.5 4.5a10.8 10.8 0 0 1 0 15" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13.5v-3l-2.2-.5-.8-1.8 1.2-2L15 4.7l-1.8 1.3h-2.4L9 4.7 6.8 6.2l1.2 2-.8 1.8-2.2.5v3l2.2.5.8 1.8-1.2 2L9 19.3l1.8-1.3h2.4l1.8 1.3 2.2-1.5-1.2-2 .8-1.8 2.2-.5Z" />
    </>
  ),
  management: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 20a6 6 0 0 1 12 0" />
    </>
  ),
};

function isActivePath(pathname, href) {
  if (href === "/admin/overview") {
    return pathname === "/admin" || pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name }) {
  return (
    <svg
      className={styles.navIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] || ICONS.overview}
    </svg>
  );
}

export function AdminNav({ groups }) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {groups.map((group) => (
        <div key={group.label} className={styles.navGroup}>
          <p className={styles.navGroupTitle}>{group.label}</p>
          {group.items.map((item) => {
            const isActive = isActivePath(pathname, item.href);
            const className = [styles.navLink, isActive ? styles.navLinkActive : ""]
              .filter(Boolean)
              .join(" ");

            return (
              <Link key={item.href} href={item.href} className={className}>
                <NavIcon name={item.icon} />
                <span className={styles.navLinkText}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
