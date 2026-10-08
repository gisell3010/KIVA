import { SupportCategory, SupportStatus } from '../models/domain.models';

export const supportStatuses: { value: SupportStatus; label: string }[] = [
  { value: 'OPEN', label: 'Abierto' }, { value: 'IN_REVIEW', label: 'En revisión' },
  { value: 'ESCALATED', label: 'En administración' }, { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CLOSED', label: 'Cerrado' }
];
export const supportCategories: { value: SupportCategory; label: string }[] = [
  { value: 'ACCESS', label: 'Acceso' }, { value: 'ACCOUNT', label: 'Cuenta' },
  { value: 'TRIP', label: 'Viaje' }, { value: 'EXPENSE', label: 'Gastos' },
  { value: 'VOTING', label: 'Votaciones' }, { value: 'RESERVATION', label: 'Reservas' },
  { value: 'TECHNICAL', label: 'Funcionamiento' }, { value: 'OTHER', label: 'Otro' }
];
export const supportStatusLabel = (status: SupportStatus): string => supportStatuses.find(item => item.value === status)?.label ?? status;
export const supportCategoryLabel = (category: SupportCategory): string => supportCategories.find(item => item.value === category)?.label ?? category;
export const supportStatusClass = (status: SupportStatus): string => ({ OPEN: 'badge-blue', IN_REVIEW: 'badge-orange', ESCALATED: 'badge-purple', RESOLVED: 'badge-green', CLOSED: 'badge-gray' })[status];
