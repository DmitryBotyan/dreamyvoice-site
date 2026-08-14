-- Смена почты подтверждается до применения: новый адрес живёт в pending_email,
-- а в email попадает только после перехода по ссылке из письма.
ALTER TYPE "TokenType" ADD VALUE IF NOT EXISTS 'EMAIL_CHANGE';

ALTER TABLE "users" ADD COLUMN "pending_email" TEXT;
