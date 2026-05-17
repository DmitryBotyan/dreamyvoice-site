"use client";

import { useState } from "react";
import styles from "./profile.module.css";

type Tab = "profile" | "settings";

type Props = {
  profileContent: React.ReactNode;
  settingsContent: React.ReactNode;
};

export function ProfileTabs({ profileContent, settingsContent }: Props) {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className={styles.tabsRoot}>
      <div className={styles.tabBar} role="tablist">
        <button
          role="tab"
          aria-selected={tab === "profile"}
          className={`${styles.tabBtn}${tab === "profile" ? ` ${styles.tabBtnActive}` : ""}`}
          onClick={() => setTab("profile")}
        >
          Профиль
        </button>
        <button
          role="tab"
          aria-selected={tab === "settings"}
          className={`${styles.tabBtn}${tab === "settings" ? ` ${styles.tabBtnActive}` : ""}`}
          onClick={() => setTab("settings")}
        >
          Настройки
        </button>
      </div>

      <div role="tabpanel">
        {tab === "profile" ? profileContent : settingsContent}
      </div>
    </div>
  );
}
