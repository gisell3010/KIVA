import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { apiParams } from '../../core/http/api-params';
import * as M from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class ReservationsApiService {
  private readonly http = inject(HttpClient);

  private url(tripId: number) {
    return `${environment.apiUrl}/trips/${tripId}/reservations`;
  }

  list(tripId: number, pagination: M.Pagination = {}) {
    return this.http.get<M.Page<M.ReservationRead>>(
      this.url(tripId),
      { params: apiParams(pagination) },
    );
  }

  get(tripId: number, id: number) {
    return this.http.get<M.ReservationRead>(
      `${this.url(tripId)}/${id}`,
    );
  }

  create(tripId: number, data: M.ReservationCreate) {
    return this.http.post<M.ReservationRead>(
      this.url(tripId),
      data,
    );
  }

  update(tripId: number, id: number, data: M.ReservationUpdate) {
    return this.http.patch<M.ReservationRead>(
      `${this.url(tripId)}/${id}`,
      data,
    );
  }

  delete(tripId: number, id: number) {
    return this.http.delete<void>(`${this.url(tripId)}/${id}`);
  }
}