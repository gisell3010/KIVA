import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { apiParams } from '../../core/http/api-params';
import * as M from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class SupportApiService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  dashboard() {
    return this.http.get<M.SupportDashboardRead>(
      `${this.url}/support/dashboard`
    );
  }

  reports(
    filters: M.Pagination & {
      q?: string;
      status?: M.SupportStatus;
      category?: M.SupportCategory;
      assigned_to_me?: boolean;
      unassigned?: boolean;
    } = {}
  ) {
    return this.http.get<M.Page<M.SupportReportRead>>(
      `${this.url}/support/reports`,
      { params: apiParams(filters) }
    );
  }

  report(id: number) {
    return this.http.get<M.SupportReportDetail>(
      `${this.url}/support/reports/${id}`
    );
  }

  assignSelf(id: number) {
    return this.http.post<M.SupportReportDetail>(
      `${this.url}/support/reports/${id}/assign-self`,
      {}
    );
  }

  updateReport(id: number, data: M.SupportReportUpdate) {
    return this.http.patch<M.SupportReportDetail>(
      `${this.url}/support/reports/${id}`,
      data
    );
  }

  escalate(id: number, reason: string) {
    return this.http.post<M.SupportReportDetail>(
      `${this.url}/support/reports/${id}/escalate`,
      { reason }
    );
  }

  users(filters: M.UserFilters = {}) {
    return this.http.get<M.Page<M.UserRead>>(
      `${this.url}/support/users`,
      { params: apiParams(filters) }
    );
  }

  user(id: number) {
    return this.http.get<M.UserRead>(
      `${this.url}/support/users/${id}`
    );
  }

  groups(userId: number, page = 1) {
    return this.http.get<M.Page<M.GroupRead>>(
      `${this.url}/support/users/${userId}/groups`,
      { params: { page, page_size: 10 } }
    );
  }

  trips(userId: number, page = 1) {
    return this.http.get<M.Page<M.TripRead>>(
      `${this.url}/support/users/${userId}/trips`,
      { params: { page, page_size: 10 } }
    );
  }

  trip(tripId: number) {
    return this.http.get<M.SupportTripRead>(
      `${this.url}/support/trips/${tripId}`
    );
  }

  diagnostic(tripId: number, section: string, page = 1) {
    return this.http.get<M.Page<{ id: number; title: string; detail: string }>>(
      `${this.url}/support/trips/${tripId}/diagnostic/${section}`,
      { params: { page, page_size: 20 } }
    );
  }

  createReport(data: M.SupportReportCreate) {
    return this.http.post<M.SupportReportRead>(
      `${this.url}/support-reports`,
      data
    );
  }

  myReports(page = 1) {
    return this.http.get<M.Page<M.SupportReportRead>>(
      `${this.url}/support-reports`,
      { params: { page, page_size: 20 } }
    );
  }

  createPublicReport(data: M.PublicSupportReportCreate) {
    return this.http.post<M.PublicSupportReceipt>(
      `${this.url}/support-reports/public`,
      data
    );
  }

  agents() {
    return this.http.get<M.SupportReporterRead[]>(`${this.url}/support/agents`);
  }

  assign(id: number, userId: number) {
    return this.http.post<M.SupportReportDetail>(`${this.url}/support/reports/${id}/assign`, { user_id: userId });
  }

  messages(id: number, staff = false, page = 1) {
    const base = staff ? 'support/reports' : 'support-reports';
    return this.http.get<M.Page<M.SupportMessageRead>>(`${this.url}/${base}/${id}/messages`, { params: { page, page_size: 50 } });
  }

  reply(id: number, body: string, staff = false, internal = false) {
    const base = staff ? 'support/reports' : 'support-reports';
    return this.http.post<M.SupportMessageRead>(`${this.url}/${base}/${id}/messages`, { body, is_internal: internal });
  }

  myReport(id: number) {
    return this.http.get<M.SupportReportRead>(`${this.url}/support-reports/${id}`);
  }

  publicReport(report_id: number, tracking_token: string) {
    return this.http.post<M.SupportReportRead>(`${this.url}/support-reports/public/lookup`, { report_id, tracking_token });
  }

  publicMessages(report_id: number, tracking_token: string, page = 1) {
    return this.http.post<M.Page<M.SupportMessageRead>>(`${this.url}/support-reports/public/messages`, { report_id, tracking_token }, { params: { page, page_size: 50 } });
  }

  publicReply(report_id: number, tracking_token: string, body: string) {
    return this.http.post<M.SupportMessageRead>(`${this.url}/support-reports/public/reply`, { report_id, tracking_token, body });
  }
}
