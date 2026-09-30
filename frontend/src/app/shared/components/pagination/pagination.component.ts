import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Page } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination" aria-label="Paginación">
        <button
          class="pagination-btn"
          [disabled]="currentPage() === 1"
          (click)="goToPage(currentPage() - 1)"
          aria-label="Página anterior"
          type="button"
        >
          <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="m14 6-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        @for (page of visiblePages(); track page) {
          @if (page === '...') {
            <span class="pagination-ellipsis" aria-hidden="true">…</span>
          } @else {
            <button
              class="pagination-btn"
              [class.active]="page === currentPage()"
              (click)="goToPage(page)"
              [attr.aria-label]="'Página ' + page"
              [attr.aria-current]="page === currentPage() ? 'page' : null"
              type="button"
            >
              {{ page }}
            </button>
          }
        }

        <button
          class="pagination-btn"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(currentPage() + 1)"
          aria-label="Página siguiente"
          type="button"
        >
          <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="m10 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <span class="pagination-info" aria-live="polite">
          Página {{ currentPage() }} de {{ totalPages() }}
        </span>
      </nav>
    }
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .pagination-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      padding: 0 10px;
      background: var(--bg-input);
      border: 1px solid var(--border-soft);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .pagination-btn:hover:not(:disabled) {
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }
    .pagination-btn:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
    }
    .pagination-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .pagination-btn.active {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      color: white;
    }
    .pagination-ellipsis {
      color: var(--text-muted);
      padding: 0 4px;
    }
    .pagination-info {
      margin-left: auto;
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
    }
  `]
})
export class PaginationComponent {
  readonly page = input.required<Page<unknown>>();
  readonly pageChange = output<number>();

  readonly totalPages = computed(() =>
    Math.ceil(this.page().total / this.page().page_size)
  );

  readonly currentPage = computed(() => this.page().page);

  readonly visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: (number | '...')[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  });

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
}