export type UUID = string;

export type GlobalRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'USER';

export type UserRole = GlobalRole;

export type GroupRole = 'OWNER' | 'MEMBER';

export type TripRole = 'OWNER' | 'ORGANIZER' | 'MEMBER';

export type TripStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED';

export type NotificationType =
  | 'GROUP_INVITATION'
  | 'TRIP_INVITATION'
  | 'TRIP_UPDATE'
  | 'VOTE'
  | 'EXPENSE'
  | 'RESERVATION'
  | 'CALENDAR'
  | 'SYSTEM';

export type ActivityType = 'TRANSFER' | 'ACCOMMODATION' | 'MEAL' | 'TOUR' | 'LEISURE' | 'OTHER';

export type ExpenseCategory = 'TRANSPORT' | 'ACCOMMODATION' | 'FOOD' | 'ACTIVITIES' | 'OTHER';

export type ReservationType = 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'TRANSPORT';

export type ReservationStatus = 'SIMULATED' | 'PENDING' | 'CONFIRMED';

export type CalendarEventType = 'ACTIVITY' | 'RESERVATION' | 'VOTING' | 'PAYMENT';

export type PollStatus = 'OPEN' | 'CLOSED';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface User {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarColor: string;
  initials: string;
  role: UserRole;
  bio?: string;
  timezone: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: ThemeMode;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  groupInvitations: boolean;
  tripInvitations: boolean;
  tripUpdates: boolean;
  votes: boolean;
  expenses: boolean;
  reservations: boolean;
  calendar: boolean;
  system: boolean;
}

export interface Group {
  id: UUID;
  name: string;
  description: string;
  ownerId: UUID;
  colorTheme: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: UUID;
  groupId: UUID;
  userId: UUID;
  role: GroupRole;
  joinedAt: string;
}

export interface GroupInvitation {
  id: UUID;
  groupId: UUID;
  email: string;
  invitedById: UUID;
  role: GroupRole;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

export interface Trip {
  id: UUID;
  groupId: UUID;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  mainDestinationId?: UUID;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripMember {
  id: UUID;
  tripId: UUID;
  userId: UUID;
  role: TripRole;
  joinedAt: string;
}

export interface TripDestination {
  id: UUID;
  tripId: UUID;
  name: string;
  country: string;
  description: string;
  estimatedCost: number;
  votes: number;
  imageUrl?: string;
  createdAt: string;
}

export interface Activity {
  id: UUID;
  tripId: UUID;
  destinationId?: UUID;
  name: string;
  description: string;
  type: ActivityType;
  estimatedCost: number;
  startDate: string;
  endDate: string;
  status: 'PROPOSED' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}

export interface ItineraryDay {
  id: UUID;
  tripId: UUID;
  date: string;
  dayNumber: number;
  note?: string;
}

export interface ItineraryItem {
  id: UUID;
  itineraryDayId: UUID;
  activityId?: UUID;
  time: string;
  title: string;
  description: string;
  type: ActivityType;
  cost: number;
  responsibleUserId?: UUID;
  order: number;
}

export interface Poll {
  id: UUID;
  tripId: UUID;
  title: string;
  description: string;
  status: PollStatus;
  closesAt: string;
  createdAt: string;
  createdById: UUID;
}

export interface PollOption {
  id: UUID;
  pollId: UUID;
  text: string;
  votes: number;
  order: number;
}

export interface PollBallot {
  id: UUID;
  pollId: UUID;
  userId: UUID;
  optionId: UUID;
  createdAt: string;
}

export interface Expense {
  id: UUID;
  tripId: UUID;
  concept: string;
  category: ExpenseCategory;
  amount: number;
  paidById: UUID;
  date: string;
  splitBetween: UUID[];
  createdAt: string;
}

export interface ExpenseSplit {
  id: UUID;
  expenseId: UUID;
  userId: UUID;
  amount: number;
  isPaid: boolean;
}

export interface Settlement {
  id: UUID;
  tripId: UUID;
  fromUserId: UUID;
  toUserId: UUID;
  amount: number;
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
}

export interface Reservation {
  id: UUID;
  tripId: UUID;
  type: ReservationType;
  provider: string;
  detail: string;
  date: string;
  cost: number;
  status: ReservationStatus;
  createdAt: string;
}

export interface ReservationParticipant {
  id: UUID;
  reservationId: UUID;
  userId: UUID;
  confirmed: boolean;
}

export interface CalendarEvent {
  id: UUID;
  tripId: UUID;
  date: string;
  title: string;
  type: CalendarEventType;
  relatedEntityId?: UUID;
  relatedEntityType?: 'ACTIVITY' | 'RESERVATION' | 'POLL' | 'EXPENSE';
}

export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthUser {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarColor: string;
  initials: string;
  role: GlobalRole;
  bio?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const GLOBAL_ROLE_HIERARCHY: Record<GlobalRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  SUPPORT: 60,
  USER: 20,
};

export const GLOBAL_ROLE_LABELS: Record<GlobalRole, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  SUPPORT: 'Soporte',
  USER: 'Usuario',
};

export const GLOBAL_ROLE_COLORS: Record<GlobalRole, string> = {
  SUPER_ADMIN: '#7c3aed',
  ADMIN: '#a855f7',
  SUPPORT: '#22c55e',
  USER: '#64748b',
};

export function hasGlobalRole(userRole: GlobalRole, requiredRole: GlobalRole): boolean {
  return GLOBAL_ROLE_HIERARCHY[userRole] >= GLOBAL_ROLE_HIERARCHY[requiredRole];
}

export function canAccessAdminPanel(role: GlobalRole): boolean {
  return hasGlobalRole(role, 'ADMIN');
}

export function canSupport(role: GlobalRole): boolean {
  return hasGlobalRole(role, 'SUPPORT');
}