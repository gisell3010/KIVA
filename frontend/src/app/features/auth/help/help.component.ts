import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupportApiService } from '../../../data-access/api/support-api.service';
import { SupportReportRead, SupportMessageRead } from '../../../shared/models/domain.models';
import { supportStatusLabel } from '../../../shared/utils/support.utils';
import { formatDateTime } from '../../../shared/utils/date.utils';
import { ApiError } from '../../../core/http/error.interceptor';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './help.component.html',
  styleUrl: './help.component.css'
})
export class HelpComponent {
  private readonly supportApi = inject(SupportApiService);

  email = '';
  category: 'ACCESS' | 'ACCOUNT' | 'TECHNICAL' | 'OTHER' = 'ACCESS';
  subject = '';
  description = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sent = signal(false);
  readonly tracked = signal<SupportReportRead | null>(null);
  readonly messages = signal<SupportMessageRead[]>([]);
  reportId: number | null = null;
  token = '';
  receipt = '';
  replyText = '';
  messagePage = 1;
  messageTotal = 0;
  readonly statusLabel = supportStatusLabel;
  readonly formatDateTime = formatDateTime;

  track(): void {
    if (!this.reportId || !this.token.trim() || this.loading()) return;
    this.loading.set(true); this.error.set(null); this.tracked.set(null); this.messages.set([]);
    this.supportApi.publicReport(this.reportId, this.token.trim()).subscribe({
      next: report => { this.tracked.set(report); this.loading.set(false); this.loadMessages(1); },
      error: () => { this.loading.set(false); this.error.set('No pudimos abrir el reporte. Revisa el número y la clave de seguimiento.'); }
    });
  }

  loadMessages(page: number): void {
    if (!this.reportId) return;
    this.supportApi.publicMessages(this.reportId, this.token.trim(), page).subscribe({
      next: result => { this.messages.set(result.items); this.messagePage = page; this.messageTotal = result.total; },
      error: () => this.error.set('No pudimos cargar la conversación. Intenta consultar de nuevo.')
    });
  }

  reply(): void {
    if (!this.reportId || !this.replyText.trim() || this.loading()) return;
    this.loading.set(true); this.error.set(null);
    this.supportApi.publicReply(this.reportId, this.token.trim(), this.replyText.trim()).subscribe({
      next: () => { this.loading.set(false); this.replyText = ''; this.track(); },
      error: error => { this.loading.set(false); this.error.set(error instanceof ApiError ? error.message : 'No se pudo enviar la respuesta.'); }
    });
  }

  submit(): void {
    if (!this.email.trim() || !this.subject.trim() || !this.description.trim()) {
      this.error.set('Completa todos los campos.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.supportApi.createPublicReport({
      contact_email: this.email.trim().toLowerCase(),
      category: this.category,
      subject: this.subject.trim(),
      description: this.description.trim()
    }).subscribe({
      next: receipt => {
        this.reportId = receipt.id;
        this.token = receipt.tracking_token;
        this.receipt = receipt.tracking_token;
        this.loading.set(false);
        this.sent.set(true);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(error instanceof ApiError ? error.message : 'No se pudo enviar la solicitud.');
      }
    });
  }
}
