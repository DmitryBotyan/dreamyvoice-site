'use client';

import { useEffect, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CreateEpisodeFormState } from "./actions";
import styles from "../styles.module.css";

const initialState: CreateEpisodeFormState = { success: false };

type Props = {
  action: (state: CreateEpisodeFormState, formData: FormData) => Promise<CreateEpisodeFormState>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Добавляем...' : 'Добавить серию'}
    </button>
  );
}

export function AddEpisodeForm({ action }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className={styles.formCard}>
      <fieldset className={styles.adminFieldset}>
        <legend>Новая серия</legend>
        <label>
          Номер
          <input type="number" name="number" min={1} required />
        </label>
        <label>
          Название
          <input type="text" name="episodeName" minLength={3} maxLength={128} required />
        </label>
        <label>
          Ссылка на плеер (iframe src)
          <input type="url" name="playerSrc" required />
        </label>
        <label>
          Длительность в минутах
          <input type="number" name="durationMinutes" min={1} />
        </label>
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="episodePublished" />
          Опубликована
        </label>
      </fieldset>
      <div className={styles.formFooter}>
        <SubmitButton />
        {state.error ? (
          <p role="alert" className={`${styles.formStatus} ${styles.formStatusError}`}>
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className={`${styles.formStatus} ${styles.formStatusSuccess}`}>Серия добавлена.</p>
        ) : null}
      </div>
    </form>
  );
}
