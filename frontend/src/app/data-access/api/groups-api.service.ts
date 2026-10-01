import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { apiParams } from '../../core/http/api-params';
import * as M from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class GroupsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/groups`;

  list(pagination: M.Pagination = {}) {
    return this.http.get<M.Page<M.GroupRead>>(this.url, {
      params: apiParams(pagination),
    });
  }

  get(id: number) {
    return this.http.get<M.GroupRead>(`${this.url}/${id}`);
  }

  create(data: M.GroupCreate) {
    return this.http.post<M.GroupRead>(this.url, data);
  }

  update(id: number, data: M.GroupUpdate) {
    return this.http.patch<M.GroupRead>(`${this.url}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  members(id: number, pagination: M.Pagination = {}) {
    return this.http.get<M.Page<M.GroupMemberRead>>(
      `${this.url}/${id}/members`,
      { params: apiParams(pagination) },
    );
  }

  addMember(id: number, userId: number) {
    return this.http.post<M.GroupMemberRead>(
      `${this.url}/${id}/members`,
      { user_id: userId },
    );
  }

  removeMember(id: number, userId: number) {
    return this.http.delete<void>(
      `${this.url}/${id}/members/${userId}`,
    );
  }

  transferOwnership(id: number, userId: number) {
    return this.http.post<M.GroupMemberRead>(
      `${this.url}/${id}/ownership`,
      { new_owner_user_id: userId },
    );
  }
}