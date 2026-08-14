"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import styles from "./ui.module.css";

type Props = {
  accept?: string;
  buttonLabel?: string;
  hint?: string;
  disabled?: boolean;
  onSelect: (file: File) => void;
  /** Превью выбранного файла, если оно уже загружено. */
  children?: ReactNode;
};

export function FileField({
  accept = "image/png,image/jpeg,image/webp",
  buttonLabel = "Выбрать файл",
  hint,
  disabled = false,
  onSelect,
  children,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Сбрасываем значение, чтобы тот же файл можно было выбрать повторно.
    event.target.value = "";
    if (!file) {
      return;
    }
    setFileName(file.name);
    onSelect(file);
  };

  return (
    <div className={styles.fileField}>
      <div className={styles.fileRow}>
        <button
          type="button"
          className={styles.fileButton}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {buttonLabel}
        </button>
        <span className={styles.fileName}>
          {fileName ?? hint ?? "Файл не выбран"}
        </span>
      </div>
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={handleChange}
      />
    </div>
  );
}
