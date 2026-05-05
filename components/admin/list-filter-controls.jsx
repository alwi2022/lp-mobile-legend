"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "./admin-shell.module.css";

function buildListHref(basePath, status, query) {
  const params = new URLSearchParams();
  const nextQuery = query.trim();

  if (status && status !== "all") {
    params.set("status", status);
  }

  if (nextQuery) {
    params.set("q", nextQuery);
  }

  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

export function AdminListFilterControls({
  basePath,
  filters,
  activeFilter,
  initialQuery,
  searchPlaceholder,
  filterLabel,
}) {
  const router = useRouter();
  const [status, setStatus] = useState(activeFilter);
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  function navigate(nextStatus, nextQuery) {
    startTransition(() => {
      router.replace(buildListHref(basePath, nextStatus, nextQuery));
    });
  }

  return (
    <div className={styles.crudActions}>
      <select
        className={styles.filterSelect}
        value={status}
        onChange={(event) => {
          const nextStatus = event.target.value;
          setStatus(nextStatus);
          navigate(nextStatus, query);
        }}
        disabled={isPending}
        aria-label={filterLabel}
      >
        {filters.map((filter) => (
          <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>
        ))}
      </select>

      <form
        className={styles.searchForm}
        onSubmit={(event) => {
          event.preventDefault();
          navigate(status, query);
        }}
      >
        <input
          className={styles.searchInput}
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          disabled={isPending}
        />
      </form>
    </div>
  );
}
