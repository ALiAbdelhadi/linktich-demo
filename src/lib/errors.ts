// User-facing API errors in the visitor's language.
// Services throw AppError('<key>'); route handlers turn any error into text with errorText().
import { ZodError } from 'zod';
import { getMessages } from '@/i18n/server';
import { errorMessages } from '@/i18n/messages/errors';

export type ErrorKey = keyof typeof errorMessages.ar;

export class AppError extends Error {
  constructor(public readonly key: ErrorKey) {
    super(key);
    this.name = 'AppError';
  }
}

function isErrorKey(value: string): value is ErrorKey {
  return Object.prototype.hasOwnProperty.call(errorMessages.ar, value);
}

/** Text for a known error key, in the current language. */
export function errorMessage(key: ErrorKey): string {
  return getMessages(errorMessages)[key];
}

/**
 * Text for any caught error, in the current language.
 * Unknown errors are logged and replaced by `fallback`, so internal details never reach users.
 */
export function errorText(error: unknown, fallback: ErrorKey = 'generic'): string {
  if (error instanceof AppError) return errorMessage(error.key);

  if (error instanceof ZodError) {
    const first = error.issues[0]?.message;
    return errorMessage(first && isErrorKey(first) ? first : 'invalidInput');
  }

  console.error(error);
  return errorMessage(fallback);
}
