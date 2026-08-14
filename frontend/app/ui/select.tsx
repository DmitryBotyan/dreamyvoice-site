"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./ui.module.css";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  options: SelectOption[];
  /** Управляемое значение. Без него компонент хранит выбор сам. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Имя скрытого поля — чтобы значение уезжало вместе с формой. */
  name?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
};

export function Select({
  options,
  value,
  defaultValue,
  onChange,
  name,
  placeholder = "Не выбрано",
  ariaLabel,
  disabled = false,
}: Props) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const currentValue = value ?? internalValue;
  const selectedIndex = options.findIndex((option) => option.value === currentValue);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      listRef.current?.focus();
    }
  }, [isOpen]);

  const open = () => {
    if (disabled) {
      return;
    }
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const close = (refocus = true) => {
    setIsOpen(false);
    if (refocus) {
      buttonRef.current?.focus();
    }
  };

  const commit = (index: number) => {
    const option = options[index];
    if (!option) {
      return;
    }
    if (value === undefined) {
      setInternalValue(option.value);
    }
    onChange?.(option.value);
    close();
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, options.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(activeIndex);
    }
  };

  const handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  };

  return (
    <div className={styles.select} ref={rootRef}>
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}

      <button
        ref={buttonRef}
        type="button"
        className={styles.selectTrigger}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        data-open={isOpen ? "true" : undefined}
      >
        <span className={selected ? undefined : styles.selectPlaceholder}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className={styles.selectChevron}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <polyline points="6 9.5 12 15.5 18 9.5" />
        </svg>
      </button>

      {isOpen ? (
        <ul
          id={listboxId}
          ref={listRef}
          className={styles.selectList}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listboxId}-${activeIndex}`}
          onKeyDown={handleListKeyDown}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={option.value === currentValue}
              className={`${styles.selectOption}${
                index === activeIndex ? ` ${styles.selectOptionActive}` : ""
              }`}
              onPointerMove={() => setActiveIndex(index)}
              onClick={() => commit(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
