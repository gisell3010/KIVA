import { Component, computed, input } from '@angular/core';
import { PrivateImageComponent } from '../private-image/private-image.component';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [PrivateImageComponent],
  template: `
    <app-private-image
      [src]="imageSrc()"
      [alt]="fullName() ? 'Foto de ' + fullName() : 'Imagen de perfil'"
      [width]="size()"
      [height]="size()"
      objectFit="cover"
      borderRadius="50%"
      fallback="avatar"
      [fallbackText]="initials()"
    ></app-private-image>
  `,
  styles: [`
    :host {
      display: inline-flex;
      flex: 0 0 auto;
      line-height: 0;
    }
  `],
})
export class UserAvatarComponent {
  readonly userId = input.required<number>();
  readonly fullName = input('');
  readonly profileImage = input<string | null>(null);
  readonly size = input('40px');
  readonly refreshKey = input<string | number>('');

  readonly initials = computed(() => {
    const parts = this.fullName()
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    return parts.length
      ? parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
      : 'U';
  });

  readonly imageSrc = computed(() => {
    const key = this.profileImage();

    if (!key) {
      return '';
    }

    const version = `${key}:${this.refreshKey()}`;

    return `/users/${this.userId()}/profile-image?v=${encodeURIComponent(version)}`;
  });
}