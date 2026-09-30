import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { apiParams } from '../../core/http/api-params';
import * as M from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class DestinationsApiService {
  private readonly http = inject(HttpClient);

  private url(tripId: number) {
    return `${environment.apiUrl}/trips/${tripId}/destinations`;
  }

  list(tripId: number, pagination: M.Pagination = {}) {
    return this.http.get<M.Page<M.DestinationRead>>(
      this.url(tripId),
      { params: apiParams(pagination) },
    );
  }

  get(tripId: number, id: number) {
    return this.http.get<M.DestinationRead>(
      `${this.url(tripId)}/${id}`,
    );
  }

  create(tripId: number, data: M.DestinationCreate) {
    return this.http.post<M.DestinationRead>(this.url(tripId), data);
  }

  update(tripId: number, id: number, data: M.DestinationUpdate) {
    return this.http.patch<M.DestinationRead>(
      `${this.url(tripId)}/${id}`,
      data,
    );
  }

  delete(tripId: number, id: number) {
    return this.http.delete<void>(`${this.url(tripId)}/${id}`);
  }

  select(tripId: number, id: number, selected: boolean) {
    return this.http.put<M.DestinationRead>(
      `${this.url(tripId)}/${id}/selection`,
      { is_selected: selected },
    );
  }

  photos(tripId: number, id: number) {
    return this.http.get<M.DestinationPhotoRead[]>(
      `${this.url(tripId)}/${id}/photos`,
    );
  }

  uploadPhoto(tripId: number, id: number, file: File) {
    const data = new FormData();
    data.append('file', file);

    return this.http.post<M.DestinationPhotoRead>(
      `${this.url(tripId)}/${id}/photos`,
      data,
    );
  }

  reorderPhotos(tripId: number, id: number, photoIds: number[]) {
    return this.http.put<M.DestinationPhotoRead[]>(
      `${this.url(tripId)}/${id}/photos/order`,
      { photo_ids: photoIds },
    );
  }

  photoFile(tripId: number, id: number, photoId: number) {
    return this.http.get(
      `${this.url(tripId)}/${id}/photos/${photoId}/file`,
      { responseType: 'blob' },
    );
  }

  deletePhoto(tripId: number, id: number, photoId: number) {
    return this.http.delete<void>(
      `${this.url(tripId)}/${id}/photos/${photoId}`,
    );
  }
}