import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { apiParams } from '../../core/http/api-params';
import * as M from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class PollsApiService {
  private readonly http = inject(HttpClient);

  private url(tripId: number) {
    return `${environment.apiUrl}/trips/${tripId}/polls`;
  }

  list(tripId: number, pagination: M.Pagination = {}) {
    return this.http.get<M.Page<M.PollRead>>(
      this.url(tripId),
      { params: apiParams(pagination) },
    );
  }

  get(tripId: number, id: number) {
    return this.http.get<M.PollDetail>(
      `${this.url(tripId)}/${id}`,
    );
  }

  create(tripId: number, data: M.PollCreate) {
    return this.http.post<M.PollDetail>(this.url(tripId), data);
  }

  update(tripId: number, id: number, data: M.PollUpdate) {
    return this.http.patch<M.PollDetail>(
      `${this.url(tripId)}/${id}`,
      data,
    );
  }

  delete(tripId: number, id: number) {
    return this.http.delete<void>(`${this.url(tripId)}/${id}`);
  }

  close(tripId: number, id: number) {
    return this.http.post<M.PollRead>(
      `${this.url(tripId)}/${id}/close`,
      {},
    );
  }

  addOption(tripId: number, id: number, data: M.PollOptionCreate) {
    return this.http.post<M.PollOptionRead>(
      `${this.url(tripId)}/${id}/options`,
      data,
    );
  }

  updateOption(
    tripId: number,
    id: number,
    optionId: number,
    data: M.PollOptionUpdate,
  ) {
    return this.http.patch<M.PollOptionRead>(
      `${this.url(tripId)}/${id}/options/${optionId}`,
      data,
    );
  }

  deleteOption(tripId: number, id: number, optionId: number) {
    return this.http.delete<void>(
      `${this.url(tripId)}/${id}/options/${optionId}`,
    );
  }

  setVotes(tripId: number, id: number, optionIds: number[]) {
    return this.http.put<M.VoteRead[]>(
      `${this.url(tripId)}/${id}/votes`,
      { option_ids: optionIds },
    );
  }

  results(tripId: number, id: number) {
    return this.http.get<M.PollResults>(
      `${this.url(tripId)}/${id}/results`,
    );
  }
}