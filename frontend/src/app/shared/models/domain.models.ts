export type GlobalRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'USER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type GroupRole = 'OWNER' | 'MEMBER';
export type TripRole = 'OWNER' | 'ORGANIZER' | 'MEMBER';
export type TripStatus = 'PLANNING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type ActivityStatus = 'PROPOSED' | 'APPROVED' | 'CANCELLED';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PollStatus = 'OPEN' | 'CLOSED';
export type Money = string;

export interface Pagination {
  page?: number;
  page_size?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserPublic {
  id: number;
  full_name: string;
  username: string;
  profile_image: string | null;
}

export interface UserRead extends UserPublic {
  email: string;
  role: GlobalRole;
  status: UserStatus;
  created_at: string;
}

export interface UserUpdate {
  full_name?: string;
  username?: string;
}

export interface UserAdminUpdate {
  role?: GlobalRole;
  status?: UserStatus;
}

export interface UserFilters extends Pagination {
  q?: string;
  role?: GlobalRole;
  status?: UserStatus;
}

export interface RegisterRequest {
  first_name: string;
  second_name?: string | null;
  first_last_name: string;
  second_last_name?: string | null;
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: UserRead;
}

export interface AuthSessionRead {
  id: number;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface EmailChangeRequest {
  email: string;
  current_password: string;
}

export interface GroupCreate {
  name: string;
  description?: string | null;
}

export type GroupUpdate = Partial<GroupCreate>;

export interface GroupRead {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  my_role: GroupRole | null;
  members_count: number;
  trips_count: number;
}

export interface MemberIdentity {
  id: number;
  user_id: number;
  full_name: string;
  username: string;
  profile_image: string | null;
}

export interface GroupMemberRead extends MemberIdentity {
  group_id: number;
  role: GroupRole;
  joined_at: string;
}

export interface TripCreate {
  group_id: number;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export type TripUpdate =
  Partial<Omit<TripCreate, 'group_id'>> & {
    status?: TripStatus;
  };

export interface TripRead {
  id: number;
  group_id: number;
  group_name: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: TripStatus;
  created_at: string;
  my_role: TripRole | null;
  members_count: number;
  destinations_count: number;
  selected_destinations_count: number;
}

export interface TripMemberRead extends MemberIdentity {
  trip_id: number;
  role: TripRole;
}

export interface TripMemberAdd {
  user_id: number;
  role?: 'ORGANIZER' | 'MEMBER';
}

export interface DestinationCreate {
  country: string;
  place_name: string;
  description?: string | null;
}

export type DestinationUpdate = Partial<DestinationCreate>;

export interface DestinationRead {
  id: number;
  trip_id: number;
  proposed_by_user_id: number;
  country: string;
  place_name: string;
  description: string | null;
  is_selected: boolean;
}

export interface DestinationPhotoRead {
  id: number;
  destination_id: number;
  uploaded_by_user_id: number;
  image_url: string;
  position: number;
  created_at: string;
}

export interface ActivityCreate {
  title: string;
  description?: string | null;
  location?: string | null;
  activity_date: string;
  start_time?: string | null;
  estimated_cost?: Money | null;
}

export type ActivityUpdate = Partial<ActivityCreate> & {
  status?: ActivityStatus;
};

export interface ActivityRead {
  id: number;
  trip_id: number;
  title: string;
  description: string | null;
  location: string | null;
  activity_date: string;
  start_time: string | null;
  estimated_cost: Money | null;
  status: ActivityStatus;
}

export interface CatalogRead {
  id: number;
  name: string;
}

export interface ExpenseSplitCreate {
  user_id: number;
  amount: Money;
}

export interface ExpenseCreate {
  paid_by_user_id: number;
  category_id: number;
  title: string;
  amount: Money;
  expense_date: string;
  splits: ExpenseSplitCreate[];
}

export type ExpenseUpdate = Partial<ExpenseCreate>;

export interface ExpenseRead extends Omit<ExpenseCreate, 'splits'> {
  id: number;
  trip_id: number;
}

export interface ExpenseSplitRead extends ExpenseSplitCreate {
  id: number;
  expense_id: number;
}

export interface ExpenseDetail extends ExpenseRead {
  splits: ExpenseSplitRead[];
}

export interface ExpenseBalanceRead {
  user_id: number;
  total_paid: Money;
  total_share: Money;
  balance: Money;
}

export interface PollOptionCreate {
  option_text: string;
}

export interface PollCreate {
  question: string;
  closes_at?: string | null;
  options: PollOptionCreate[];
}

export type PollUpdate = Partial<Omit<PollCreate, 'options'>>;

export interface PollOptionUpdate {
  option_text?: string;
  option_number?: number;
}

export interface PollRead {
  id: number;
  trip_id: number;
  question: string;
  status: PollStatus;
  closes_at: string | null;
}

export interface PollOptionRead extends PollOptionCreate {
  id: number;
  poll_id: number;
  option_number: number;
}

export interface PollDetail extends PollRead {
  options: PollOptionRead[];
}

export interface VoteRead {
  id: number;
  user_id: number;
  option_id: number;
  voted_at: string;
}

export interface PollOptionResult extends PollOptionRead {
  votes_count: number;
  selected_by_me: boolean;
}

export interface PollResults {
  poll_id: number;
  total_voters: number;
  total_votes: number;
  options: PollOptionResult[];
}

export interface ReservationCreate {
  type_id: number;
  title: string;
  provider?: string | null;
  reservation_date?: string | null;
  amount?: Money | null;
}

export type ReservationUpdate = Partial<ReservationCreate> & {
  status?: ReservationStatus;
};

export interface ReservationRead {
  id: number;
  trip_id: number;
  type_id: number;
  title: string;
  provider: string | null;
  reservation_date: string | null;
  amount: Money | null;
  status: ReservationStatus;
}

export interface NotificationRead {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCount {
  total: number;
}

export interface DashboardRead {
  groups_count: number;
  trips_count: number;
  participants_count: number;
  upcoming_activities_count: number;
  unread_notifications_count: number;
  open_polls_count: number;
  total_expenses: Money;
  currency: 'COP';
}

export interface SupportDashboardRead {
  users_count: number;
  active_users_count: number;
  suspended_users_count: number;
}

export interface AdminDashboardRead extends SupportDashboardRead {
  groups_count: number;
  trips_count: number;
  active_trips_count: number;
  expenses_count: number;
  reservations_count: number;
  polls_count: number;
  open_polls_count: number;
  total_expenses: Money;
  currency: 'COP';
  users_by_role: Record<GlobalRole, number>;
  trips_by_status: Record<TripStatus, number>;
}

export interface SystemConfigRead {
  app_name: string;
  environment: 'development' | 'test' | 'production';
  api_prefix: string;
  currency: 'COP';
  access_token_minutes: number;
  refresh_token_days: number;
  max_image_bytes: number;
  max_destination_photos: number;
}

export interface CalendarEventRead {
  trip_id: number;
  source_type: 'TRIP' | 'ACTIVITY' | 'RESERVATION' | 'POLL' | 'EXPENSE';
  source_id: number;
  title: string;
  event_date: string | null;
  start_time: string | null;
  deadline_at: string | null;
}

export interface CalendarFilters {
  start_date: string;
  end_date: string;
  trip_id?: number;
}

export interface AuditLogRead {
  id: number;
  user_id: number | null;
  action: string;
  entity: string | null;
  entity_id: number | null;
  created_at: string;
}

export interface AuditFilters extends Pagination {
  user_id?: number;
  action?: string;
  entity?: string;
  entity_id?: number;
  created_from?: string;
  created_to?: string;
}

export interface HealthRead {
  status: 'ok' | 'error';
}

export interface ReadinessRead extends HealthRead {
  database: 'ok' | 'unavailable';
}