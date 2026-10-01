import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { apiParams } from '../../core/http/api-params';
import * as M from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class TripsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/trips`;

  list(filters: M.Pagination & { group_id?: number } = {}) {
    return this.http.get<M.Page<M.TripRead>>(this.url, {
      params: apiParams(filters),
    });
  }

  get(id: number) {
    return this.http.get<M.TripRead>(`${this.url}/${id}`);
  }

  create(data: M.TripCreate) {
    return this.http.post<M.TripRead>(this.url, data);
  }

  update(id: number, data: M.TripUpdate) {
    return this.http.patch<M.TripRead>(`${this.url}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  members(id: number, pagination: M.Pagination = {}) {
    return this.http.get<M.Page<M.TripMemberRead>>(
      `${this.url}/${id}/members`,
      { params: apiParams(pagination) },
    );
  }

  addMember(id: number, data: M.TripMemberAdd) {
    return this.http.post<M.TripMemberRead>(
      `${this.url}/${id}/members`,
      data,
    );
  }

  updateMember(
    id: number,
    userId: number,
    role: 'ORGANIZER' | 'MEMBER',
  ) {
    return this.http.patch<M.TripMemberRead>(
      `${this.url}/${id}/members/${userId}`,
      { role },
    );
  }

  removeMember(id: number, userId: number) {
    return this.http.delete<void>(
      `${this.url}/${id}/members/${userId}`,
    );
  }

  transferOwnership(id: number, userId: number) {
    return this.http.post<M.TripMemberRead>(
      `${this.url}/${id}/ownership`,
      { new_owner_user_id: userId },
    );
  }
}