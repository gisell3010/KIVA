import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { apiParams } from '../../core/http/api-params';
import * as M from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = environment.apiUrl;

  dashboard() {
    return this.http.get<M.AdminDashboardRead>(
      `${this.url}/admin/dashboard`,
    );
  }

  supportDashboard() {
    return this.http.get<M.SupportDashboardRead>(
      `${this.url}/support/dashboard`,
    );
  }

  superAdminDashboard() {
    return this.http.get<M.AdminDashboardRead>(
      `${this.url}/super-admin/dashboard`,
    );
  }

  users(filters: M.UserFilters = {}) {
    return this.http.get<M.Page<M.UserRead>>(
      `${this.url}/admin/users`,
      { params: apiParams(filters) },
    );
  }

  user(id: number) {
    return this.http.get<M.UserRead>(
      `${this.url}/admin/users/${id}`,
    );
  }

  updateUser(id: number, data: M.UserAdminUpdate) {
    return this.http.patch<M.UserRead>(
      `${this.url}/admin/users/${id}`,
      data,
    ).pipe(
      tap(() => {
        if (this.auth.currentUserId() === id) {
          this.auth.clearSession();
        }
      }),
    );
  }

  supportUsers(filters: M.UserFilters = {}) {
    return this.http.get<M.Page<M.UserRead>>(
      `${this.url}/support/users`,
      { params: apiParams(filters) },
    );
  }

  supportUser(id: number) {
    return this.http.get<M.UserRead>(
      `${this.url}/support/users/${id}`,
    );
  }

  groups(filters: M.Pagination & { q?: string } = {}) {
    return this.http.get<M.Page<M.GroupRead>>(
      `${this.url}/admin/groups`,
      { params: apiParams(filters) },
    );
  }

  trips(
    filters: M.Pagination & {
      q?: string;
      status?: M.TripStatus;
      group_id?: number;
    } = {},
  ) {
    return this.http.get<M.Page<M.TripRead>>(
      `${this.url}/admin/trips`,
      { params: apiParams(filters) },
    );
  }

  supportGroups(userId: number, page = 1) {
    return this.http.get<M.Page<M.GroupRead>>(`${this.url}/support/users/${userId}/groups`, { params: { page, page_size: 10 } });
  }
  supportTrips(userId: number, page = 1) {
    return this.http.get<M.Page<M.TripRead>>(`${this.url}/support/users/${userId}/trips`, { params: { page, page_size: 10 } });
  }
  revokeUserSessions(userId: number) {
    return this.http.post<void>(`${this.url}/support/users/${userId}/revoke-sessions`, {});
  }
  supportTrip(tripId: number) {
    return this.http.get<M.TripRead>(`${this.url}/support/trips/${tripId}`);
  }
  diagnostic(tripId: number, section: string, page = 1) {
    return this.http.get<M.Page<{ id: number; title: string; detail: string }>>(`${this.url}/support/trips/${tripId}/diagnostic/${section}`, { params: { page, page_size: 20 } });
  }

  config() {
    return this.http.get<M.SystemConfigRead>(
      `${this.url}/super-admin/config`,
    );
  }
}