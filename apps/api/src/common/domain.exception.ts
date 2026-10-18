import { HttpException, HttpStatus } from '@nestjs/common';
import { DomainError, DomainErrorCode, isErr, Result } from '@ticketing/common';

const STATUS_MAP: Record<DomainErrorCode, HttpStatus> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  BAD_REQUEST: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

export class DomainException extends HttpException {
  constructor(public readonly domainError: DomainError) {
    super(
      {
        error: {
          code: domainError.code,
          message: domainError.message,
          details: domainError.details,
        },
      },
      STATUS_MAP[domainError.code] ?? HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export function unwrapResult<T>(result: Result<T, DomainError>): T {
  if (isErr(result)) {
    throw new DomainException(result.error);
  }
  return result.value;
}

