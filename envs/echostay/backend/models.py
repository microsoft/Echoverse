from datetime import datetime, date, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password_hash: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    preferred_currency: str = Field(default="USD")
    preferred_language: str = Field(default="en")
    is_superhost: bool = Field(default=False)
    identity_verified: bool = Field(default=False)
    response_rate: int = Field(default=100)
    response_time: str = Field(default="within an hour")
    total_reviews_received: int = Field(default=0)
    member_since: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Neighbourhood(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    city: str = Field(default="Boston")
    state: str = Field(default="Massachusetts")
    listing_count: int = Field(default=0)
    avg_price: float = Field(default=0.0)
    latitude: float = Field(default=0.0)
    longitude: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Listing(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    host_id: int = Field(foreign_key="user.id", index=True)
    neighbourhood_id: Optional[int] = Field(default=None, foreign_key="neighbourhood.id", index=True)
    title: str
    description: str = ""
    property_type: str = Field(default="Apartment")  # Villa, Apartment, Home, Cabin, etc.
    room_type: str = Field(default="Entire place")  # Entire place, Private room, Shared room
    city: str = ""
    state: str = ""
    country: str = ""
    address: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    price_per_night: float = 0.0  # base price in USD
    cleaning_fee: float = 0.0
    service_fee_percent: float = Field(default=14.0)
    max_guests: int = Field(default=2)
    bedrooms: int = Field(default=1)
    beds: int = Field(default=1)
    bathrooms: float = Field(default=1.0)
    check_in_time: str = Field(default="3:00 PM")
    check_out_time: str = Field(default="11:00 AM")
    min_nights: int = Field(default=1)
    max_nights: int = Field(default=365)
    instant_book: bool = Field(default=True)
    cancellation_policy: str = Field(default="flexible")  # flexible, moderate, strict
    advance_notice_days: int = Field(default=0)
    preparation_time_days: int = Field(default=0)
    is_active: bool = Field(default=True)
    require_profile_photo: bool = Field(default=False)
    require_identity_verified: bool = Field(default=False)
    is_guest_favourite: bool = Field(default=False)
    avg_rating: float = Field(default=0.0)
    review_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ListingImage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    url: str
    caption: Optional[str] = None
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    icon: str = ""  # icon identifier or emoji
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ListingCategory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    category_id: int = Field(foreign_key="category.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Amenity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: str = ""  # Bathroom, Bedroom, Kitchen, Entertainment, etc.
    icon: str = ""
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ListingAmenity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    amenity_id: int = Field(foreign_key="amenity.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Booking(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    guest_id: int = Field(foreign_key="user.id", index=True)
    check_in: date
    check_out: date
    num_guests: int = Field(default=1)
    num_adults: int = Field(default=1)
    num_children: int = Field(default=0)
    num_infants: int = Field(default=0)
    num_pets: int = Field(default=0)
    price_per_night: float = 0.0  # snapshot at booking time
    cleaning_fee: float = 0.0
    service_fee: float = 0.0
    total_price: float = 0.0
    currency: str = Field(default="USD")
    confirmation_code: str = ""
    status: str = Field(default="confirmed")  # requested, confirmed, paid, completed, cancelled, declined
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    booking_id: int = Field(foreign_key="booking.id", index=True)
    amount: float
    currency: str = "USD"
    payment_method: str = "credit_card"
    transaction_id: Optional[str] = None
    status: str = "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    booking_id: int = Field(foreign_key="booking.id", index=True)
    reviewer_id: int = Field(foreign_key="user.id", index=True)
    overall_rating: float = Field(default=5.0)
    cleanliness_rating: float = Field(default=5.0)
    accuracy_rating: float = Field(default=5.0)
    checkin_rating: float = Field(default=5.0)
    communication_rating: float = Field(default=5.0)
    location_rating: float = Field(default=5.0)
    value_rating: float = Field(default=5.0)
    comment: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Wishlist(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WishlistItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    wishlist_id: int = Field(foreign_key="wishlist.id", index=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Currency(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True)
    symbol: str
    name: str
    exchange_rate: float = Field(default=1.0)  # rate relative to USD
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    preferred_currency: str = Field(default="USD")
    preferred_language: str = Field(default="en")
    notification_email: bool = Field(default=True)
    notification_push: bool = Field(default=True)
    theme: str = Field(default="light")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Enhanced Host Profile ---




# --- Help Center + Support ---

class HelpArticle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    category: str  # "booking", "account", "payments", "safety", "hosting"
    title: str
    content: str
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SupportTicket(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    subject: str
    description: str
    category: str = Field(default="general")
    status: str = Field(default="open")  # open, in_progress, resolved, closed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Search History ---

class SearchHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    query: str = Field(default="")
    filters: str = Field(default="")  # JSON string of applied filters
    result_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MessageThread(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: Optional[int] = None
    booking_id: Optional[int] = None
    guest_id: int = Field(foreign_key="user.id")
    host_id: int = Field(foreign_key="user.id")
    subject: str = ""
    last_message_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    thread_id: int = Field(foreign_key="messagethread.id")
    sender_id: int = Field(foreign_key="user.id")
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    type: str  # booking_confirmed, message_received, review_posted, booking_requested, booking_cancelled
    title: str
    body: str
    link: str = ""
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReservationShare(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    booking_id: int = Field(foreign_key="booking.id")
    shared_by_user_id: int = Field(foreign_key="user.id")
    shared_with_email: str = ""
    share_token: str
    can_view_details: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BlockedDate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    date: date
    reason: str = "unavailable"  # unavailable, maintenance, personal
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
