import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import {
  catchError,
  from,
  mergeMap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiUrl(url: string): boolean {
  return url === environment.apiUrl
    || url.startsWith(`${environment.apiUrl}/`);
}

async function normalize(error: unknown): Promise<Error> {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error
      ? error
      : new Error('No se pudo completar la operación.');
  }

  let body = error.error;

  if (body instanceof Blob) {
    try {
      body = JSON.parse(await body.text());
    } catch {
      body = null;
    }
  }

  const message = error.status === 0
    ? 'No se pudo conectar con el servidor.'
    : typeof body?.error?.message === 'string'
      ? body.error.message
      : 'No se pudo completar la operación.';

  return new ApiError(
    message,
    error.status,
    body?.error?.code ?? 'HTTP_ERROR',
    body?.error?.details,
  );
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiUrl(request.url)) {
    return next(request);
  }

  return next(request).pipe(
    catchError(error =>
      from(normalize(error)).pipe(
        mergeMap(normalized => throwError(() => normalized)),
      ),
    ),
  );
};