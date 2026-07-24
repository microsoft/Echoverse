import type {
  User, Listing, Booking, Review, Wishlist, CategoryItem, Currency,
  UserSettings, ListingsResponse, ReviewsResponse, BookingsResponse,
  SearchFilters, SearchSuggestion, PriceBreakdown, NeighbourhoodItem,
  MessageThread, ThreadDetail, ChatMessage, NotificationItem,
  HostStats, HostListingSettings, ReservationShareItem,
  BookingReceipt, ListingCalendar,
} from './types';

const BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export const login = (email: string, password: string): Promise<User> =>
  fetchJson(`${BASE}/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (name: string, email: string, password: string): Promise<User> =>
  fetchJson(`${BASE}/auth/register`, { method: 'POST', body: JSON.stringify({ email, name, password }) });

export const getMe = (): Promise<User> => fetchJson(`${BASE}/auth/me`);

export const updateMe = (data: Partial<User>): Promise<User> =>
  fetchJson(`${BASE}/auth/me`, { method: 'PUT', body: JSON.stringify(data) });

export const logout = (): Promise<{ message: string }> =>
  fetchJson(`${BASE}/auth/logout`, { method: 'POST' });

// Listings
export function getListings(params?: SearchFilters & { page?: number; limit?: number; sort_by?: string }): Promise<ListingsResponse> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
    });
  }
  const qs = sp.toString();
  return fetchJson(`${BASE}/listings${qs ? `?${qs}` : ''}`);
}

export const getListing = (id: number): Promise<Listing> => fetchJson(`${BASE}/listings/${id}`);

export const updateListing = (id: number, data: Partial<Listing>): Promise<Listing> =>
  fetchJson(`${BASE}/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const getListingReviews = (id: number, page = 1): Promise<ReviewsResponse> =>
  fetchJson(`${BASE}/listings/${id}/reviews?page=${page}`);

export const checkAvailability = (id: number, checkIn: string, checkOut: string): Promise<{ available: boolean; conflicting_dates: unknown[] }> =>
  fetchJson(`${BASE}/listings/${id}/availability?check_in=${checkIn}&check_out=${checkOut}`);

export const calculatePrice = (id: number, checkIn: string, checkOut: string, numGuests: number): Promise<PriceBreakdown> =>
  fetchJson(`${BASE}/listings/${id}/price?check_in=${checkIn}&check_out=${checkOut}&num_guests=${numGuests}`);

// Categories
export const getCategories = (): Promise<CategoryItem[]> => fetchJson(`${BASE}/categories`);

// Neighbourhoods
export const getNeighbourhoods = (): Promise<NeighbourhoodItem[]> => fetchJson(`${BASE}/neighbourhoods`);

// Search
export function searchListings(params?: SearchFilters & { q?: string; page?: number; limit?: number; sort_by?: string }): Promise<ListingsResponse> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
    });
  }
  const qs = sp.toString();
  return fetchJson(`${BASE}/search${qs ? `?${qs}` : ''}`);
}

export const getSearchSuggestions = (q: string): Promise<SearchSuggestion[]> =>
  fetchJson(`${BASE}/search/suggestions?q=${encodeURIComponent(q)}`);

// Bookings
export const createBooking = (data: {
  listing_id: number; check_in: string; check_out: string;
  num_guests: number; num_adults: number; num_children?: number;
  num_infants?: number; num_pets?: number; currency: string;
}): Promise<Booking> =>
  fetchJson(`${BASE}/bookings`, { method: 'POST', body: JSON.stringify(data) });

export const getBookings = (tab?: string): Promise<BookingsResponse> => {
  const params = new URLSearchParams({ limit: '200' });
  if (tab) params.set('tab', tab);
  return fetchJson(`${BASE}/bookings?${params.toString()}`);
};

export const getBooking = (id: number): Promise<Booking> => fetchJson(`${BASE}/bookings/${id}`);

export const cancelBooking = (id: number): Promise<Booking> =>
  fetchJson(`${BASE}/bookings/${id}/cancel`, { method: 'POST' });

export async function updateBooking(id: number, body: { check_in?: string; check_out?: string; guests?: number }): Promise<Booking> {
  return fetchJson(`${BASE}/bookings/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

// Reviews
export const createReview = (data: {
  listing_id: number; booking_id: number; overall_rating: number;
  cleanliness_rating: number; accuracy_rating: number; checkin_rating: number;
  communication_rating: number; location_rating: number; value_rating: number;
  comment: string;
}): Promise<Review> =>
  fetchJson(`${BASE}/reviews`, { method: 'POST', body: JSON.stringify(data) });

export const getMyReviews = (): Promise<Review[]> => fetchJson(`${BASE}/reviews`);

export const getReview = (id: number): Promise<Review> => fetchJson(`${BASE}/reviews/${id}`);

export const updateReview = (id: number, data: Partial<{
  overall_rating: number; cleanliness_rating: number; accuracy_rating: number;
  checkin_rating: number; communication_rating: number; location_rating: number;
  value_rating: number; comment: string;
}>): Promise<Review> =>
  fetchJson(`${BASE}/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteReview = (id: number): Promise<{ message: string }> =>
  fetchJson(`${BASE}/reviews/${id}`, { method: 'DELETE' });

// Wishlists
export const getWishlists = (): Promise<Wishlist[]> => fetchJson(`${BASE}/wishlists`);

export const createWishlist = (name: string): Promise<Wishlist> =>
  fetchJson(`${BASE}/wishlists`, { method: 'POST', body: JSON.stringify({ name }) });

export const getWishlist = (id: number): Promise<Wishlist> => fetchJson(`${BASE}/wishlists/${id}`);

export const updateWishlist = (id: number, data: { name: string }): Promise<Wishlist> =>
  fetchJson(`${BASE}/wishlists/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteWishlist = (id: number): Promise<{ message: string }> =>
  fetchJson(`${BASE}/wishlists/${id}`, { method: 'DELETE' });

export const addToWishlist = (wishlistId: number, listingId: number): Promise<unknown> =>
  fetchJson(`${BASE}/wishlists/${wishlistId}/listings`, { method: 'POST', body: JSON.stringify({ listing_id: listingId }) });

export const removeFromWishlist = (wishlistId: number, listingId: number): Promise<{ message: string }> =>
  fetchJson(`${BASE}/wishlists/${wishlistId}/listings/${listingId}`, { method: 'DELETE' });

export const checkWishlistStatus = (listingId: number): Promise<{ wishlist_ids: number[] }> =>
  fetchJson(`${BASE}/wishlists/check/${listingId}`);

// Currencies
export const getCurrencies = (): Promise<Currency[]> => fetchJson(`${BASE}/currencies`);

// Settings
export const getSettings = (): Promise<UserSettings> => fetchJson(`${BASE}/settings`);

export const updateSettings = (data: Partial<UserSettings>): Promise<UserSettings> =>
  fetchJson(`${BASE}/settings`, { method: 'PUT', body: JSON.stringify(data) });

// Listings by city (homepage carousels)
export const getListingsByCity = (limitPerCity = 10): Promise<{ sections: { city: string; listings: import('./types').Listing[] }[] }> =>
  fetchJson(`${BASE}/listings/by-city?limit_per_city=${limitPerCity}`);

// Messages
export const getMessageThreads = (): Promise<MessageThread[]> => fetchJson(`${BASE}/messages`);

export const getThread = (threadId: number): Promise<ThreadDetail> => fetchJson(`${BASE}/messages/${threadId}`);

export const sendMessage = (data: { thread_id?: number; listing_id?: number; host_id?: number; content: string }): Promise<ChatMessage> =>
  fetchJson(`${BASE}/messages`, { method: 'POST', body: JSON.stringify(data) });

export const markRead = (messageId: number): Promise<{ message: string }> =>
  fetchJson(`${BASE}/messages/${messageId}/read`, { method: 'PUT' });

export const getUnreadCount = (): Promise<{ count: number }> => fetchJson(`${BASE}/messages/unread-count`);

export const deleteThread = (threadId: number): Promise<{ message: string }> =>
  fetchJson(`${BASE}/messages/threads/${threadId}`, { method: 'DELETE' });

export const deleteMessage = (messageId: number): Promise<{ message: string }> =>
  fetchJson(`${BASE}/messages/${messageId}`, { method: 'DELETE' });

export const markAllMessagesRead = (threadId?: number): Promise<{ message: string }> =>
  fetchJson(`${BASE}/messages/read-all`, { method: 'POST', body: JSON.stringify(threadId ? { thread_id: threadId } : {}) });

// Bookings - approve/decline
export const approveBooking = (id: number): Promise<Booking> =>
  fetchJson(`${BASE}/bookings/${id}/approve`, { method: 'POST' });

export const declineBooking = (id: number): Promise<Booking> =>
  fetchJson(`${BASE}/bookings/${id}/decline`, { method: 'POST' });

// Notifications
export const getNotifications = (): Promise<NotificationItem[]> => fetchJson(`${BASE}/notifications`);

export const markNotificationRead = (id: number): Promise<{ message: string }> =>
  fetchJson(`${BASE}/notifications/${id}/read`, { method: 'PUT' });

export const markAllNotificationsRead = (): Promise<{ message: string }> =>
  fetchJson(`${BASE}/notifications/read-all`, { method: 'POST' });

export const getNotificationUnreadCount = (): Promise<{ count: number }> =>
  fetchJson(`${BASE}/notifications/unread-count`);

export const deleteNotification = (id: number): Promise<{ message: string }> =>
  fetchJson(`${BASE}/notifications/${id}`, { method: 'DELETE' });

// Help Center
export const getHelpArticles = (params?: { category?: string; q?: string }): Promise<import('./types').HelpArticle[]> => {
  const sp = new URLSearchParams();
  if (params?.category) sp.set('category', params.category);
  if (params?.q) sp.set('q', params.q);
  const qs = sp.toString();
  return fetchJson(`${BASE}/help/articles${qs ? `?${qs}` : ''}`);
};

export const getHelpArticle = (id: number): Promise<import('./types').HelpArticle> =>
  fetchJson(`${BASE}/help/articles/${id}`);

export const createSupportTicket = (data: { subject: string; description: string; category: string }): Promise<import('./types').SupportTicket> =>
  fetchJson(`${BASE}/help/tickets`, { method: 'POST', body: JSON.stringify(data) });

export const getSupportTickets = (): Promise<import('./types').SupportTicket[]> =>
  fetchJson(`${BASE}/help/tickets`);

export const getSupportTicket = (id: number): Promise<import('./types').SupportTicket> =>
  fetchJson(`${BASE}/help/tickets/${id}`);

export async function updateTicket(id: number, body: { status?: string; description?: string }): Promise<import('./types').SupportTicket> {
  return fetchJson(`${BASE}/help/tickets/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteTicket(id: number): Promise<void> {
  await fetch(`${BASE}/help/tickets/${id}`, { method: 'DELETE' });
}

// Search History
export const getSearchHistory = (): Promise<import('./types').SearchHistoryItem[]> =>
  fetchJson(`${BASE}/search/history`);

export const saveSearch = (data: { query: string; filters: string; result_count: number }): Promise<import('./types').SearchHistoryItem> =>
  fetchJson(`${BASE}/search/history`, { method: 'POST', body: JSON.stringify(data) });

export const deleteSearchHistory = (id: number): Promise<void> =>
  fetchJson(`${BASE}/search/history/${id}`, { method: 'DELETE' });

export const clearSearchHistory = (): Promise<void> =>
  fetchJson(`${BASE}/search/history`, { method: 'DELETE' });

// Host Dashboard
export const getHostListings = (): Promise<Listing[]> => fetchJson(`${BASE}/host/listings`);

export const createHostListing = (data: {
  title: string; description?: string; property_type?: string; room_type?: string;
  city?: string; state?: string; country?: string; address?: string;
  price_per_night?: number; cleaning_fee?: number; max_guests?: number;
  bedrooms?: number; beds?: number; bathrooms?: number;
}): Promise<Listing> =>
  fetchJson(`${BASE}/host/listings`, { method: 'POST', body: JSON.stringify(data) });

export const updateListingSettings = (id: number, data: Partial<HostListingSettings>): Promise<Listing> =>
  fetchJson(`${BASE}/host/listings/${id}/settings`, { method: 'PUT', body: JSON.stringify(data) });

export const getHostBookings = (): Promise<BookingsResponse> => fetchJson(`${BASE}/host/bookings`);

export const getHostStats = (): Promise<HostStats> => fetchJson(`${BASE}/host/stats`);

// Reservation Sharing
export const shareBooking = (bookingId: number, email?: string): Promise<ReservationShareItem> =>
  fetchJson(`${BASE}/bookings/${bookingId}/share`, { method: 'POST', body: JSON.stringify({ shared_with_email: email || '' }) });

export const getBookingShares = (bookingId: number): Promise<ReservationShareItem[]> =>
  fetchJson(`${BASE}/bookings/${bookingId}/shares`);

export const getSharedBooking = (token: string): Promise<Booking & { listing: Listing }> =>
  fetchJson(`${BASE}/bookings/shared/${token}`);

export const removeShare = (bookingId: number, shareId: number): Promise<void> =>
  fetchJson(`${BASE}/bookings/${bookingId}/shares/${shareId}`, { method: 'DELETE' });

// Payment
export const payBooking = (id: number): Promise<Booking> =>
  fetchJson(`${BASE}/bookings/${id}/pay`, { method: 'POST' });

export const getBookingReceipt = (id: number): Promise<BookingReceipt> =>
  fetchJson(`${BASE}/bookings/${id}/receipt`);

// Listing Calendar & Blocked Dates
export const getListingCalendar = (id: number, month: string): Promise<ListingCalendar> =>
  fetchJson(`${BASE}/listings/${id}/calendar?month=${month}`);

export const blockDates = (listingId: number, dates: string[], reason: string): Promise<{ blocked: string[]; listing_id: number }> =>
  fetchJson(`${BASE}/listings/${listingId}/blocked-dates`, { method: 'POST', body: JSON.stringify({ dates, reason }) });

export const unblockDates = (listingId: number, dates: string[]): Promise<{ unblocked: string[]; listing_id: number }> =>
  fetchJson(`${BASE}/listings/${listingId}/blocked-dates?dates=${dates.join(',')}`, { method: 'DELETE' });

export const getBlockedDates = (listingId: number, month?: string): Promise<{ id: number; listing_id: number; date: string; reason: string }[]> =>
  fetchJson(`${BASE}/listings/${listingId}/blocked-dates${month ? `?month=${month}` : ''}`);

// Amenities
export const getAmenities = (): Promise<{ id: number; name: string; category: string; icon: string }[]> =>
  fetchJson(`${BASE}/amenities`);

// Filter option lists (data-driven dropdowns)
export const getPropertyTypes = (): Promise<import('./types').FilterOption[]> =>
  fetchJson(`${BASE}/property-types`);

export const getCities = (): Promise<import('./types').FilterOption[]> =>
  fetchJson(`${BASE}/cities`);

// User Profile
export const getUserProfile = (userId: number): Promise<User> =>
  fetchJson(`${BASE}/users/${userId}/profile`);
