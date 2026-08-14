"use client";

import { useEffect, useId, useState } from "react";
import type { EpisodeCredit, TeamMember } from "@/lib/types";
import { EPISODE_CREDIT_ROLE_SUGGESTIONS } from "@/lib/episode-credits";
import { Select } from "../../ui/select";
import styles from "../../styles.module.css";

type Row = {
  key: string;
  teamMemberId: string;
  name: string;
  role: string;
};

type Props = {
  teamMembers: TeamMember[];
  initialCredits?: EpisodeCredit[];
  /** Инкремент значения очищает список (после успешного создания серии). */
  resetSignal?: number;
};

/** Пустое значение селекта = имя вписывается вручную. */
const MANUAL_VALUE = "";

let rowCounter = 0;
const createRowKey = () => {
  rowCounter += 1;
  return `credit-${rowCounter}`;
};

const toRows = (credits: EpisodeCredit[] = []): Row[] =>
  credits.map((credit) => ({
    key: createRowKey(),
    teamMemberId: credit.teamMemberId ?? MANUAL_VALUE,
    name: credit.teamMemberId ? "" : credit.name,
    role: credit.role,
  }));

const createEmptyRow = (): Row => ({
  key: createRowKey(),
  teamMemberId: MANUAL_VALUE,
  name: "",
  role: "",
});

export function EpisodeCreditsEditor({
  teamMembers,
  initialCredits,
  resetSignal = 0,
}: Props) {
  const datalistId = useId();
  const [rows, setRows] = useState<Row[]>(() => toRows(initialCredits));

  const memberOptions = [
    { value: MANUAL_VALUE, label: "Вписать вручную" },
    ...teamMembers.map((member) => ({
      value: member.id,
      label: `${member.name} — ${member.role}`,
    })),
  ];

  useEffect(() => {
    setRows(toRows(initialCredits));
    // initialCredits намеренно не в зависимостях: сброс идёт только по сигналу.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  const updateRow = (key: string, changes: Partial<Row>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row))
    );
  };

  const handleMemberChange = (key: string, teamMemberId: string) => {
    const member = teamMembers.find((item) => item.id === teamMemberId);
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key) {
          return row;
        }
        return {
          ...row,
          teamMemberId,
          // Роль участника подставляем как заготовку, если поле ещё пустое.
          role: row.role.trim().length > 0 ? row.role : member?.role ?? "",
        };
      })
    );
  };

  return (
    <div className={styles.creditsEditor}>
      <span className={styles.creditsEditorTitle}>Над серией работали</span>

      <datalist id={datalistId}>
        {EPISODE_CREDIT_ROLE_SUGGESTIONS.map((role) => (
          <option key={role} value={role} />
        ))}
      </datalist>

      {rows.length > 0 ? (
        <ul className={styles.creditsRows}>
          {rows.map((row) => (
            <li key={row.key} className={styles.creditsRow}>
              <div className={styles.creditsField}>
                <Select
                  options={memberOptions}
                  value={row.teamMemberId}
                  onChange={(value) => handleMemberChange(row.key, value)}
                  ariaLabel="Участник"
                />
              </div>

              {row.teamMemberId ? (
                // Поля уезжают параллельными массивами, поэтому пустое имя тоже отправляем.
                <input type="hidden" name="creditName" value="" />
              ) : (
                <div className={styles.creditsField}>
                  <input
                    type="text"
                    name="creditName"
                    value={row.name}
                    maxLength={128}
                    placeholder="Имя"
                    onChange={(event) =>
                      updateRow(row.key, { name: event.currentTarget.value })
                    }
                  />
                </div>
              )}

              <div className={styles.creditsField}>
                <input
                  type="text"
                  name="creditRole"
                  value={row.role}
                  list={datalistId}
                  maxLength={128}
                  placeholder="Роль"
                  onChange={(event) =>
                    updateRow(row.key, { role: event.currentTarget.value })
                  }
                />
              </div>

              <button
                type="button"
                className={styles.adminLinkButton}
                onClick={() =>
                  setRows((current) => current.filter((item) => item.key !== row.key))
                }
              >
                Убрать
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className={styles.adminLinkButton}
        onClick={() => setRows((current) => [...current, createEmptyRow()])}
      >
        + Добавить участника
      </button>
    </div>
  );
}
