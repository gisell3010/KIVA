import { GroupRead, TripRead } from '../models/domain.models';

export function isGroupOwner(group: GroupRead | null | undefined): boolean {
  return group?.my_role === 'OWNER';
}

export function isTripOwner(trip: TripRead | null | undefined): boolean {
  return trip?.my_role === 'OWNER';
}

export function isTripManager(trip: TripRead | null | undefined): boolean {
  return trip?.my_role === 'OWNER' || trip?.my_role === 'ORGANIZER';
}

export function isTripMember(trip: TripRead | null | undefined): boolean {
  return trip?.my_role === 'MEMBER';
}
