"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clientConfig } from "@/lib/client-config";
import {
  BulletListIcon,
  ClearFormatIcon,
  ImageIcon,
  LinkIcon,
  OrderedListIcon,
  QuoteIcon,
  RuleIcon,
  UnlinkIcon,
} from "./editor-icons";
import styles from "../styles.module.css";

type Props = {
  name: string;
  initialHtml?: string;
  /** Инкремент значения очищает редактор (после успешного создания новости). */
  resetSignal?: number;
};

type ToolbarButton = {
  /** Иконка либо текстовая метка — метка для того, что иконкой не объяснить. */
  content: ReactNode;
  title: string;
  command: string;
  value?: string;
  look?: keyof typeof LOOK_STYLES;
  wide?: boolean;
};

const LOOK_STYLES = {
  bold: styles.editorLookBold,
  italic: styles.editorLookItalic,
  underline: styles.editorLookUnderline,
  strike: styles.editorLookStrike,
} as const;

const TOOLBAR: ToolbarButton[][] = [
  [
    { content: "Ж", title: "Полужирный (Ctrl+B)", command: "bold", look: "bold" },
    { content: "К", title: "Курсив (Ctrl+I)", command: "italic", look: "italic" },
    { content: "Ч", title: "Подчёркнутый (Ctrl+U)", command: "underline", look: "underline" },
    { content: "З", title: "Зачёркнутый", command: "strikeThrough", look: "strike" },
  ],
  [
    { content: "Абзац", title: "Обычный абзац", command: "formatBlock", value: "p", wide: true },
    { content: "H2", title: "Заголовок", command: "formatBlock", value: "h2" },
    { content: "H3", title: "Подзаголовок", command: "formatBlock", value: "h3" },
    { content: <QuoteIcon />, title: "Цитата", command: "formatBlock", value: "blockquote" },
  ],
  [
    { content: <BulletListIcon />, title: "Маркированный список", command: "insertUnorderedList" },
    { content: <OrderedListIcon />, title: "Нумерованный список", command: "insertOrderedList" },
    { content: <RuleIcon />, title: "Разделитель", command: "insertHorizontalRule" },
  ],
];

export function RichTextEditor({ name, initialHtml = "", resetSignal = 0 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [html, setHtml] = useState(initialHtml);
  const [isLinkBarOpen, setIsLinkBarOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("https://");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Начальная разметка ставится один раз: дальше содержимым владеет сам contentEditable.
  const initialMarkup = useMemo(() => ({ __html: initialHtml }), [initialHtml]);

  useEffect(() => {
    if (resetSignal === 0) {
      return;
    }
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setHtml("");
    setIsLinkBarOpen(false);
  }, [resetSignal]);

  useEffect(() => {
    // Enter должен давать <p>, а не <div> — иначе разметка разъезжается.
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // Старые браузеры просто оставят поведение по умолчанию.
    }
  }, []);

  const syncHtml = useCallback(() => {
    setHtml(editorRef.current?.innerHTML ?? "");
  }, []);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const range = savedRangeRef.current;
    if (!range) {
      editorRef.current?.focus();
      return;
    }
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    editorRef.current?.focus();
  }, []);

  const runCommand = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      syncHtml();
    },
    [syncHtml]
  );

  const handleLinkApply = useCallback(() => {
    const url = linkValue.trim();
    restoreSelection();

    if (!url || url === "https://") {
      setIsLinkBarOpen(false);
      return;
    }

    document.execCommand("createLink", false, url);
    syncHtml();
    setIsLinkBarOpen(false);
    setLinkValue("https://");
  }, [linkValue, restoreSelection, syncHtml]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) {
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Файл больше 5 МБ");
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `${clientConfig.apiProxyBasePath}/media/covers`,
          { method: "POST", body: formData, credentials: "include" }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          setUploadError(payload?.message ?? "Не удалось загрузить изображение");
          return;
        }

        const data = await response.json();
        restoreSelection();
        document.execCommand(
          "insertHTML",
          false,
          `<img src="/media/covers/${encodeURIComponent(data.key)}" alt="" />`
        );
        syncHtml();
      } catch {
        setUploadError("Не удалось загрузить изображение");
      } finally {
        setIsUploading(false);
      }
    },
    [restoreSelection, syncHtml]
  );

  // Вставка только текстом: иначе в тело приезжает чужая разметка со стилями.
  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      syncHtml();
    },
    [syncHtml]
  );

  return (
    <div className={styles.editor}>
      <input type="hidden" name={name} value={html} />

      <div className={styles.editorToolbar} role="toolbar" aria-label="Форматирование текста">
        {TOOLBAR.map((group, groupIndex) => (
          <div className={styles.editorToolbarGroup} key={groupIndex}>
            {group.map((button) => (
              <button
                key={button.title}
                type="button"
                className={[
                  styles.editorButton,
                  button.wide ? styles.editorButtonWide : "",
                  button.look ? LOOK_STYLES[button.look] : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={button.title}
                aria-label={button.title}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runCommand(button.command, button.value)}
              >
                {button.content}
              </button>
            ))}
          </div>
        ))}

        <div className={styles.editorToolbarGroup}>
          <button
            type="button"
            className={`${styles.editorButton}${
              isLinkBarOpen ? ` ${styles.editorButtonActive}` : ""
            }`}
            title="Вставить ссылку"
            aria-label="Вставить ссылку"
            aria-pressed={isLinkBarOpen}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              saveSelection();
              setIsLinkBarOpen((open) => !open);
            }}
          >
            <LinkIcon />
          </button>
          <button
            type="button"
            className={styles.editorButton}
            title="Убрать ссылку"
            aria-label="Убрать ссылку"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("unlink")}
          >
            <UnlinkIcon />
          </button>
          <button
            type="button"
            className={styles.editorButton}
            title="Вставить изображение"
            aria-label="Вставить изображение"
            onMouseDown={(event) => {
              event.preventDefault();
              saveSelection();
            }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <ImageIcon />
          </button>
          <button
            type="button"
            className={styles.editorButton}
            title="Убрать форматирование"
            aria-label="Убрать форматирование"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("removeFormat")}
          >
            <ClearFormatIcon />
          </button>
        </div>
      </div>

      {isLinkBarOpen ? (
        <div className={styles.editorLinkBar}>
          <input
            type="url"
            value={linkValue}
            autoFocus
            placeholder="https://example.com"
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleLinkApply();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setIsLinkBarOpen(false);
              }
            }}
          />
          <button type="button" className={styles.editorButton} onClick={handleLinkApply}>
            Применить
          </button>
          <button
            type="button"
            className={styles.editorButton}
            onClick={() => setIsLinkBarOpen(false)}
          >
            Отмена
          </button>
        </div>
      ) : null}

      <div
        ref={editorRef}
        className={styles.editorSurface}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Текст новости"
        data-placeholder="Напишите текст новости…"
        onInput={syncHtml}
        onBlur={() => {
          saveSelection();
          syncHtml();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={initialMarkup}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={handleImageUpload}
      />

      {uploadError ? (
        <p role="alert" className={`${styles.formStatus} ${styles.formStatusError}`}>
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
