export type DomainErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST';

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

export const notFound = (message: string, details?: unknown): DomainError => ({
  code: 'NOT_FOUND',
  message,
  details,
});

export const conflict = (message: string, details?: unknown): DomainError => ({
  code: 'CONFLICT',
  message,
  details,
});

export const validationError = (message: string, details?: unknown): DomainError => ({
  code: 'VALIDATION_ERROR',
  message,
  details,
});

export const unauthorized = (message = 'Unauthorized', details?: unknown): DomainError => ({
  code: 'UNAUTHORIZED',
  message,
  details,
});

export const forbidden = (message = 'Forbidden', details?: unknown): DomainError => ({
  code: 'FORBIDDEN',
  message,
  details,
});

export const badRequest = (message: string, details?: unknown): DomainError => ({
  code: 'BAD_REQUEST',
  message,
  details,
});

export const internalError = (message = 'Internal server error', details?: unknown): DomainError => ({
  code: 'INTERNAL_ERROR',
  message,
  details,
});

