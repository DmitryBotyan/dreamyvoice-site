"use client";

import { useState } from "react";
import { clientConfig } from "@/lib/client-config";
import type { PublicUser } from "@/lib/types";
import styles from "./profile.module.css";

type Props = {
  user: PublicUser;
};

type EmailStatus = "idle" | "sending" | "sent" | "error";

export function EmailSection({ user }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<EmailStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<EmailStatus>("idle");

  const hasEmail = Boolean(user.email);
  const isVerified = user.emailVerified;
  const pendingEmail = user.pendingEmail ?? null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch(
        `${clientConfig.apiProxyBasePath}/profile/email`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? "Email не обновился — попробуйте ввести адрес снова");
      }

      setStatus("sent");
      setIsEditing(false);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  async function handleResend() {
    setResendStatus("sending");
    try {
      const res = await fetch(
        `${clientConfig.apiProxyBasePath}/auth/resend-verification`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      setResendStatus(res.ok ? "sent" : "error");
    } catch {
      setResendStatus("error");
    }
  }

  return (
    <div className={styles.profilePanel}>
      <div className={styles.profilePanelHeader}>
        <h2>Email</h2>
        <p>
          {pendingEmail
            ? `Ждём подтверждения на ${pendingEmail}. Пока адрес не сменится.`
            : hasEmail
              ? isVerified
                ? "Подтверждён"
                : "Не подтверждён. Проверьте почту или запросите письмо повторно."
              : "Добавьте email, чтобы восстанавливать доступ к аккаунту."}
        </p>
      </div>

      {hasEmail && !isEditing && (
        <div className={styles.emailCurrent}>
          <span className={styles.emailValue}>{user.email}</span>
          {!isVerified && (
            <span className={styles.emailUnverified}>Не подтверждён</span>
          )}
          {pendingEmail && (
            <span className={styles.emailUnverified}>
              → {pendingEmail}: ждёт подтверждения
            </span>
          )}
        </div>
      )}

      {isEditing || !hasEmail ? (
        <form onSubmit={handleSubmit} className={styles.emailForm}>
          <div className={styles.fieldGroup}>
            <label htmlFor="profile-email" className={styles.fieldLabel}>
              {hasEmail ? "Новый email" : "Email"}
            </label>
            <input
              id="profile-email"
              className={styles.textInput}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={254}
              required
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" disabled={status === "sending"}>
              {status === "sending"
                ? "Отправляем..."
                : hasEmail
                  ? "Сменить email"
                  : "Добавить email"}
            </button>
            {hasEmail && (
              <button
                type="button"
                className={styles.emailCancelButton}
                onClick={() => {
                  setIsEditing(false);
                  setStatus("idle");
                  setError(null);
                }}
              >
                Отмена
              </button>
            )}
          </div>

          {status === "sent" && (
            <p className={styles.feedbackSuccess}>
              Письмо отправлено на {email || user.email}. Адрес сменится после
              перехода по ссылке.
            </p>
          )}
          {error && (
            <p className={styles.feedbackError} role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className={styles.formActions}>
          <button type="button" onClick={() => setIsEditing(true)}>
            {isVerified ? "Сменить email" : "Изменить email"}
          </button>

          {!isVerified && (
            <button
              type="button"
              className={styles.emailResendButton}
              onClick={handleResend}
              disabled={resendStatus === "sending"}
            >
              {resendStatus === "sending"
                ? "Отправляем..."
                : resendStatus === "sent"
                  ? "Отправлено"
                  : "Отправить повторно"}
            </button>
          )}
        </div>
      )}

      {resendStatus === "error" && (
        <p className={styles.feedbackError} role="alert">
          Письмо не отправилось — это сбой на нашей стороне, попробуйте ещё раз.
        </p>
      )}
    </div>
  );
}
