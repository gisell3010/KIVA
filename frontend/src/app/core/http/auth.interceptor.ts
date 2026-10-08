import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import {
  catchError,
  from,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ApiError, isApiUrl } from './error.interceptor';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiUrl(request.url)) {
    return next(request);
  }

  const path = request.url
    .slice(environment.apiUrl.length)
    .split('?')[0];

  const cookieOperation = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
    '/support-reports/public',
  ].includes(path) || path.startsWith('/support-reports/public/');

  if (cookieOperation) {
    return next(
      request.clone({
        withCredentials: true,
        setHeaders: {
          'X-KIVA-CSRF': '1',
        },
      }),
    );
  }

  if (path === '/health' || path === '/health/ready') {
    return next(request);
  }

  const auth = inject(AuthService);
  const version = auth.sessionVersion;
  const token = auth.accessToken;

  const authorize = (value: string | null): HttpRequest<unknown> =>
    request.clone({
      withCredentials: true,
      ...(value
        ? { setHeaders: { Authorization: `Bearer ${value}` } }
        : {}),
    });

  return next(authorize(token)).pipe(
    catchError(error => {
      if (
        !(error instanceof HttpErrorResponse)
        || error.status !== 401
        || !token
        || version !== auth.sessionVersion
      ) {
        return throwError(() => error);
      }

      const renewed = auth.accessToken && auth.accessToken !== token
        ? of(auth.accessToken)
        : from(auth.refreshAccessToken());

      return renewed.pipe(
        switchMap(value =>
          next(authorize(value)).pipe(
            catchError(retryError => {
              if (
                retryError instanceof HttpErrorResponse
                && retryError.status === 401
                && version === auth.sessionVersion
              ) {
                auth.clearSession();
              }

              return throwError(() => retryError);
            }),
          ),
        ),
      );
    }),
    map(event => {
      if (version !== auth.sessionVersion) {
        throw new ApiError(
          'La sesión cambió.',
          401,
          'SESSION_CHANGED',
        );
      }

      return event;
    }),
  );
};