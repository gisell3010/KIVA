import { Observable } from 'rxjs';
import {
  User, Group, GroupMember, GroupInvitation, Trip, TripMember, TripDestination,
  Activity, ItineraryDay, ItineraryItem, Poll, PollOption, PollBallot,
  Expense, ExpenseSplit, Settlement, Reservation, ReservationParticipant,
  CalendarEvent, Notification, UUID, UserRole, GroupRole, TripRole,
  TripStatus, ActivityType, ExpenseCategory, ReservationStatus,
  CalendarEventType, PollStatus
} from '../../shared/models/domain.models';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IUserRepository {
  getCurrentUser(): Observable<User>;
  getUser(id: UUID): Observable<User>;
  updateUser(id: UUID, data: Partial<User>): Observable<User>;
  updatePreferences(preferences: User['preferences']): Observable<User['preferences']>;
}

export interface IGroupRepository {
  getGroups(): Observable<Group[]>;
  getGroup(id: UUID): Observable<Group>;
  createGroup(data: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Observable<Group>;
  updateGroup(id: UUID, data: Partial<Group>): Observable<Group>;
  deleteGroup(id: UUID): Observable<void>;
  getMembers(groupId: UUID): Observable<GroupMember[]>;
  addMember(groupId: UUID, userId: UUID, role: GroupRole): Observable<GroupMember>;
  updateMemberRole(groupId: UUID, userId: UUID, role: GroupRole): Observable<GroupMember>;
  removeMember(groupId: UUID, userId: UUID): Observable<void>;
  getInvitations(groupId: UUID): Observable<GroupInvitation[]>;
  createInvitation(data: Omit<GroupInvitation, 'id' | 'createdAt' | 'status'>): Observable<GroupInvitation>;
  acceptInvitation(id: UUID): Observable<GroupInvitation>;
  declineInvitation(id: UUID): Observable<GroupInvitation>;
}

export interface ITripRepository {
  getTrips(groupId?: UUID): Observable<Trip[]>;
  getTrip(id: UUID): Observable<Trip>;
  createTrip(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Observable<Trip>;
  updateTrip(id: UUID, data: Partial<Trip>): Observable<Trip>;
  deleteTrip(id: UUID): Observable<void>;
  getMembers(tripId: UUID): Observable<TripMember[]>;
  addMember(tripId: UUID, userId: UUID, role: TripRole): Observable<TripMember>;
  updateMemberRole(tripId: UUID, userId: UUID, role: TripRole): Observable<TripMember>;
  removeMember(tripId: UUID, userId: UUID): Observable<void>;
  getDestinations(tripId: UUID): Observable<TripDestination[]>;
  createDestination(data: Omit<TripDestination, 'id' | 'createdAt'>): Observable<TripDestination>;
  updateDestination(id: UUID, data: Partial<TripDestination>): Observable<TripDestination>;
  deleteDestination(id: UUID): Observable<void>;
  voteDestination(tripId: UUID, destinationId: UUID): Observable<TripDestination>;
}

export interface IActivityRepository {
  getActivities(tripId: UUID): Observable<Activity[]>;
  getActivity(id: UUID): Observable<Activity>;
  createActivity(data: Omit<Activity, 'id' | 'createdAt'>): Observable<Activity>;
  updateActivity(id: UUID, data: Partial<Activity>): Observable<Activity>;
  deleteActivity(id: UUID): Observable<void>;
}

export interface IItineraryRepository {
  getDays(tripId: UUID): Observable<ItineraryDay[]>;
  getDay(id: UUID): Observable<ItineraryDay>;
  createDay(data: Omit<ItineraryDay, 'id'>): Observable<ItineraryDay>;
  updateDay(id: UUID, data: Partial<ItineraryDay>): Observable<ItineraryDay>;
  deleteDay(id: UUID): Observable<void>;
  getItems(dayId: UUID): Observable<ItineraryItem[]>;
  createItem(data: Omit<ItineraryItem, 'id'>): Observable<ItineraryItem>;
  updateItem(id: UUID, data: Partial<ItineraryItem>): Observable<ItineraryItem>;
  deleteItem(id: UUID): Observable<void>;
  reorderItems(dayId: UUID, itemIds: UUID[]): Observable<ItineraryItem[]>;
}

export interface IPollRepository {
  getPolls(tripId: UUID): Observable<Poll[]>;
  getPoll(id: UUID): Observable<Poll>;
  createPoll(data: Omit<Poll, 'id' | 'createdAt'>): Observable<Poll>;
  updatePoll(id: UUID, data: Partial<Poll>): Observable<Poll>;
  closePoll(id: UUID): Observable<Poll>;
  deletePoll(id: UUID): Observable<void>;
  getOptions(pollId: UUID): Observable<PollOption[]>;
  createOption(data: Omit<PollOption, 'id'>): Observable<PollOption>;
  vote(pollId: UUID, optionId: UUID, userId: UUID): Observable<PollBallot>;
  removeVote(pollId: UUID, userId: UUID): Observable<void>;
}

export interface IExpenseRepository {
  getExpenses(tripId: UUID): Observable<Expense[]>;
  getExpense(id: UUID): Observable<Expense>;
  createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Observable<Expense>;
  updateExpense(id: UUID, data: Partial<Expense>): Observable<Expense>;
  deleteExpense(id: UUID): Observable<void>;
  getSplits(expenseId: UUID): Observable<ExpenseSplit[]>;
  createSplit(data: Omit<ExpenseSplit, 'id'>): Observable<ExpenseSplit>;
  updateSplit(id: UUID, data: Partial<ExpenseSplit>): Observable<ExpenseSplit>;
  getSettlements(tripId: UUID): Observable<Settlement[]>;
  createSettlement(data: Omit<Settlement, 'id' | 'createdAt'>): Observable<Settlement>;
  updateSettlement(id: UUID, data: Partial<Settlement>): Observable<Settlement>;
}

export interface IReservationRepository {
  getReservations(tripId: UUID): Observable<Reservation[]>;
  getReservation(id: UUID): Observable<Reservation>;
  createReservation(data: Omit<Reservation, 'id' | 'createdAt'>): Observable<Reservation>;
  updateReservation(id: UUID, data: Partial<Reservation>): Observable<Reservation>;
  deleteReservation(id: UUID): Observable<void>;
  getParticipants(reservationId: UUID): Observable<ReservationParticipant[]>;
  addParticipant(reservationId: UUID, userId: UUID): Observable<ReservationParticipant>;
  confirmParticipant(reservationId: UUID, userId: UUID): Observable<ReservationParticipant>;
}

export interface ICalendarRepository {
  getEvents(tripId: UUID): Observable<CalendarEvent[]>;
  getEvent(id: UUID): Observable<CalendarEvent>;
  createEvent(data: Omit<CalendarEvent, 'id'>): Observable<CalendarEvent>;
  updateEvent(id: UUID, data: Partial<CalendarEvent>): Observable<CalendarEvent>;
  deleteEvent(id: UUID): Observable<void>;
}

export interface INotificationRepository {
  getNotifications(userId: UUID, unreadOnly?: boolean): Observable<Notification[]>;
  getNotification(id: UUID): Observable<Notification>;
  markAsRead(id: UUID): Observable<Notification>;
  markAllAsRead(userId: UUID): Observable<void>;
  deleteNotification(id: UUID): Observable<void>;
  getUnreadCount(userId: UUID): Observable<number>;
}

export interface IAuthRepository {
  login(email: string, password: string): Observable<{ user: User; accessToken: string; refreshToken: string }>;
  register(data: { email: string; password: string; firstName: string; lastName: string }): Observable<{ user: User; accessToken: string; refreshToken: string }>;
  refreshToken(refreshToken: string): Observable<{ accessToken: string; refreshToken: string }>;
  logout(): Observable<void>;
  getCurrentUser(): Observable<User>;
}