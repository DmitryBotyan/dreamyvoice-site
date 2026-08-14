"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { TeamMember } from "@/lib/types";
import type { CreateEpisodeFormState } from "./actions";
import { EpisodeCreditsEditor } from "./episode-credits-editor";
import styles from "../../styles.module.css";

const initialState: CreateEpisodeFormState = { success: false };

type Props = {
  action: (
    state: CreateEpisodeFormState,
    formData: FormData
  ) => Promise<CreateEpisodeFormState>;
  teamMembers: TeamMember[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Добавляем..." : "Добавить серию"}
    </button>
  );
}

export function AddEpisodeForm({ action, teamMembers }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  // form.reset() не трогает состояние React, поэтому список кредитов сбрасываем сигналом.
  const [creditsResetSignal, setCreditsResetSignal] = useState(0);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setCreditsResetSignal((value) => value + 1);
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className={styles.formCard}>
      <fieldset className={styles.adminFieldset}>
        <legend>Новая серия</legend>

        <div className={`${styles.fieldRow} ${styles.fieldRowNarrow}`}>
          <label>
            Номер
            <input type="number" name="number" min={1} required />
          </label>
          <label>
            Длительность, мин
            <input type="number" name="durationMinutes" min={1} />
          </label>
          <label>
            CDNVideoHub ID
            <input type="text" name="cvhVideoId" placeholder="3536" />
          </label>
        </div>

        <label>
          Ссылка на плеер
          <input
            type="url"
            name="playerSrc"
            placeholder="https://aniqit.com/embed/..."
          />
          <span className={styles.fieldHint}>
            Нужен хотя бы один источник: ссылка или CDNVideoHub ID.
          </span>
        </label>

        <label className={styles.checkboxRow}>
          <input type="checkbox" name="episodePublished" />
          Опубликована
        </label>

        <EpisodeCreditsEditor
          teamMembers={teamMembers}
          resetSignal={creditsResetSignal}
        />
      </fieldset>

      <div className={styles.formFooter}>
        <SubmitButton />
        {state.error ? (
          <p
            role="alert"
            className={`${styles.formStatus} ${styles.formStatusError}`}
          >
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className={`${styles.formStatus} ${styles.formStatusSuccess}`}>
            Серия добавлена.
          </p>
        ) : null}
      </div>
    </form>
  );
}
