import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { apiParams } from '../../core/http/api-params';
import * as M from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = `${environment.apiUrl}/users`;

  me() {
    return this.http.get<M.UserRead>(`${this.url}/me`).pipe(
      tap(user => this.auth.updateUser(user)),
    );
  }

  updateMe(data: M.UserUpdate) {
    return this.http.patch<M.UserRead>(`${this.url}/me`, data).pipe(
      tap(user => this.auth.updateUser(user)),
    );
  }

  changePassword(data: M.PasswordChangeRequest) {
    return this.http.put<void>(
      `${this.url}/me/password`,
      data,
    ).pipe(
      tap(() => this.auth.clearSession()),
    );
  }

  changeEmail(data: M.EmailChangeRequest) {
    return this.http.put<M.UserRead>(
      `${this.url}/me/email`,
      data,
    ).pipe(
      tap(() => this.auth.clearSession()),
    );
  }

  search(username: string, pagination: M.Pagination = {}) {
    return this.http.get<M.Page<M.UserPublic>>(
      `${this.url}/search`,
      {
        params: apiParams({
          ...pagination,
          username,
        }),
      },
    );
  }

  uploadProfileImage(file: File) {
    const data = new FormData();
    data.append('file', file);

    return this.http.put<M.UserRead>(
      `${this.url}/me/profile-image`,
      data,
    ).pipe(
      tap(user => this.auth.updateUser(user)),
    );
  }

  deleteProfileImage() {
    return this.http.delete<void>(
      `${this.url}/me/profile-image`,
    ).pipe(
      tap(() => {
        const user = this.auth.user();

        if (user) {
          this.auth.updateUser({
            ...user,
            profile_image: null,
          });
        }
      }),
    );
  }

  listSessions() {
    return this.http.get<M.AuthSessionRead[]>(
      `${environment.apiUrl}/auth/sessions`,
    );
  }

  revokeSession(id: number) {
    return this.http.delete<void>(
      `${environment.apiUrl}/auth/sessions/${id}`,
    );
  }

  logoutAll() {
    return this.http.post<void>(
      `${environment.apiUrl}/auth/logout-all`,
      {},
    ).pipe(
      tap(() => this.auth.clearSession()),
    );
  }

  listNotifications(
    pagination: M.Pagination = {},
    isRead?: boolean,
  ) {
    let params = apiParams(pagination);

    if (isRead !== undefined) {
      params = params.set('is_read', String(isRead));
    }

    return this.http.get<M.Page<M.NotificationRead>>(
      `${environment.apiUrl}/notifications`,
      { params },
    );
  }

  unreadCount() {
    return this.http.get<M.UnreadCount>(
      `${environment.apiUrl}/notifications/unread-count`,
    );
  }

  markAsRead(id: number) {
    return this.http.patch<M.NotificationRead>(
      `${environment.apiUrl}/notifications/${id}`,
      { is_read: true },
    );
  }

  markAllAsRead() {
    return this.http.post<void>(
      `${environment.apiUrl}/notifications/read-all`,
      {},
    );
  }

  deleteNotification(id: number) {
    return this.http.delete<void>(
      `${environment.apiUrl}/notifications/${id}`,
    );
  }

  profileImage(id: number) {
    return this.http.get(
      `${this.url}/${id}/profile-image`,
      { responseType: 'blob' },
    );
  }
}