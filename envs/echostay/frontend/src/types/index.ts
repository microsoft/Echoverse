export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  preferred_currency: string;
  preferred_language: string;
  is_superhost: boolean;
  identity_verified: boolean;
  response_rate: number;
  response_time: string;
  total_reviews_received: number;
  member_since?: string;
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  id: number;
  url: string;
  caption?: string;
  sort_order: number;
}

export interface AmenityItem {
  id: number;
  name: string;
  category: string;
  icon: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
}

export interface NeighbourhoodItem {
  id: number;
  name: string;
  city: string;
  state: string;
  listing_count: number;
  avg_price: number;
  latitude: number;
  longitude: number;
}

export interface Listing {
  id: number;
  host_id: number;
  host?: User;
  title: string;
  description: string;
  property_type: string;
  room_type: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  price_per_night: number;
  cleaning_fee: number;
  service_fee_percent: number;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  check_in_time: string;
  check_out_time: string;
  min_nights: number;
  max_nights: number;
  instant_book: boolean;
  cancellation_policy: string;
  advance_notice_days: number;
  preparation_time_days: number;
  is_active: boolean;
  require_profile_photo: boolean;
  require_identity_verified: boolean;
  is_guest_favourite: boolean;
  avg_rating: number;
  review_count: number;
  images: ListingImage[];
  amenities?: AmenityItem[];
  categories?: CategoryItem[];
  neighbourhood?: NeighbourhoodItem;
  neighbourhood_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  listing_id: number;
  listing?: Listing;
  guest_id: number;
  check_in: string;
  check_out: string;
  num_guests: number;
  num_adults: number;
  num_children: number;
  num_infants: number;
  num_pets: number;
  price_per_night: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'requested' | 'declined' | 'paid';
  confirmation_code: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  listing_id: number;
  booking_id: number;
  reviewer_id: number;
  reviewer?: User;
  overall_rating: number;
  cleanliness_rating: number;
  accuracy_rating: number;
  checkin_rating: number;
  communication_rating: number;
  location_rating: number;
  value_rating: number;
  comment: string;
  listing?: { id: number; title: string };
  created_at: string;
  updated_at: string;
}

export interface Wishlist {
  id: number;
  user_id: number;
  name: string;
  item_count: number;
  listing_ids?: number[];
  listings?: Listing[];
  created_at: string;
  updated_at: string;
}

export interface Currency {
  id: number;
  code: string;
  symbol: string;
  name: string;
  exchange_rate: number;
}

export interface UserSettings {
  id: number;
  user_id: number;
  preferred_currency: string;
  preferred_language: string;
  notification_email: boolean;
  notification_push: boolean;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  neighbourhood_counts?: Array<{ neighbourhood_name: string; count: number }>;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface BookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SearchFilters {
  location?: string;
  city?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  room_type?: string;
  neighbourhood_id?: number;
  min_bedrooms?: number;
  min_beds?: number;
  min_bathrooms?: number;
  instant_book?: boolean;
  is_guest_favourite?: boolean;
  sort_by?: string;
  amenities?: string[];
}

export interface FilterOption {
  value: string;
  count: number;
}

export interface SearchSuggestion {
  type: 'city' | 'region' | 'property' | 'neighbourhood';
  value: string;
}

export interface PriceBreakdown {
  nights: number;
  price_per_night: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface CitySection {
  city: string;
  listings: Listing[];
}

export interface ListingsByCityResponse {
  sections: CitySection[];
}

export interface MessageThread {
  id: number;
  listing_id?: number;
  booking_id?: number;
  guest_id: number;
  host_id: number;
  subject: string;
  other_user: User;
  listing?: { id: number; title: string; images: ListingImage[] };
  last_message?: { content: string; sender_id: number; created_at: string };
  unread_count: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ThreadDetail {
  thread: MessageThread;
  messages: ChatMessage[];
}

export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface HelpArticle {
  id: number;
  category: string;
  title: string;
  content: string;
  sort_order: number;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  subject: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SearchHistoryItem {
  id: number;
  query: string;
  filters: string;
  result_count: number;
  created_at: string;
}

export interface HostStats {
  total_listings: number;
  active_bookings: number;
  avg_rating: number;
  total_earnings: number;
}

export interface HostListingSettings {
  instant_book: boolean;
  cancellation_policy: string;
  advance_notice_days: number;
  preparation_time_days: number;
  min_nights: number;
  max_nights: number;
  price_per_night: number;
  cleaning_fee: number;
  is_active: boolean;
  require_profile_photo: boolean;
  require_identity_verified: boolean;
}

export interface ReservationShareItem {
  id: number;
  booking_id: number;
  shared_with_email: string;
  share_token: string;
  share_url: string;
  created_at: string;
}

export interface BookingReceipt {
  confirmation_code: string;
  booking_id: number;
  listing_title: string;
  host_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  price_per_night: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  currency: string;
  status: string;
  booked_at: string;
}

export interface CalendarDay {
  date: string;
  status: 'available' | 'booked' | 'blocked' | 'past';
  booking_id?: number;
  reason?: string;
}

export interface ListingCalendar {
  listing_id: number;
  month: string;
  days: CalendarDay[];
}
