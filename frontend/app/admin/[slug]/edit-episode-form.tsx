"use client";

import { useEffect, useRef, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Episode } from "@/lib/types";
import type { UpdateEpisodeFormState } from "./actions";
import styles from "../styles.module.css";

type Props = {
  episode: Episode;
  action: (
    state: UpdateEpisodeFormState,
    formData: FormData
  ) => Promise<UpdateEpisodeFormState>;
};

const initialState: UpdateEpisodeFormState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Сохраняем..." : "Сохранить"}
    </button>
  );
}

export function EditEpisodeForm({ episode, action }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  return (
    <div className={styles.editEpisodeWrapper}>
      <button
        type="button"
        className={styles.adminLinkButton}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Свернуть" : "Редактировать"}
      </button>

      {open && (
        <form
          ref={formRef}
          action={formAction}
          className={styles.editEpisodeForm}
        >
          <label>
            Ссылка на плеер (iframe src)
            <input
              type="url"
              name="playerSrc"
              defaultValue={episode.playerSrc ?? ""}
              placeholder="https://aniqit.com/embed/..."
            />
            <span className={styles.fieldHint}>Оставьте пустым, чтобы убрать</span>
          </label>

          <label>
            CDNVideoHub ID тайтла
            <input
              type="text"
              name="cvhVideoId"
              defaultValue={episode.cvhVideoId ?? ""}
              placeholder="Например: 3536"
            />
            <span className={styles.fieldHint}>
              ID тайтла в агрегаторе (KP / MAL / MDL). Оставьте пустым, чтобы убрать.
            </span>
          </label>

          <label>
            Длительность в минутах
            <input
              type="number"
              name="durationMinutes"
              defaultValue={episode.durationMinutes ?? ""}
              min={1}
            />
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              name="episodePublished"
              defaultChecked={episode.published}
            />
            Опубликована
          </label>

          <div className={styles.formFooter}>
            <SubmitButton />
            <button
              type="button"
              className={styles.adminLinkButton}
              onClick={() => setOpen(false)}
            >
              Отмена
            </button>
            {state.error && (
              <p
                role="alert"
                className={`${styles.formStatus} ${styles.formStatusError}`}
              >
                {state.error}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
