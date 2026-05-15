import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue?.message?.trim() || 'Ошибка валидации';
    return res.status(400).json({
      message,
      issues: err.issues,
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Ошибка на сервере — попробуйте повторить запрос' });
};
