"use client";

import { createContext, useContext, useState } from "react";
import styles from "../../../components/admin/admin-shell.module.css";

const SettingsTabsContext = createContext(null);

export function SettingsTabs({ tabs, defaultValue, children }) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.id || "");

  return (
    <SettingsTabsContext.Provider value={activeTab}>
      <div className={styles.settingsTabs}>
        <div className={styles.settingsTabList} role="tablist" aria-label="Konten Website">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`settings-panel-${tab.id}`}
                className={[
                  styles.settingsTabButton,
                  // active ? styles.settingsTabButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className={styles.settingsTabPanels}>{children}</div>
      </div>
    </SettingsTabsContext.Provider>
  );
}

export function SettingsTabPanel({ value, children }) {
  const activeTab = useContext(SettingsTabsContext);
  const active = activeTab === value;

  return (
    <div
      id={`settings-panel-${value}`}
      role="tabpanel"
      hidden={!active}
      className={styles.settingsTabPanel}
    >
      {children}
    </div>
  );
}
