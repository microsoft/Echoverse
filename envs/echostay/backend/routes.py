import hashlib
import math
import secrets
from datetime import datetime, date, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from sqlalchemy import case
from sqlmodel import Session, select, or_, func

from backend.database import get_session
from backend.models import (
    User, Listing, ListingImage, Category, ListingCategory,
    Amenity, ListingAmenity, Booking, Review,
    Wishlist, WishlistItem, Currency, UserSettings,
    MessageThread, Message, Notification,
    HelpArticle, SupportTicket, SearchHistory,
    ReservationShare, BlockedDate, Neighbourhood, Payment
)
import string
import calendar as cal_mod
import os
import requests as req_lib


router = APIRouter(prefix="/api", tags=["echostay"])

DEFAULT_USER_ID = 1

# Benchmark "current date" for the env. The seed data is anchored to a fixed
# present (completed bookings end <= 2026-03-23; confirmed/upcoming start
# >= 2026-04-24), so date-relative logic must use this instead of the wall
# clock (`date.today()`) — otherwise every booking reads as past and the
# availability calendar marks all env-future dates unbookable.
ENV_TODAY = date(2026, 4, 1)


def set_default_user_id(user_id: int):
    global DEFAULT_USER_ID
    DEFAULT_USER_ID = user_id


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    email: str
    name: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    preferred_currency: Optional[str] = None
    preferred_language: Optional[str] = None


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    num_guests: int = 1
    num_adults: int = 1
    num_children: int = 0
    num_infants: int = 0
    num_pets: int = 0
    currency: str = "USD"


class BookingUpdate(BaseModel):
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    num_guests: Optional[int] = None
    num_adults: Optional[int] = None
    num_children: Optional[int] = None
    num_infants: Optional[int] = None
    num_pets: Optional[int] = None


class ReviewCreate(BaseModel):
    listing_id: int
    booking_id: int
    overall_rating: float = 5.0
    cleanliness_rating: float = 5.0
    accuracy_rating: float = 5.0
    checkin_rating: float = 5.0
    communication_rating: float = 5.0
    location_rating: float = 5.0
    value_rating: float = 5.0
    comment: str = ""


class ReviewUpdate(BaseModel):
    overall_rating: Optional[float] = None
    cleanliness_rating: Optional[float] = None
    accuracy_rating: Optional[float] = None
    checkin_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    location_rating: Optional[float] = None
    value_rating: Optional[float] = None
    comment: Optional[str] = None


class WishlistCreate(BaseModel):
    name: str


class WishlistUpdate(BaseModel):
    name: str


class WishlistAddListing(BaseModel):
    listing_id: int


class SettingsUpdate(BaseModel):
    preferred_currency: Optional[str] = None
    preferred_language: Optional[str] = None
    notification_email: Optional[bool] = None
    notification_push: Optional[bool] = None
    theme: Optional[str] = None


class MessageSend(BaseModel):
    thread_id: Optional[int] = None
    listing_id: Optional[int] = None
    host_id: Optional[int] = None
    content: str


class MarkAllReadRequest(BaseModel):
    thread_id: Optional[int] = None


class ResetRequest(BaseModel):
    source_db: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return f"pbkdf2_sha256$200000${salt.hex()}${dk.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_hex, hash_hex = stored.split("$", 3)
    except (ValueError, AttributeError):
        return False
    if algo != "pbkdf2_sha256":
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iters))
    return secrets.compare_digest(dk.hex(), hash_hex)


def _recalculate_listing_rating(session: Session, listing_id: int):
    """Recalculate avg_rating and review_count for a listing."""
    reviews = session.exec(
        select(Review).where(Review.listing_id == listing_id)
    ).all()
    listing = session.get(Listing, listing_id)
    if not listing:
        return
    if reviews:
        listing.review_count = len(reviews)
        listing.avg_rating = round(
            sum(r.overall_rating for r in reviews) / len(reviews), 2
        )
    else:
        listing.review_count = 0
        listing.avg_rating = 0.0
    listing.updated_at = datetime.now(timezone.utc)
    session.add(listing)
    session.commit()


def _check_availability(
    session: Session,
    listing_id: int,
    check_in: date,
    check_out: date,
    exclude_booking_id: Optional[int] = None,
) -> list[dict]:
    """Return list of conflicting booking date ranges."""
    stmt = select(Booking).where(
        Booking.listing_id == listing_id,
        Booking.status.in_(["confirmed", "pending", "requested", "paid"]),
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )
    if exclude_booking_id is not None:
        stmt = stmt.where(Booking.id != exclude_booking_id)
    conflicts = session.exec(stmt).all()
    result: list[dict] = [
        {"check_in": str(b.check_in), "check_out": str(b.check_out)}
        for b in conflicts
    ]

    # Also check blocked dates
    blocked = session.exec(
        select(BlockedDate).where(
            BlockedDate.listing_id == listing_id,
            BlockedDate.date >= check_in,
            BlockedDate.date < check_out,
        )
    ).all()
    if blocked:
        result.append({"blocked_dates": [str(bd.date) for bd in blocked]})

    return result


def _calculate_price(listing: Listing, check_in: date, check_out: date, num_guests: int) -> dict:
    nights = (check_out - check_in).days
    if nights <= 0:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    subtotal = listing.price_per_night * nights
    cleaning_fee = listing.cleaning_fee
    service_fee = round(subtotal * listing.service_fee_percent / 100, 2)
    total = round(subtotal + cleaning_fee + service_fee, 2)
    return {
        "nights": nights,
        "price_per_night": listing.price_per_night,
        "cleaning_fee": cleaning_fee,
        "service_fee": service_fee,
        "total": total,
    }


def _listing_to_dict(listing: Listing) -> dict:
    return {
        "id": listing.id,
        "host_id": listing.host_id,
        "title": listing.title,
        "description": listing.description,
        "property_type": listing.property_type,
        "room_type": listing.room_type,
        "city": listing.city,
        "state": listing.state,
        "country": listing.country,
        "address": listing.address,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "price_per_night": listing.price_per_night,
        "cleaning_fee": listing.cleaning_fee,
        "service_fee_percent": listing.service_fee_percent,
        "max_guests": listing.max_guests,
        "bedrooms": listing.bedrooms,
        "beds": listing.beds,
        "bathrooms": listing.bathrooms,
        "check_in_time": listing.check_in_time,
        "check_out_time": listing.check_out_time,
        "min_nights": listing.min_nights,
        "max_nights": listing.max_nights,
        "instant_book": listing.instant_book,
        "cancellation_policy": listing.cancellation_policy,
        "advance_notice_days": listing.advance_notice_days,
        "preparation_time_days": listing.preparation_time_days,
        "is_active": listing.is_active,
        "require_profile_photo": listing.require_profile_photo,
        "require_identity_verified": listing.require_identity_verified,
        "is_guest_favourite": listing.is_guest_favourite,
        "avg_rating": listing.avg_rating,
        "review_count": listing.review_count,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
        "updated_at": listing.updated_at.isoformat() if listing.updated_at else None,
    }


def _booking_to_dict(booking: Booking) -> dict:
    return {
        "id": booking.id,
        "listing_id": booking.listing_id,
        "guest_id": booking.guest_id,
        "check_in": str(booking.check_in),
        "check_out": str(booking.check_out),
        "num_guests": booking.num_guests,
        "num_adults": booking.num_adults,
        "num_children": booking.num_children,
        "num_infants": booking.num_infants,
        "num_pets": booking.num_pets,
        "price_per_night": booking.price_per_night,
        "cleaning_fee": booking.cleaning_fee,
        "service_fee": booking.service_fee,
        "total_price": booking.total_price,
        "currency": booking.currency,
        "status": booking.status,
        "confirmation_code": booking.confirmation_code,
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "updated_at": booking.updated_at.isoformat() if booking.updated_at else None,
    }


def _review_to_dict(review: Review) -> dict:
    return {
        "id": review.id,
        "listing_id": review.listing_id,
        "booking_id": review.booking_id,
        "reviewer_id": review.reviewer_id,
        "overall_rating": review.overall_rating,
        "cleanliness_rating": review.cleanliness_rating,
        "accuracy_rating": review.accuracy_rating,
        "checkin_rating": review.checkin_rating,
        "communication_rating": review.communication_rating,
        "location_rating": review.location_rating,
        "value_rating": review.value_rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat() if review.created_at else None,
        "updated_at": review.updated_at.isoformat() if review.updated_at else None,
    }


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "phone": user.phone,
        "bio": user.bio,
        "preferred_currency": user.preferred_currency,
        "preferred_language": user.preferred_language,
        "is_superhost": user.is_superhost,
        "identity_verified": user.identity_verified,
        "response_rate": user.response_rate,
        "response_time": user.response_time,
        "total_reviews_received": user.total_reviews_received,
        "member_since": user.member_since.isoformat() if user.member_since else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


def _create_notification(session: Session, user_id: int, ntype: str, title: str, body: str, link: str = ""):
    notif = Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        body=body,
        link=link,
    )
    session.add(notif)
    session.commit()


# ===================================================================
# AUTHENTICATION
# ===================================================================

@router.post("/auth/register")
def register(body: UserRegister, session: Session = Depends(get_session)):
    existing = session.exec(
        select(User).where(User.email == body.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        name=body.name,
        password_hash=_hash_password(body.password),
        member_since=datetime.now(timezone.utc),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    settings = UserSettings(user_id=user.id)
    session.add(settings)
    session.commit()
    return _user_to_dict(user)


@router.post("/auth/login")
def login(body: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(
        select(User).where(User.email == body.email)
    ).first()
    if not user or not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    set_default_user_id(user.id)
    return _user_to_dict(user)


@router.post("/auth/logout")
def logout():
    return {"message": "Logged out"}


@router.get("/auth/me")
def get_me(session: Session = Depends(get_session)):
    user = session.get(User, DEFAULT_USER_ID)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_dict(user)


@router.put("/auth/me")
def update_me(body: UserUpdate, session: Session = Depends(get_session)):
    user = session.get(User, DEFAULT_USER_ID)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)
    return _user_to_dict(user)


# ===================================================================
# LISTINGS
# ===================================================================

def _parse_amenity_ids(amenities: Optional[str]) -> list[int]:
    """Parse a comma-separated list of amenity IDs into a list of ints."""
    if not amenities:
        return []
    ids: list[int] = []
    for part in amenities.split(","):
        part = part.strip()
        if part.isdigit():
            ids.append(int(part))
    return ids


def _parse_csv(value: Optional[str]) -> list[str]:
    """Parse a comma-separated string into a list of trimmed, non-empty values."""
    if not value:
        return []
    return [part.strip() for part in value.split(",") if part.strip()]


@router.get("/listings")
def list_listings(
    location: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    category_id: Optional[int] = None,
    property_type: Optional[str] = None,
    room_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_bedrooms: Optional[int] = None,
    min_beds: Optional[int] = None,
    min_bathrooms: Optional[float] = None,
    max_guests: Optional[int] = None,
    guests: Optional[int] = None,
    neighbourhood_id: Optional[int] = None,
    amenities: Optional[str] = None,
    instant_book: Optional[bool] = None,
    is_guest_favourite: Optional[bool] = None,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: Optional[str] = None,
    session: Session = Depends(get_session),
):
    stmt = select(Listing).where(Listing.is_active == True)

    if location:
        pattern = f"%{location}%"
        stmt = stmt.where(
            or_(
                Listing.title.ilike(pattern),  # type: ignore[union-attr]
                Listing.city.ilike(pattern),  # type: ignore[union-attr]
                Listing.state.ilike(pattern),  # type: ignore[union-attr]
                Listing.country.ilike(pattern),  # type: ignore[union-attr]
            )
        )
    if city:
        stmt = stmt.where(Listing.city == city)
    if country:
        stmt = stmt.where(Listing.country == country)
    if property_type:
        stmt = stmt.where(Listing.property_type.in_(_parse_csv(property_type)))  # type: ignore[union-attr]
    if room_type:
        stmt = stmt.where(Listing.room_type.in_(_parse_csv(room_type)))  # type: ignore[union-attr]
    if min_price is not None:
        stmt = stmt.where(Listing.price_per_night >= min_price)
    if max_price is not None:
        stmt = stmt.where(Listing.price_per_night <= max_price)
    if min_bedrooms is not None:
        stmt = stmt.where(Listing.bedrooms >= min_bedrooms)
    if min_beds is not None:
        stmt = stmt.where(Listing.beds >= min_beds)
    if min_bathrooms is not None:
        stmt = stmt.where(Listing.bathrooms >= min_bathrooms)
    guest_filter = max_guests if max_guests is not None else guests
    if guest_filter is not None:
        stmt = stmt.where(Listing.max_guests >= guest_filter)

    if neighbourhood_id is not None:
        stmt = stmt.where(Listing.neighbourhood_id == neighbourhood_id)

    # Amenities filter – listing must have ALL selected amenities
    for amenity_id in _parse_amenity_ids(amenities):
        stmt = stmt.where(
            Listing.id.in_(  # type: ignore[union-attr]
                select(ListingAmenity.listing_id).where(ListingAmenity.amenity_id == amenity_id)
            )
        )

    if instant_book is not None:
        stmt = stmt.where(Listing.instant_book == instant_book)
    if is_guest_favourite is not None:
        stmt = stmt.where(Listing.is_guest_favourite == is_guest_favourite)

    if category_id is not None:
        listing_ids = session.exec(
            select(ListingCategory.listing_id).where(
                ListingCategory.category_id == category_id
            )
        ).all()
        if listing_ids:
            stmt = stmt.where(Listing.id.in_(listing_ids))  # type: ignore[union-attr]
        else:
            stmt = stmt.where(Listing.id == -1)  # no matches

    # Date availability filter – exclude listings with overlapping confirmed bookings
    if check_in and check_out:
        ci = date.fromisoformat(check_in)
        co = date.fromisoformat(check_out)
        conflicting_ids = session.exec(
            select(Booking.listing_id).where(
                Booking.status.in_(["confirmed", "pending", "requested"]),
                Booking.check_in < co,
                Booking.check_out > ci,
            )
        ).all()
        if conflicting_ids:
            stmt = stmt.where(Listing.id.notin_(conflicting_ids))  # type: ignore[union-attr]

    # Sorting
    if sort_by == "price_asc":
        stmt = stmt.order_by(Listing.price_per_night.asc())  # type: ignore[union-attr]
    elif sort_by == "price_desc":
        stmt = stmt.order_by(Listing.price_per_night.desc())  # type: ignore[union-attr]
    elif sort_by == "rating":
        stmt = stmt.order_by(Listing.avg_rating.desc())  # type: ignore[union-attr]
    elif sort_by == "newest":
        stmt = stmt.order_by(Listing.created_at.desc())  # type: ignore[union-attr]
    else:
        if location:
            title_priority = case(
                (Listing.title.ilike(f"%{location}%"), 0),
                else_=1
            )
            stmt = stmt.order_by(title_priority, Listing.id.asc())  # type: ignore[union-attr]
        else:
            stmt = stmt.order_by(Listing.id.asc())  # type: ignore[union-attr]

    # Total count (efficient COUNT query)
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = session.exec(count_stmt).one()

    # Neighbourhood counts from the full filtered set
    filtered_ids_subq = select(stmt.subquery().c.id)
    nbr_counts_rows = session.exec(
        select(Neighbourhood.name, func.count(Listing.id))
        .join(Listing, Listing.neighbourhood_id == Neighbourhood.id)
        .where(Listing.id.in_(filtered_ids_subq))
        .group_by(Neighbourhood.name)
        .order_by(func.count(Listing.id).desc())
    ).all()
    neighbourhood_counts = [{"neighbourhood_name": name, "count": count} for name, count in nbr_counts_rows]

    offset = (page - 1) * limit
    paginated = session.exec(stmt.offset(offset).limit(limit)).all()

    # Batch-fetch neighbourhood names
    nbr_ids = {l.neighbourhood_id for l in paginated if l.neighbourhood_id}
    nbr_map: dict[int, str] = {}
    if nbr_ids:
        nbrs = session.exec(select(Neighbourhood).where(Neighbourhood.id.in_(nbr_ids))).all()
        nbr_map = {n.id: n.name for n in nbrs}

    results = []
    for listing in paginated:
        d = _listing_to_dict(listing)
        d["neighbourhood_name"] = nbr_map.get(listing.neighbourhood_id)
        images = session.exec(
            select(ListingImage)
            .where(ListingImage.listing_id == listing.id)
            .order_by(ListingImage.sort_order.asc())  # type: ignore[union-attr]
        ).all()
        d["images"] = [
            {"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order}
            for img in images
        ]
        results.append(d)

    return {
        "listings": results,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if limit else 1,
        "neighbourhood_counts": neighbourhood_counts,
    }


# ===================================================================
# LISTINGS BY CITY (for homepage carousels)
# ===================================================================

@router.get("/listings/by-city")
def listings_by_city(
    limit_per_city: int = 10,
    session: Session = Depends(get_session),
):
    """Return active listings grouped by city for homepage carousels."""
    all_listings = session.exec(
        select(Listing).where(Listing.is_active == True).order_by(Listing.avg_rating.desc())  # type: ignore[union-attr]
    ).all()

    city_map: dict[str, list] = {}
    for listing in all_listings:
        key = f"{listing.city}, {listing.state}" if listing.state else listing.city
        if key not in city_map:
            city_map[key] = []
        if len(city_map[key]) < limit_per_city:
            d = _listing_to_dict(listing)
            images = session.exec(
                select(ListingImage)
                .where(ListingImage.listing_id == listing.id)
                .order_by(ListingImage.sort_order.asc())  # type: ignore[union-attr]
            ).all()
            d["images"] = [
                {"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order}
                for img in images
            ]
            city_map[key].append(d)

    sections = []
    for city_label, listings in city_map.items():
        if len(listings) >= 2:
            sections.append({"city": city_label, "listings": listings})

    sections.sort(key=lambda s: len(s["listings"]), reverse=True)
    return {"sections": sections}


@router.get("/listings/{listing_id}")
def get_listing(listing_id: int, session: Session = Depends(get_session)):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    d = _listing_to_dict(listing)

    # Host info
    host = session.get(User, listing.host_id)
    d["host"] = _user_to_dict(host) if host else None

    # Images
    images = session.exec(
        select(ListingImage)
        .where(ListingImage.listing_id == listing_id)
        .order_by(ListingImage.sort_order.asc())  # type: ignore[union-attr]
    ).all()
    d["images"] = [
        {"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order}
        for img in images
    ]

    # Amenities
    amenity_links = session.exec(
        select(ListingAmenity).where(ListingAmenity.listing_id == listing_id)
    ).all()
    amenities = []
    for la in amenity_links:
        a = session.get(Amenity, la.amenity_id)
        if a:
            amenities.append({"id": a.id, "name": a.name, "category": a.category, "icon": a.icon})
    d["amenities"] = amenities

    # Categories
    cat_links = session.exec(
        select(ListingCategory).where(ListingCategory.listing_id == listing_id)
    ).all()
    categories = []
    for lc in cat_links:
        c = session.get(Category, lc.category_id)
        if c:
            categories.append({"id": c.id, "name": c.name, "icon": c.icon})
    d["categories"] = categories

    # Neighbourhood
    if listing.neighbourhood_id:
        nbr = session.get(Neighbourhood, listing.neighbourhood_id)
        d["neighbourhood"] = {"id": nbr.id, "name": nbr.name} if nbr else None
    else:
        d["neighbourhood"] = None

    return d


@router.get("/listings/{listing_id}/reviews")
def get_listing_reviews(
    listing_id: int,
    page: int = 1,
    limit: int = 10,
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    stmt = (
        select(Review)
        .where(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())  # type: ignore[union-attr]
    )
    all_reviews = session.exec(stmt).all()
    total = len(all_reviews)

    offset = (page - 1) * limit
    reviews = session.exec(stmt.offset(offset).limit(limit)).all()

    results = []
    for review in reviews:
        rd = _review_to_dict(review)
        reviewer = session.get(User, review.reviewer_id)
        rd["reviewer"] = _user_to_dict(reviewer) if reviewer else None
        results.append(rd)

    return {
        "reviews": results,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if limit else 1,
    }


@router.get("/listings/{listing_id}/availability")
def check_listing_availability(
    listing_id: int,
    check_in: str = Query(...),
    check_out: str = Query(...),
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    ci = date.fromisoformat(check_in)
    co = date.fromisoformat(check_out)
    conflicts = _check_availability(session, listing_id, ci, co)
    return {"available": len(conflicts) == 0, "conflicting_dates": conflicts}


@router.get("/listings/{listing_id}/price")
def get_listing_price(
    listing_id: int,
    check_in: str = Query(...),
    check_out: str = Query(...),
    num_guests: int = Query(default=1),
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    ci = date.fromisoformat(check_in)
    co = date.fromisoformat(check_out)
    return _calculate_price(listing, ci, co, num_guests)


# ===================================================================
# LISTING UPDATE (generic PUT/PATCH for agent discoverability)
# ===================================================================


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    room_type: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    price_per_night: Optional[float] = None
    cleaning_fee: Optional[float] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[float] = None
    instant_book: Optional[bool] = None
    cancellation_policy: Optional[str] = None
    advance_notice_days: Optional[int] = None
    preparation_time_days: Optional[int] = None
    min_nights: Optional[int] = None
    max_nights: Optional[int] = None
    is_active: Optional[bool] = None
    require_profile_photo: Optional[bool] = None
    require_identity_verified: Optional[bool] = None


def _apply_listing_update(listing: Listing, body: ListingUpdate, session: Session) -> dict:
    update_data = body.model_dump(exclude_unset=True)
    if "cancellation_policy" in update_data and update_data["cancellation_policy"] not in ("flexible", "moderate", "strict"):
        raise HTTPException(status_code=400, detail="Invalid cancellation policy")
    if "advance_notice_days" in update_data and not (0 <= update_data["advance_notice_days"] <= 7):
        raise HTTPException(status_code=400, detail="advance_notice_days must be 0-7")
    if "preparation_time_days" in update_data and not (0 <= update_data["preparation_time_days"] <= 3):
        raise HTTPException(status_code=400, detail="preparation_time_days must be 0-3")
    if "min_nights" in update_data and not (1 <= update_data["min_nights"] <= 365):
        raise HTTPException(status_code=400, detail="min_nights must be 1-365")
    if "max_nights" in update_data and not (1 <= update_data["max_nights"] <= 1125):
        raise HTTPException(status_code=400, detail="max_nights must be 1-1125")

    for key, value in update_data.items():
        setattr(listing, key, value)
    listing.updated_at = datetime.now(timezone.utc)
    session.add(listing)
    session.commit()
    session.refresh(listing)

    d = _listing_to_dict(listing)
    images = session.exec(
        select(ListingImage).where(ListingImage.listing_id == listing.id).order_by(ListingImage.sort_order)
    ).all()
    d["images"] = [{"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order} for img in images]
    return d


@router.put("/listings/{listing_id}")
def update_listing(listing_id: int, body: ListingUpdate, session: Session = Depends(get_session)):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _apply_listing_update(listing, body, session)


@router.patch("/listings/{listing_id}")
def patch_listing(listing_id: int, body: ListingUpdate, session: Session = Depends(get_session)):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _apply_listing_update(listing, body, session)


# ===================================================================
# CATEGORIES
# ===================================================================

@router.get("/categories")
def list_categories(session: Session = Depends(get_session)):
    categories = session.exec(
        select(Category).order_by(Category.sort_order.asc())  # type: ignore[union-attr]
    ).all()
    return [
        {"id": c.id, "name": c.name, "icon": c.icon, "sort_order": c.sort_order}
        for c in categories
    ]


@router.get("/amenities")
def list_amenities(session: Session = Depends(get_session)):
    amenities = session.exec(select(Amenity).order_by(Amenity.name)).all()
    return [{"id": a.id, "name": a.name, "icon": a.icon, "category": a.category} for a in amenities]


@router.get("/property-types")
def list_property_types(session: Session = Depends(get_session)):
    """Distinct property types present in active listings, with counts."""
    rows = session.exec(
        select(Listing.property_type, func.count(Listing.id))
        .where(Listing.is_active == True, Listing.property_type != "")
        .group_by(Listing.property_type)
        .order_by(func.count(Listing.id).desc())
    ).all()
    return [{"value": value, "count": count} for value, count in rows]


@router.get("/cities")
def list_cities(session: Session = Depends(get_session)):
    """Distinct cities present in active listings, with counts."""
    rows = session.exec(
        select(Listing.city, func.count(Listing.id))
        .where(Listing.is_active == True, Listing.city != "")
        .group_by(Listing.city)
        .order_by(func.count(Listing.id).desc())
    ).all()
    return [{"value": value, "count": count} for value, count in rows]


@router.get("/neighbourhoods")
def list_neighbourhoods(session: Session = Depends(get_session)):
    neighbourhoods = session.exec(
        select(Neighbourhood).order_by(Neighbourhood.name.asc())  # type: ignore[union-attr]
    ).all()
    return [
        {
            "id": n.id,
            "name": n.name,
            "city": n.city,
            "state": n.state,
            "listing_count": n.listing_count,
            "avg_price": n.avg_price,
            "latitude": n.latitude,
            "longitude": n.longitude,
        }
        for n in neighbourhoods
    ]


# ===================================================================
# SEARCH
# ===================================================================

@router.get("/search")
def search_listings(
    q: Optional[str] = None,
    location: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    neighbourhood_id: Optional[int] = None,
    category_id: Optional[int] = None,
    property_type: Optional[str] = None,
    room_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_bedrooms: Optional[int] = None,
    min_beds: Optional[int] = None,
    min_bathrooms: Optional[float] = None,
    max_guests: Optional[int] = None,
    amenities: Optional[str] = None,
    instant_book: Optional[bool] = None,
    is_guest_favourite: Optional[bool] = None,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: Optional[str] = None,
    session: Session = Depends(get_session),
):
    stmt = select(Listing).where(Listing.is_active == True)

    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                Listing.title.ilike(pattern),  # type: ignore[union-attr]
                Listing.description.ilike(pattern),  # type: ignore[union-attr]
                Listing.city.ilike(pattern),  # type: ignore[union-attr]
                Listing.country.ilike(pattern),  # type: ignore[union-attr]
            )
        )

    if location:
        loc_pattern = f"%{location}%"
        stmt = stmt.where(
            or_(
                Listing.title.ilike(loc_pattern),  # type: ignore[union-attr]
                Listing.city.ilike(loc_pattern),  # type: ignore[union-attr]
                Listing.state.ilike(loc_pattern),  # type: ignore[union-attr]
                Listing.country.ilike(loc_pattern),  # type: ignore[union-attr]
            )
        )

    if city:
        stmt = stmt.where(Listing.city == city)
    if country:
        stmt = stmt.where(Listing.country == country)
    if neighbourhood_id is not None:
        stmt = stmt.where(Listing.neighbourhood_id == neighbourhood_id)
    if property_type:
        stmt = stmt.where(Listing.property_type.in_(_parse_csv(property_type)))  # type: ignore[union-attr]
    if room_type:
        stmt = stmt.where(Listing.room_type.in_(_parse_csv(room_type)))  # type: ignore[union-attr]
    if min_price is not None:
        stmt = stmt.where(Listing.price_per_night >= min_price)
    if max_price is not None:
        stmt = stmt.where(Listing.price_per_night <= max_price)
    if min_bedrooms is not None:
        stmt = stmt.where(Listing.bedrooms >= min_bedrooms)
    if min_beds is not None:
        stmt = stmt.where(Listing.beds >= min_beds)
    if min_bathrooms is not None:
        stmt = stmt.where(Listing.bathrooms >= min_bathrooms)
    if max_guests is not None:
        stmt = stmt.where(Listing.max_guests >= max_guests)

    # Amenities filter – listing must have ALL selected amenities
    for amenity_id in _parse_amenity_ids(amenities):
        stmt = stmt.where(
            Listing.id.in_(  # type: ignore[union-attr]
                select(ListingAmenity.listing_id).where(ListingAmenity.amenity_id == amenity_id)
            )
        )

    if instant_book is not None:
        stmt = stmt.where(Listing.instant_book == instant_book)
    if is_guest_favourite is not None:
        stmt = stmt.where(Listing.is_guest_favourite == is_guest_favourite)

    if category_id is not None:
        listing_ids = session.exec(
            select(ListingCategory.listing_id).where(
                ListingCategory.category_id == category_id
            )
        ).all()
        if listing_ids:
            stmt = stmt.where(Listing.id.in_(listing_ids))  # type: ignore[union-attr]
        else:
            stmt = stmt.where(Listing.id == -1)

    if check_in and check_out:
        ci = date.fromisoformat(check_in)
        co = date.fromisoformat(check_out)
        conflicting_ids = session.exec(
            select(Booking.listing_id).where(
                Booking.status.in_(["confirmed", "pending", "requested"]),
                Booking.check_in < co,
                Booking.check_out > ci,
            )
        ).all()
        if conflicting_ids:
            stmt = stmt.where(Listing.id.notin_(conflicting_ids))  # type: ignore[union-attr]

    if sort_by == "price_asc":
        stmt = stmt.order_by(Listing.price_per_night.asc())  # type: ignore[union-attr]
    elif sort_by == "price_desc":
        stmt = stmt.order_by(Listing.price_per_night.desc())  # type: ignore[union-attr]
    elif sort_by == "rating":
        stmt = stmt.order_by(Listing.avg_rating.desc())  # type: ignore[union-attr]
    elif sort_by == "newest":
        stmt = stmt.order_by(Listing.created_at.desc())  # type: ignore[union-attr]
    else:
        search_term = q or location
        if search_term:
            title_priority = case(
                (Listing.title.ilike(f"%{search_term}%"), 0),
                else_=1
            )
            stmt = stmt.order_by(title_priority, Listing.id.asc())  # type: ignore[union-attr]
        else:
            stmt = stmt.order_by(Listing.id.asc())  # type: ignore[union-attr]

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = session.exec(count_stmt).one()

    # Neighbourhood counts from the full filtered set
    filtered_ids_subq = select(stmt.subquery().c.id)
    nbr_counts_rows = session.exec(
        select(Neighbourhood.name, func.count(Listing.id))
        .join(Listing, Listing.neighbourhood_id == Neighbourhood.id)
        .where(Listing.id.in_(filtered_ids_subq))
        .group_by(Neighbourhood.name)
        .order_by(func.count(Listing.id).desc())
    ).all()
    neighbourhood_counts = [{"neighbourhood_name": name, "count": count} for name, count in nbr_counts_rows]

    offset = (page - 1) * limit
    paginated = session.exec(stmt.offset(offset).limit(limit)).all()

    # Batch-fetch neighbourhood names
    nbr_ids = {l.neighbourhood_id for l in paginated if l.neighbourhood_id}
    nbr_map: dict[int, str] = {}
    if nbr_ids:
        nbrs = session.exec(select(Neighbourhood).where(Neighbourhood.id.in_(nbr_ids))).all()
        nbr_map = {n.id: n.name for n in nbrs}

    results = []
    for listing in paginated:
        d = _listing_to_dict(listing)
        d["neighbourhood_name"] = nbr_map.get(listing.neighbourhood_id)
        images = session.exec(
            select(ListingImage)
            .where(ListingImage.listing_id == listing.id)
            .order_by(ListingImage.sort_order.asc())  # type: ignore[union-attr]
        ).all()
        d["images"] = [
            {"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order}
            for img in images
        ]
        results.append(d)

    return {
        "listings": results,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if limit else 1,
        "neighbourhood_counts": neighbourhood_counts,
    }


@router.get("/search/suggestions")
def search_suggestions(
    q: str = Query(default=""),
    session: Session = Depends(get_session),
):
    if not q:
        return []

    pattern = f"%{q}%"
    suggestions: list[dict] = []
    seen: set[str] = set()

    # City suggestions
    cities = session.exec(
        select(Listing.city)
        .where(Listing.city.like(pattern), Listing.is_active == True)  # type: ignore[union-attr]
        .distinct()
        .limit(5)
    ).all()
    for c in cities:
        key = f"city:{c}"
        if key not in seen:
            seen.add(key)
            suggestions.append({"type": "city", "value": c})

    # State / region suggestions
    states = session.exec(
        select(Listing.state)
        .where(Listing.state.like(pattern), Listing.is_active == True)  # type: ignore[union-attr]
        .distinct()
        .limit(5)
    ).all()
    for s in states:
        key = f"region:{s}"
        if key not in seen:
            seen.add(key)
            suggestions.append({"type": "region", "value": s})

    # Property type suggestions
    ptypes = session.exec(
        select(Listing.property_type)
        .where(Listing.property_type.like(pattern), Listing.is_active == True)  # type: ignore[union-attr]
        .distinct()
        .limit(5)
    ).all()
    for p in ptypes:
        key = f"property:{p}"
        if key not in seen:
            seen.add(key)
            suggestions.append({"type": "property", "value": p})

    # Neighbourhood suggestions
    neighbourhoods = session.exec(
        select(Neighbourhood).where(
            Neighbourhood.name.ilike(f"%{q}%")
        ).limit(5)
    ).all()
    for n in neighbourhoods:
        key = f"neighbourhood:{n.name}"
        if key not in seen:
            seen.add(key)
            suggestions.append({"type": "neighbourhood", "value": n.name})

    return suggestions


# ===================================================================
# BOOKINGS
# ===================================================================

@router.post("/bookings")
def create_booking(body: BookingCreate, session: Session = Depends(get_session)):
    listing = session.get(Listing, body.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if body.check_out <= body.check_in:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")

    nights = (body.check_out - body.check_in).days
    if nights < listing.min_nights:
        raise HTTPException(
            status_code=400, detail=f"Minimum stay is {listing.min_nights} nights"
        )
    if nights > listing.max_nights:
        raise HTTPException(
            status_code=400, detail=f"Maximum stay is {listing.max_nights} nights"
        )
    if body.num_guests > listing.max_guests:
        raise HTTPException(
            status_code=400, detail=f"Maximum guests is {listing.max_guests}"
        )

    conflicts = _check_availability(session, body.listing_id, body.check_in, body.check_out)
    if conflicts:
        raise HTTPException(status_code=400, detail="Dates not available")

    # Guest eligibility checks
    guest = session.get(User, DEFAULT_USER_ID)
    if listing.require_profile_photo and (not guest or not guest.avatar_url):
        raise HTTPException(status_code=400, detail="This listing requires a profile photo")
    if listing.require_identity_verified and (not guest or not guest.identity_verified):
        raise HTTPException(status_code=400, detail="This listing requires identity verification")

    price = _calculate_price(listing, body.check_in, body.check_out, body.num_guests)

    status = "confirmed" if listing.instant_book else "requested"

    confirmation_code = "ECHOSTAY-" + ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

    booking = Booking(
        listing_id=body.listing_id,
        guest_id=DEFAULT_USER_ID,
        check_in=body.check_in,
        check_out=body.check_out,
        num_guests=body.num_guests,
        num_adults=body.num_adults,
        num_children=body.num_children,
        num_infants=body.num_infants,
        num_pets=body.num_pets,
        price_per_night=price["price_per_night"],
        cleaning_fee=price["cleaning_fee"],
        service_fee=price["service_fee"],
        total_price=price["total"],
        currency=body.currency,
        status=status,
        confirmation_code=confirmation_code,
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)

    guest = session.get(User, DEFAULT_USER_ID)
    guest_name = guest.name if guest else "A guest"
    if status == "confirmed":
        _create_notification(
            session, listing.host_id, "booking_confirmed",
            "Booking confirmed",
            f"{guest_name} booked {listing.title}",
            f"/trips",
        )
    else:
        _create_notification(
            session, listing.host_id, "booking_requested",
            "Booking request",
            f"{guest_name} requested to book {listing.title}",
            f"/trips",
        )

    return _booking_to_dict(booking)


@router.get("/bookings")
def list_bookings(
    status: Optional[str] = None,
    tab: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    session: Session = Depends(get_session),
):
    stmt = select(Booking).where(Booking.guest_id == DEFAULT_USER_ID)

    if status:
        stmt = stmt.where(Booking.status == status)

    today = ENV_TODAY
    if tab == "upcoming":
        stmt = stmt.where(
            Booking.check_in >= today,
            Booking.status.in_(["confirmed", "pending", "requested", "paid"]),
        )
    elif tab == "past":
        stmt = stmt.where(
            or_(
                Booking.check_out < today,
                Booking.status == "completed",
            )
        )
    elif tab == "cancelled":
        stmt = stmt.where(Booking.status == "cancelled")

    stmt = stmt.order_by(Booking.check_in.desc())  # type: ignore[union-attr]

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = session.exec(count_stmt).one()

    offset = (page - 1) * limit
    bookings = session.exec(stmt.offset(offset).limit(limit)).all()

    results = []
    for booking in bookings:
        bd = _booking_to_dict(booking)
        listing = session.get(Listing, booking.listing_id)
        if listing:
            bd["listing"] = _listing_to_dict(listing)
            images = session.exec(
                select(ListingImage)
                .where(ListingImage.listing_id == listing.id)
                .order_by(ListingImage.sort_order.asc())  # type: ignore[union-attr]
                .limit(1)
            ).all()
            bd["listing"]["images"] = [
                {"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order}
                for img in images
            ]
        results.append(bd)

    return {
        "bookings": results,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if limit else 1,
    }


@router.get("/bookings/{booking_id}")
def get_booking(booking_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    bd = _booking_to_dict(booking)
    listing = session.get(Listing, booking.listing_id)
    if listing:
        bd["listing"] = _listing_to_dict(listing)
        images = session.exec(
            select(ListingImage)
            .where(ListingImage.listing_id == listing.id)
            .order_by(ListingImage.sort_order.asc())  # type: ignore[union-attr]
        ).all()
        bd["listing"]["images"] = [
            {"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order}
            for img in images
        ]
        host = session.get(User, listing.host_id)
        if host:
            bd["listing"]["host"] = _user_to_dict(host)
    return bd


@router.put("/bookings/{booking_id}")
def update_booking(
    booking_id: int,
    body: BookingUpdate,
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot update cancelled booking")

    data = body.model_dump(exclude_unset=True)

    new_check_in = data.get("check_in", booking.check_in)
    new_check_out = data.get("check_out", booking.check_out)

    # Revalidate availability if dates changed
    if "check_in" in data or "check_out" in data:
        if new_check_out <= new_check_in:
            raise HTTPException(status_code=400, detail="check_out must be after check_in")
        conflicts = _check_availability(
            session, booking.listing_id, new_check_in, new_check_out,
            exclude_booking_id=booking_id,
        )
        if conflicts:
            raise HTTPException(status_code=400, detail="Dates not available")

        listing = session.get(Listing, booking.listing_id)
        if listing:
            num_guests = data.get("num_guests", booking.num_guests)
            price = _calculate_price(listing, new_check_in, new_check_out, num_guests)
            booking.price_per_night = price["price_per_night"]
            booking.cleaning_fee = price["cleaning_fee"]
            booking.service_fee = price["service_fee"]
            booking.total_price = price["total"]

    for field, value in data.items():
        setattr(booking, field, value)

    booking.updated_at = datetime.now(timezone.utc)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return _booking_to_dict(booking)


@router.post("/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    booking.status = "cancelled"
    booking.updated_at = datetime.now(timezone.utc)
    session.add(booking)
    session.commit()
    session.refresh(booking)

    listing = session.get(Listing, booking.listing_id)
    listing_title = listing.title if listing else "a listing"
    guest = session.get(User, booking.guest_id)
    guest_name = guest.name if guest else "A guest"
    if listing:
        _create_notification(
            session, listing.host_id, "booking_cancelled",
            "Booking cancelled",
            f"{guest_name} cancelled their booking for {listing_title}",
            "/trips",
        )

    return _booking_to_dict(booking)


@router.post("/bookings/{booking_id}/approve")
def approve_booking(booking_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "requested":
        raise HTTPException(status_code=400, detail="Booking is not in requested state")

    booking.status = "confirmed"
    booking.updated_at = datetime.now(timezone.utc)
    session.add(booking)
    session.commit()
    session.refresh(booking)

    listing = session.get(Listing, booking.listing_id)
    listing_title = listing.title if listing else "your booking"
    _create_notification(
        session, booking.guest_id, "booking_confirmed",
        "Booking approved",
        f"Your booking for {listing_title} has been approved!",
        "/trips",
    )

    return _booking_to_dict(booking)


@router.post("/bookings/{booking_id}/decline")
def decline_booking(booking_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "requested":
        raise HTTPException(status_code=400, detail="Booking is not in requested state")

    booking.status = "declined"
    booking.updated_at = datetime.now(timezone.utc)
    session.add(booking)
    session.commit()
    session.refresh(booking)

    listing = session.get(Listing, booking.listing_id)
    listing_title = listing.title if listing else "your booking"
    _create_notification(
        session, booking.guest_id, "booking_declined",
        "Booking declined",
        f"Your booking request for {listing_title} was declined.",
        "/trips",
    )

    return _booking_to_dict(booking)


# ===================================================================
# REVIEWS
# ===================================================================

@router.post("/reviews")
def create_review(body: ReviewCreate, session: Session = Depends(get_session)):
    booking = session.get(Booking, body.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed bookings")
    if booking.listing_id != body.listing_id:
        raise HTTPException(status_code=400, detail="Booking does not match listing")

    existing = session.exec(
        select(Review).where(Review.booking_id == body.booking_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")

    review = Review(
        listing_id=body.listing_id,
        booking_id=body.booking_id,
        reviewer_id=DEFAULT_USER_ID,
        overall_rating=body.overall_rating,
        cleanliness_rating=body.cleanliness_rating,
        accuracy_rating=body.accuracy_rating,
        checkin_rating=body.checkin_rating,
        communication_rating=body.communication_rating,
        location_rating=body.location_rating,
        value_rating=body.value_rating,
        comment=body.comment,
    )
    session.add(review)
    session.commit()
    session.refresh(review)

    _recalculate_listing_rating(session, body.listing_id)

    listing = session.get(Listing, body.listing_id)
    if listing:
        reviewer = session.get(User, DEFAULT_USER_ID)
        reviewer_name = reviewer.name if reviewer else "Someone"
        _create_notification(
            session, listing.host_id, "review_posted",
            "New review",
            f"{reviewer_name} left a review on {listing.title}",
            f"/listings/{listing.id}",
        )

    return _review_to_dict(review)


@router.get("/reviews")
def list_reviews(session: Session = Depends(get_session)):
    reviews = session.exec(
        select(Review)
        .where(Review.reviewer_id == DEFAULT_USER_ID)
        .order_by(Review.created_at.desc())  # type: ignore[union-attr]
    ).all()
    results = []
    for r in reviews:
        rd = _review_to_dict(r)
        listing = session.get(Listing, r.listing_id)
        if listing:
            rd["listing"] = {"id": listing.id, "title": listing.title}
        results.append(rd)
    return results


@router.get("/reviews/{review_id}")
def get_review(review_id: int, session: Session = Depends(get_session)):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    rd = _review_to_dict(review)
    reviewer = session.get(User, review.reviewer_id)
    rd["reviewer"] = _user_to_dict(reviewer) if reviewer else None
    listing = session.get(Listing, review.listing_id)
    if listing:
        rd["listing"] = {"id": listing.id, "title": listing.title}
    return rd


@router.put("/reviews/{review_id}")
def update_review(
    review_id: int,
    body: ReviewUpdate,
    session: Session = Depends(get_session),
):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.reviewer_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your review")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    review.updated_at = datetime.now(timezone.utc)
    session.add(review)
    session.commit()
    session.refresh(review)

    _recalculate_listing_rating(session, review.listing_id)

    return _review_to_dict(review)


@router.delete("/reviews/{review_id}")
def delete_review(review_id: int, session: Session = Depends(get_session)):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.reviewer_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your review")

    listing_id = review.listing_id
    session.delete(review)
    session.commit()

    _recalculate_listing_rating(session, listing_id)

    return {"message": "Review deleted"}


# ===================================================================
# WISHLISTS
# ===================================================================

@router.get("/wishlists")
def list_wishlists(session: Session = Depends(get_session)):
    wishlists = session.exec(
        select(Wishlist)
        .where(Wishlist.user_id == DEFAULT_USER_ID)
        .order_by(Wishlist.created_at.desc())  # type: ignore[union-attr]
    ).all()

    results = []
    for wl in wishlists:
        items = session.exec(
            select(WishlistItem).where(WishlistItem.wishlist_id == wl.id)
        ).all()
        listing_ids = [item.listing_id for item in items]
        results.append({
            "id": wl.id,
            "name": wl.name,
            "user_id": wl.user_id,
            "item_count": len(items),
            "listing_ids": listing_ids,
            "created_at": wl.created_at.isoformat() if wl.created_at else None,
            "updated_at": wl.updated_at.isoformat() if wl.updated_at else None,
        })
    return results


@router.post("/wishlists")
def create_wishlist(body: WishlistCreate, session: Session = Depends(get_session)):
    wl = Wishlist(user_id=DEFAULT_USER_ID, name=body.name)
    session.add(wl)
    session.commit()
    session.refresh(wl)
    return {
        "id": wl.id,
        "name": wl.name,
        "user_id": wl.user_id,
        "item_count": 0,
        "created_at": wl.created_at.isoformat() if wl.created_at else None,
        "updated_at": wl.updated_at.isoformat() if wl.updated_at else None,
    }


@router.get("/wishlists/check/{listing_id}")
def check_listing_in_wishlists(listing_id: int, session: Session = Depends(get_session)):
    wishlists = session.exec(
        select(Wishlist).where(Wishlist.user_id == DEFAULT_USER_ID)
    ).all()
    wl_ids = [wl.id for wl in wishlists]
    if not wl_ids:
        return {"wishlist_ids": []}

    items = session.exec(
        select(WishlistItem).where(
            WishlistItem.listing_id == listing_id,
            WishlistItem.wishlist_id.in_(wl_ids),  # type: ignore[union-attr]
        )
    ).all()
    return {"wishlist_ids": [item.wishlist_id for item in items]}


@router.get("/wishlists/{wishlist_id}")
def get_wishlist(wishlist_id: int, session: Session = Depends(get_session)):
    wl = session.get(Wishlist, wishlist_id)
    if not wl:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wl.user_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your wishlist")

    items = session.exec(
        select(WishlistItem).where(WishlistItem.wishlist_id == wishlist_id)
    ).all()

    listings = []
    for item in items:
        listing = session.get(Listing, item.listing_id)
        if listing:
            ld = _listing_to_dict(listing)
            images = session.exec(
                select(ListingImage)
                .where(ListingImage.listing_id == listing.id)
                .order_by(ListingImage.sort_order.asc())  # type: ignore[union-attr]
                .limit(1)
            ).all()
            ld["images"] = [
                {"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order}
                for img in images
            ]
            listings.append(ld)

    return {
        "id": wl.id,
        "name": wl.name,
        "user_id": wl.user_id,
        "listings": listings,
        "item_count": len(listings),
        "created_at": wl.created_at.isoformat() if wl.created_at else None,
        "updated_at": wl.updated_at.isoformat() if wl.updated_at else None,
    }


@router.put("/wishlists/{wishlist_id}")
def update_wishlist(
    wishlist_id: int,
    body: WishlistUpdate,
    session: Session = Depends(get_session),
):
    wl = session.get(Wishlist, wishlist_id)
    if not wl:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wl.user_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your wishlist")

    wl.name = body.name
    wl.updated_at = datetime.now(timezone.utc)
    session.add(wl)
    session.commit()
    session.refresh(wl)

    item_count = len(session.exec(
        select(WishlistItem).where(WishlistItem.wishlist_id == wishlist_id)
    ).all())

    return {
        "id": wl.id,
        "name": wl.name,
        "user_id": wl.user_id,
        "item_count": item_count,
        "created_at": wl.created_at.isoformat() if wl.created_at else None,
        "updated_at": wl.updated_at.isoformat() if wl.updated_at else None,
    }


@router.delete("/wishlists/{wishlist_id}")
def delete_wishlist(wishlist_id: int, session: Session = Depends(get_session)):
    wl = session.get(Wishlist, wishlist_id)
    if not wl:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wl.user_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your wishlist")

    items = session.exec(
        select(WishlistItem).where(WishlistItem.wishlist_id == wishlist_id)
    ).all()
    for item in items:
        session.delete(item)
    session.delete(wl)
    session.commit()
    return {"message": "Wishlist deleted"}


@router.post("/wishlists/{wishlist_id}/listings")
def add_listing_to_wishlist(
    wishlist_id: int,
    body: WishlistAddListing,
    session: Session = Depends(get_session),
):
    wl = session.get(Wishlist, wishlist_id)
    if not wl:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wl.user_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your wishlist")

    listing = session.get(Listing, body.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    existing = session.exec(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist_id,
            WishlistItem.listing_id == body.listing_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Listing already in wishlist")

    item = WishlistItem(wishlist_id=wishlist_id, listing_id=body.listing_id)
    session.add(item)
    wl.updated_at = datetime.now(timezone.utc)
    session.add(wl)
    session.commit()
    session.refresh(item)
    return {
        "id": item.id,
        "wishlist_id": item.wishlist_id,
        "listing_id": item.listing_id,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


@router.delete("/wishlists/{wishlist_id}/listings/{listing_id}")
def remove_listing_from_wishlist(
    wishlist_id: int,
    listing_id: int,
    session: Session = Depends(get_session),
):
    wl = session.get(Wishlist, wishlist_id)
    if not wl:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wl.user_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your wishlist")

    item = session.exec(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist_id,
            WishlistItem.listing_id == listing_id,
        )
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Listing not in wishlist")

    session.delete(item)
    wl.updated_at = datetime.now(timezone.utc)
    session.add(wl)
    session.commit()
    return {"message": "Listing removed from wishlist"}


# ===================================================================
# CURRENCIES
# ===================================================================

@router.get("/currencies")
def list_currencies(session: Session = Depends(get_session)):
    currencies = session.exec(select(Currency)).all()
    return [
        {
            "id": c.id,
            "code": c.code,
            "symbol": c.symbol,
            "name": c.name,
            "exchange_rate": c.exchange_rate,
        }
        for c in currencies
    ]


# ===================================================================
# USER SETTINGS
# ===================================================================

@router.get("/settings")
def get_settings(session: Session = Depends(get_session)):
    settings = session.exec(
        select(UserSettings).where(UserSettings.user_id == DEFAULT_USER_ID)
    ).first()
    if not settings:
        settings = UserSettings(user_id=DEFAULT_USER_ID)
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return {
        "id": settings.id,
        "user_id": settings.user_id,
        "preferred_currency": settings.preferred_currency,
        "preferred_language": settings.preferred_language,
        "notification_email": settings.notification_email,
        "notification_push": settings.notification_push,
        "theme": settings.theme,
        "created_at": settings.created_at.isoformat() if settings.created_at else None,
        "updated_at": settings.updated_at.isoformat() if settings.updated_at else None,
    }


@router.put("/settings")
def update_settings(body: SettingsUpdate, session: Session = Depends(get_session)):
    settings = session.exec(
        select(UserSettings).where(UserSettings.user_id == DEFAULT_USER_ID)
    ).first()
    if not settings:
        settings = UserSettings(user_id=DEFAULT_USER_ID)
        session.add(settings)
        session.commit()
        session.refresh(settings)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    settings.updated_at = datetime.now(timezone.utc)
    session.add(settings)
    # Keep the user's profile currency/language consistent with settings (the UI
    # exposes a single control for each; tasks expect both user + usersettings updated).
    updates = body.model_dump(exclude_unset=True)
    if "preferred_currency" in updates or "preferred_language" in updates:
        user = session.get(User, DEFAULT_USER_ID)
        if user:
            if "preferred_currency" in updates:
                user.preferred_currency = updates["preferred_currency"]
            if "preferred_language" in updates:
                user.preferred_language = updates["preferred_language"]
            session.add(user)
    session.commit()
    session.refresh(settings)
    return {
        "id": settings.id,
        "user_id": settings.user_id,
        "preferred_currency": settings.preferred_currency,
        "preferred_language": settings.preferred_language,
        "notification_email": settings.notification_email,
        "notification_push": settings.notification_push,
        "theme": settings.theme,
        "created_at": settings.created_at.isoformat() if settings.created_at else None,
        "updated_at": settings.updated_at.isoformat() if settings.updated_at else None,
    }


# ===================================================================
# MESSAGES
# ===================================================================

def _thread_to_dict(thread: MessageThread, session: Session, current_user_id: int) -> dict:
    other_id = thread.host_id if thread.guest_id == current_user_id else thread.guest_id
    other_user = session.get(User, other_id)

    last_msg = session.exec(
        select(Message)
        .where(Message.thread_id == thread.id)
        .order_by(Message.created_at.desc())  # type: ignore[union-attr]
        .limit(1)
    ).first()

    unread = len(session.exec(
        select(Message).where(
            Message.thread_id == thread.id,
            Message.sender_id != current_user_id,
            Message.is_read == False,
        )
    ).all())

    listing_info = None
    if thread.listing_id:
        listing = session.get(Listing, thread.listing_id)
        if listing:
            images = session.exec(
                select(ListingImage)
                .where(ListingImage.listing_id == listing.id)
                .order_by(ListingImage.sort_order.asc())  # type: ignore[union-attr]
                .limit(1)
            ).all()
            listing_info = {
                "id": listing.id,
                "title": listing.title,
                "images": [{"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order} for img in images],
            }

    return {
        "id": thread.id,
        "listing_id": thread.listing_id,
        "booking_id": thread.booking_id,
        "guest_id": thread.guest_id,
        "host_id": thread.host_id,
        "subject": thread.subject,
        "other_user": _user_to_dict(other_user) if other_user else None,
        "listing": listing_info,
        "last_message": {
            "content": last_msg.content,
            "sender_id": last_msg.sender_id,
            "created_at": last_msg.created_at.isoformat(),
        } if last_msg else None,
        "unread_count": unread,
        "created_at": thread.created_at.isoformat() if thread.created_at else None,
    }


@router.get("/messages/unread-count")
def messages_unread_count(session: Session = Depends(get_session)):
    threads = session.exec(
        select(MessageThread).where(
            or_(MessageThread.guest_id == DEFAULT_USER_ID, MessageThread.host_id == DEFAULT_USER_ID)
        )
    ).all()
    total = 0
    for t in threads:
        total += len(session.exec(
            select(Message).where(
                Message.thread_id == t.id,
                Message.sender_id != DEFAULT_USER_ID,
                Message.is_read == False,
            )
        ).all())
    return {"count": total}


@router.post("/messages/read-all")
def mark_all_messages_read(body: MarkAllReadRequest, session: Session = Depends(get_session)):
    if body.thread_id is not None:
        messages = session.exec(
            select(Message).where(
                Message.thread_id == body.thread_id,
                Message.sender_id != DEFAULT_USER_ID,
                Message.is_read == False,
            )
        ).all()
    else:
        user_threads = session.exec(
            select(MessageThread).where(
                or_(MessageThread.guest_id == DEFAULT_USER_ID, MessageThread.host_id == DEFAULT_USER_ID)
            )
        ).all()
        thread_ids = [t.id for t in user_threads]
        messages = session.exec(
            select(Message).where(
                Message.thread_id.in_(thread_ids),
                Message.sender_id != DEFAULT_USER_ID,
                Message.is_read == False,
            )
        ).all() if thread_ids else []
    for msg in messages:
        msg.is_read = True
        session.add(msg)
    session.commit()
    return {"message": f"{len(messages)} messages marked as read"}


@router.get("/messages/{thread_id}")
def get_thread_messages(thread_id: int, session: Session = Depends(get_session)):
    thread = session.get(MessageThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    messages = session.exec(
        select(Message)
        .where(Message.thread_id == thread_id)
        .order_by(Message.created_at.asc())  # type: ignore[union-attr]
    ).all()

    return {
        "thread": _thread_to_dict(thread, session, DEFAULT_USER_ID),
        "messages": [
            {
                "id": m.id,
                "thread_id": m.thread_id,
                "sender_id": m.sender_id,
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


@router.put("/messages/{message_id}/read")
def mark_message_read(message_id: int, session: Session = Depends(get_session)):
    msg = session.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    session.add(msg)
    session.commit()
    return {"message": "Marked as read"}


@router.get("/messages")
def list_message_threads(session: Session = Depends(get_session)):
    threads = session.exec(
        select(MessageThread).where(
            or_(MessageThread.guest_id == DEFAULT_USER_ID, MessageThread.host_id == DEFAULT_USER_ID)
        ).order_by(MessageThread.last_message_at.desc())  # type: ignore[union-attr]
    ).all()
    return [_thread_to_dict(t, session, DEFAULT_USER_ID) for t in threads]


@router.post("/messages")
def send_message(body: MessageSend, session: Session = Depends(get_session)):
    thread = None

    if body.thread_id:
        thread = session.get(MessageThread, body.thread_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
    else:
        if not body.listing_id or not body.host_id:
            raise HTTPException(status_code=400, detail="Either thread_id or listing_id+host_id required")
        guest_id = DEFAULT_USER_ID
        host_id = body.host_id
        thread = session.exec(
            select(MessageThread).where(
                MessageThread.listing_id == body.listing_id,
                MessageThread.guest_id == guest_id,
                MessageThread.host_id == host_id,
            )
        ).first()
        if not thread:
            listing = session.get(Listing, body.listing_id)
            subject = f"About: {listing.title}" if listing else ""
            thread = MessageThread(
                listing_id=body.listing_id,
                guest_id=guest_id,
                host_id=host_id,
                subject=subject,
                last_message_at=datetime.now(timezone.utc),
            )
            session.add(thread)
            session.commit()
            session.refresh(thread)

    msg = Message(
        thread_id=thread.id,
        sender_id=DEFAULT_USER_ID,
        content=body.content,
    )
    session.add(msg)
    thread.last_message_at = datetime.now(timezone.utc)
    session.add(thread)
    session.commit()
    session.refresh(msg)

    recipient_id = thread.host_id if DEFAULT_USER_ID == thread.guest_id else thread.guest_id
    sender = session.get(User, DEFAULT_USER_ID)
    sender_name = sender.name if sender else "Someone"
    _create_notification(
        session, recipient_id, "message_received",
        "New message",
        f"{sender_name}: {body.content[:80]}",
        f"/messages",
    )

    return {
        "id": msg.id,
        "thread_id": msg.thread_id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


# ===================================================================
# NOTIFICATIONS
# ===================================================================

@router.get("/notifications/unread-count")
def notifications_unread_count(session: Session = Depends(get_session)):
    notifs = session.exec(
        select(Notification).where(
            Notification.user_id == DEFAULT_USER_ID,
            Notification.is_read == False,
        )
    ).all()
    return {"count": len(notifs)}


@router.post("/notifications/read-all")
def mark_all_notifications_read(session: Session = Depends(get_session)):
    notifs = session.exec(
        select(Notification).where(
            Notification.user_id == DEFAULT_USER_ID,
            Notification.is_read == False,
        )
    ).all()
    for n in notifs:
        n.is_read = True
        session.add(n)
    session.commit()
    return {"message": "All notifications marked as read"}


@router.get("/notifications")
def list_notifications(session: Session = Depends(get_session)):
    notifs = session.exec(
        select(Notification)
        .where(Notification.user_id == DEFAULT_USER_ID)
        .order_by(Notification.created_at.desc())  # type: ignore[union-attr]
    ).all()
    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, session: Session = Depends(get_session)):
    notif = session.get(Notification, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    session.add(notif)
    session.commit()
    return {"message": "Marked as read"}


# ===================================================================
# ADMIN (for evaluation)
# ===================================================================


def require_admin_key(x_admin_key: Optional[str] = Header(None)):
    expected = os.environ.get("ADMIN_API_KEY", "admin-secret-key")
    if not x_admin_key or x_admin_key != expected:
        raise HTTPException(status_code=403, detail="Forbidden: invalid or missing admin key")


@router.post("/admin/reset")
def reset_database(req: Optional[ResetRequest] = None, _admin=Depends(require_admin_key)):
    """Reset database by copying from source file."""
    import shutil
    from backend import database
    if req and req.source_db:
        shutil.copy(req.source_db, database._db_path)
    database._engine = None
    database.init_db()
    return {"message": "Database reset"}


@router.get("/admin/db")
def download_database(_admin=Depends(require_admin_key)):
    """Download current database file."""
    from backend import database
    return FileResponse(
        database._db_path,
        filename="echostay.db",
        media_type="application/octet-stream",
    )


@router.get("/images/proxy")
def proxy_image(url: str):
    """Proxy external images to avoid CORS/network issues."""
    from urllib.parse import urlparse, urlunparse
    allowed_domains = {"a0.muscache.com", "images.unsplash.com", "source.unsplash.com", "pravatar.cc"}
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=403, detail="Scheme not allowed")
    host = (parsed.hostname or "").lower()
    if host not in allowed_domains:
        raise HTTPException(status_code=403, detail="Domain not allowed")
    # Rebuild the request URL from validated components so only the allow-listed
    # host is ever contacted (defends against SSRF / host confusion).
    safe_url = urlunparse(("https", host, parsed.path, parsed.params, parsed.query, ""))

    try:
        resp = req_lib.get(safe_url, timeout=10, stream=True, allow_redirects=False)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "image/jpeg")
        return Response(content=resp.content, media_type=content_type)
    except Exception:
        raise HTTPException(status_code=404, detail="Image not found")


# ===================================================================
# HOST PROFILE
# ===================================================================

@router.get("/users/{user_id}/profile")
def get_user_profile(user_id: int, session: Session = Depends(get_session)):
    """Public profile: user info + their listings + reviews received."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    listings = session.exec(
        select(Listing).where(Listing.host_id == user_id, Listing.is_active == True)
    ).all()
    listing_ids = [l.id for l in listings]
    reviews_received: list[dict] = []
    if listing_ids:
        reviews = session.exec(
            select(Review).where(Review.listing_id.in_(listing_ids))
        ).all()
        for r in reviews:
            rd = _review_to_dict(r)
            reviewer = session.get(User, r.reviewer_id)
            if reviewer:
                rd["reviewer"] = {"id": reviewer.id, "name": reviewer.name, "avatar_url": reviewer.avatar_url}
            rlisting = session.get(Listing, r.listing_id)
            if rlisting:
                rd["listing"] = {"id": rlisting.id, "title": rlisting.title}
            reviews_received.append(rd)
    listing_dicts = []
    for l in listings:
        ld = _listing_to_dict(l)
        images = session.exec(
            select(ListingImage).where(ListingImage.listing_id == l.id).order_by(ListingImage.sort_order)
        ).all()
        ld["images"] = [{"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order} for img in images]
        listing_dicts.append(ld)
    return {
        **_user_to_dict(user),
        "listings": listing_dicts,
        "reviews_received": reviews_received,
    }


# ===================================================================
# HELP CENTER + SUPPORT
# ===================================================================

class TicketCreate(BaseModel):
    subject: str
    description: str
    category: str = "general"


@router.get("/help/articles")
def list_help_articles(
    category: Optional[str] = None,
    q: Optional[str] = None,
    session: Session = Depends(get_session),
):
    stmt = select(HelpArticle).order_by(HelpArticle.sort_order, HelpArticle.id)
    if category:
        stmt = stmt.where(HelpArticle.category == category)
    articles = session.exec(stmt).all()
    if q:
        q_lower = q.lower()
        articles = [a for a in articles if q_lower in a.title.lower() or q_lower in a.content.lower()]
    return [
        {
            "id": a.id,
            "category": a.category,
            "title": a.title,
            "content": a.content,
            "sort_order": a.sort_order,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in articles
    ]


@router.get("/help/articles/{article_id}")
def get_help_article(article_id: int, session: Session = Depends(get_session)):
    article = session.get(HelpArticle, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return {
        "id": article.id,
        "category": article.category,
        "title": article.title,
        "content": article.content,
        "sort_order": article.sort_order,
        "created_at": article.created_at.isoformat() if article.created_at else None,
    }


@router.post("/help/tickets")
def create_support_ticket(body: TicketCreate, session: Session = Depends(get_session)):
    ticket = SupportTicket(
        user_id=DEFAULT_USER_ID,
        subject=body.subject,
        description=body.description,
        category=body.category,
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "subject": ticket.subject,
        "description": ticket.description,
        "category": ticket.category,
        "status": ticket.status,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
    }


@router.get("/help/tickets")
def list_support_tickets(session: Session = Depends(get_session)):
    tickets = session.exec(
        select(SupportTicket)
        .where(SupportTicket.user_id == DEFAULT_USER_ID)
        .order_by(SupportTicket.created_at.desc())
    ).all()
    return [
        {
            "id": t.id,
            "user_id": t.user_id,
            "subject": t.subject,
            "description": t.description,
            "category": t.category,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        }
        for t in tickets
    ]


@router.get("/help/tickets/{ticket_id}")
def get_support_ticket(ticket_id: int, session: Session = Depends(get_session)):
    ticket = session.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "subject": ticket.subject,
        "description": ticket.description,
        "category": ticket.category,
        "status": ticket.status,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
    }


# ===================================================================
# SEARCH HISTORY
# ===================================================================

class SearchHistoryCreate(BaseModel):
    query: str = ""
    filters: str = ""
    result_count: int = 0


@router.get("/search/history")
def list_search_history(session: Session = Depends(get_session)):
    entries = session.exec(
        select(SearchHistory)
        .where(SearchHistory.user_id == DEFAULT_USER_ID)
        .order_by(SearchHistory.created_at.desc())
        .limit(20)
    ).all()
    return [
        {
            "id": e.id,
            "query": e.query,
            "filters": e.filters,
            "result_count": e.result_count,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]


@router.post("/search/history")
def save_search_history(body: SearchHistoryCreate, session: Session = Depends(get_session)):
    entry = SearchHistory(
        user_id=DEFAULT_USER_ID,
        query=body.query,
        filters=body.filters,
        result_count=body.result_count,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return {
        "id": entry.id,
        "query": entry.query,
        "filters": entry.filters,
        "result_count": entry.result_count,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
    }


@router.delete("/search/history/{entry_id}")
def delete_search_history_entry(entry_id: int, session: Session = Depends(get_session)):
    entry = session.get(SearchHistory, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    session.delete(entry)
    session.commit()
    return {"message": "Search history entry deleted"}


@router.delete("/search/history")
def clear_search_history(session: Session = Depends(get_session)):
    entries = session.exec(
        select(SearchHistory).where(SearchHistory.user_id == DEFAULT_USER_ID)
    ).all()
    for e in entries:
        session.delete(e)
    session.commit()
    return {"message": "Search history cleared"}


# ===================================================================
# HOST DASHBOARD
# ===================================================================

class ListingSettingsUpdate(BaseModel):
    instant_book: Optional[bool] = None
    cancellation_policy: Optional[str] = None
    advance_notice_days: Optional[int] = None
    preparation_time_days: Optional[int] = None
    min_nights: Optional[int] = None
    max_nights: Optional[int] = None
    price_per_night: Optional[float] = None
    cleaning_fee: Optional[float] = None
    is_active: Optional[bool] = None
    require_profile_photo: Optional[bool] = None
    require_identity_verified: Optional[bool] = None


class CreateListingRequest(BaseModel):
    title: str
    description: str = ""
    property_type: str = "Apartment"
    room_type: str = "Entire place"
    city: str = ""
    state: str = ""
    country: str = ""
    address: str = ""
    price_per_night: float = 100.0
    cleaning_fee: float = 50.0
    max_guests: int = 2
    bedrooms: int = 1
    beds: int = 1
    bathrooms: float = 1.0


@router.get("/host/listings")
def get_host_listings(session: Session = Depends(get_session)):
    listings = session.exec(
        select(Listing).where(Listing.host_id == DEFAULT_USER_ID)
    ).all()
    result = []
    for listing in listings:
        d = _listing_to_dict(listing)
        images = session.exec(
            select(ListingImage).where(ListingImage.listing_id == listing.id).order_by(ListingImage.sort_order)
        ).all()
        d["images"] = [{"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order} for img in images]
        result.append(d)
    return result


@router.post("/host/listings")
def create_host_listing(body: CreateListingRequest, session: Session = Depends(get_session)):
    listing = Listing(
        host_id=DEFAULT_USER_ID,
        title=body.title,
        description=body.description,
        property_type=body.property_type,
        room_type=body.room_type,
        city=body.city,
        state=body.state,
        country=body.country,
        address=body.address,
        price_per_night=body.price_per_night,
        cleaning_fee=body.cleaning_fee,
        max_guests=body.max_guests,
        bedrooms=body.bedrooms,
        beds=body.beds,
        bathrooms=body.bathrooms,
    )
    session.add(listing)
    session.commit()
    session.refresh(listing)
    d = _listing_to_dict(listing)
    d["images"] = []
    return d


@router.put("/host/listings/{listing_id}/settings")
def update_listing_settings(listing_id: int, body: ListingSettingsUpdate, session: Session = Depends(get_session)):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your listing")

    update_data = body.model_dump(exclude_unset=True)
    if "cancellation_policy" in update_data and update_data["cancellation_policy"] not in ("flexible", "moderate", "strict"):
        raise HTTPException(status_code=400, detail="Invalid cancellation policy")
    if "advance_notice_days" in update_data and not (0 <= update_data["advance_notice_days"] <= 7):
        raise HTTPException(status_code=400, detail="advance_notice_days must be 0-7")
    if "preparation_time_days" in update_data and not (0 <= update_data["preparation_time_days"] <= 3):
        raise HTTPException(status_code=400, detail="preparation_time_days must be 0-3")
    if "min_nights" in update_data and not (1 <= update_data["min_nights"] <= 365):
        raise HTTPException(status_code=400, detail="min_nights must be 1-365")
    if "max_nights" in update_data and not (1 <= update_data["max_nights"] <= 1125):
        raise HTTPException(status_code=400, detail="max_nights must be 1-1125")

    for key, value in update_data.items():
        setattr(listing, key, value)
    listing.updated_at = datetime.now(timezone.utc)
    session.add(listing)
    session.commit()
    session.refresh(listing)

    d = _listing_to_dict(listing)
    images = session.exec(
        select(ListingImage).where(ListingImage.listing_id == listing.id).order_by(ListingImage.sort_order)
    ).all()
    d["images"] = [{"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order} for img in images]
    return d


@router.get("/host/bookings")
def get_host_bookings(session: Session = Depends(get_session)):
    host_listings = session.exec(
        select(Listing.id).where(Listing.host_id == DEFAULT_USER_ID)
    ).all()
    if not host_listings:
        return {"bookings": [], "total": 0, "page": 1, "limit": 50, "total_pages": 0}

    listing_ids = list(host_listings)
    bookings = session.exec(
        select(Booking).where(Booking.listing_id.in_(listing_ids))
        .order_by(
            # pending/requested first
            Booking.status.desc(),
            Booking.created_at.desc()
        )
    ).all()

    result = []
    for b in bookings:
        bd = _booking_to_dict(b)
        listing = session.get(Listing, b.listing_id)
        if listing:
            ld = _listing_to_dict(listing)
            images = session.exec(
                select(ListingImage).where(ListingImage.listing_id == listing.id).order_by(ListingImage.sort_order)
            ).all()
            ld["images"] = [{"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order} for img in images]
            bd["listing"] = ld
        guest = session.get(User, b.guest_id)
        if guest:
            bd["guest"] = _user_to_dict(guest)
        result.append(bd)

    return {"bookings": result, "total": len(result), "page": 1, "limit": 50, "total_pages": 1}


@router.get("/host/stats")
def get_host_stats(session: Session = Depends(get_session)):
    listings = session.exec(
        select(Listing).where(Listing.host_id == DEFAULT_USER_ID)
    ).all()
    listing_ids = [l.id for l in listings]

    active_bookings = 0
    total_earnings = 0.0
    if listing_ids:
        bookings = session.exec(
            select(Booking).where(
                Booking.listing_id.in_(listing_ids),
                Booking.status.in_(["confirmed", "paid", "requested"])
            )
        ).all()
        active_bookings = len(bookings)

        completed_bookings = session.exec(
            select(Booking).where(
                Booking.listing_id.in_(listing_ids),
                Booking.status.in_(["completed", "confirmed", "paid"])
            )
        ).all()
        total_earnings = sum(b.total_price for b in completed_bookings)

    ratings = [l.avg_rating for l in listings if l.review_count > 0]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

    return {
        "total_listings": len(listings),
        "active_bookings": active_bookings,
        "avg_rating": avg_rating,
        "total_earnings": round(total_earnings, 2),
    }


# ===================================================================
# RESERVATION SHARING
# ===================================================================

class ShareBookingRequest(BaseModel):
    shared_with_email: str = ""


@router.post("/bookings/{booking_id}/share")
def share_booking(booking_id: int, body: ShareBookingRequest, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your booking")

    token = secrets.token_urlsafe(16)
    share = ReservationShare(
        booking_id=booking_id,
        shared_by_user_id=DEFAULT_USER_ID,
        shared_with_email=body.shared_with_email,
        share_token=token,
    )
    session.add(share)
    session.commit()
    session.refresh(share)

    return {
        "id": share.id,
        "booking_id": share.booking_id,
        "shared_with_email": share.shared_with_email,
        "share_token": share.share_token,
        "share_url": f"/shared/{share.share_token}",
        "created_at": share.created_at.isoformat() if share.created_at else None,
    }


@router.get("/bookings/shared/{token}")
def get_shared_booking(token: str, session: Session = Depends(get_session)):
    share = session.exec(
        select(ReservationShare).where(ReservationShare.share_token == token)
    ).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")

    booking = session.get(Booking, share.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    listing = session.get(Listing, booking.listing_id)
    listing_dict = None
    if listing:
        listing_dict = _listing_to_dict(listing)
        images = session.exec(
            select(ListingImage).where(ListingImage.listing_id == listing.id).order_by(ListingImage.sort_order)
        ).all()
        listing_dict["images"] = [{"id": img.id, "url": img.url, "caption": img.caption, "sort_order": img.sort_order} for img in images]

    guest = session.get(User, booking.guest_id)
    guest_name = guest.name.split()[0] if guest else "Guest"

    return {
        "id": booking.id,
        "listing_id": booking.listing_id,
        "guest_first_name": guest_name,
        "check_in": str(booking.check_in),
        "check_out": str(booking.check_out),
        "num_guests": booking.num_guests,
        "status": booking.status,
        "listing": listing_dict,
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
    }


@router.get("/bookings/{booking_id}/shares")
def list_booking_shares(booking_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your booking")

    shares = session.exec(
        select(ReservationShare).where(ReservationShare.booking_id == booking_id)
    ).all()

    return [
        {
            "id": s.id,
            "booking_id": s.booking_id,
            "shared_with_email": s.shared_with_email,
            "share_token": s.share_token,
            "share_url": f"/shared/{s.share_token}",
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in shares
    ]


@router.delete("/bookings/{booking_id}/shares/{share_id}")
def delete_booking_share(booking_id: int, share_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=403, detail="Not your booking")

    share = session.get(ReservationShare, share_id)
    if not share or share.booking_id != booking_id:
        raise HTTPException(status_code=404, detail="Share not found")

    session.delete(share)
    session.commit()
    return {"message": "Share removed"}


# ===================================================================
# SYMBOLIC PAYMENT
# ===================================================================

@router.post("/bookings/{booking_id}/pay")
def pay_booking(booking_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be paid")

    booking.status = "paid"
    booking.updated_at = datetime.now(timezone.utc)
    session.add(booking)

    payment = Payment(
        booking_id=booking_id,
        amount=booking.total_price,
        currency=booking.currency or "USD",
        payment_method="credit_card",
        transaction_id=secrets.token_hex(16),
        status="completed",
    )
    session.add(payment)
    session.commit()
    session.refresh(booking)
    return _booking_to_dict(booking)


@router.get("/bookings/{booking_id}/receipt")
def get_booking_receipt(booking_id: int, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    listing = session.get(Listing, booking.listing_id)
    listing_title = listing.title if listing else ""
    host = session.get(User, listing.host_id) if listing else None
    host_name = host.name if host else ""

    nights = (booking.check_out - booking.check_in).days

    return {
        "confirmation_code": booking.confirmation_code,
        "booking_id": booking.id,
        "listing_title": listing_title,
        "host_name": host_name,
        "check_in": str(booking.check_in),
        "check_out": str(booking.check_out),
        "nights": nights,
        "guests": booking.num_guests,
        "price_per_night": booking.price_per_night,
        "cleaning_fee": booking.cleaning_fee,
        "service_fee": booking.service_fee,
        "total": booking.total_price,
        "currency": booking.currency,
        "status": booking.status,
        "booked_at": booking.created_at.isoformat() if booking.created_at else None,
    }


# ===================================================================
# LISTING AVAILABILITY CALENDAR & BLOCKED DATES
# ===================================================================

class BlockedDatesCreate(BaseModel):
    dates: list[str]
    reason: str = "unavailable"


@router.get("/listings/{listing_id}/calendar")
def get_listing_calendar(
    listing_id: int,
    month: str = Query(...),
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    try:
        year, mon = month.split("-")
        year_int, mon_int = int(year), int(mon)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

    num_days = cal_mod.monthrange(year_int, mon_int)[1]
    today = ENV_TODAY

    month_start = date(year_int, mon_int, 1)
    month_end = date(year_int, mon_int, num_days)

    # Get bookings overlapping this month
    bookings = session.exec(
        select(Booking).where(
            Booking.listing_id == listing_id,
            Booking.status.in_(["confirmed", "pending", "requested", "paid"]),
            Booking.check_in <= month_end,
            Booking.check_out > month_start,
        )
    ).all()

    # Get blocked dates in this month
    blocked_dates_db = session.exec(
        select(BlockedDate).where(
            BlockedDate.listing_id == listing_id,
            BlockedDate.date >= month_start,
            BlockedDate.date <= month_end,
        )
    ).all()
    blocked_map = {bd.date: bd.reason for bd in blocked_dates_db}

    days = []
    for day_num in range(1, num_days + 1):
        d = date(year_int, mon_int, day_num)
        if d < today:
            day_info: dict = {"date": str(d), "status": "past"}
        elif d in blocked_map:
            day_info = {"date": str(d), "status": "blocked", "reason": blocked_map[d]}
        else:
            booked_booking = None
            for b in bookings:
                if b.check_in <= d < b.check_out:
                    booked_booking = b
                    break
            if booked_booking:
                day_info = {"date": str(d), "status": "booked", "booking_id": booked_booking.id}
            else:
                day_info = {"date": str(d), "status": "available"}
        days.append(day_info)

    return {
        "listing_id": listing_id,
        "month": month,
        "days": days,
    }


@router.get("/listings/{listing_id}/blocked-dates")
def get_blocked_dates(
    listing_id: int,
    month: Optional[str] = Query(None, description="Filter by month in YYYY-MM format"),
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    stmt = select(BlockedDate).where(BlockedDate.listing_id == listing_id)

    if month:
        from calendar import monthrange
        year, mon = int(month.split("-")[0]), int(month.split("-")[1])
        first_day = date(year, mon, 1)
        last_day = date(year, mon, monthrange(year, mon)[1])
        stmt = stmt.where(BlockedDate.date >= first_day, BlockedDate.date <= last_day)

    blocked = session.exec(stmt).all()
    return [
        {
            "id": b.id,
            "listing_id": b.listing_id,
            "date": str(b.date),
            "reason": b.reason,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in blocked
    ]


@router.post("/listings/{listing_id}/blocked-dates")
def block_dates(
    listing_id: int,
    body: BlockedDatesCreate,
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    created = []
    for date_str in body.dates:
        d = date.fromisoformat(date_str)
        existing = session.exec(
            select(BlockedDate).where(
                BlockedDate.listing_id == listing_id,
                BlockedDate.date == d,
            )
        ).first()
        if not existing:
            bd = BlockedDate(listing_id=listing_id, date=d, reason=body.reason)
            session.add(bd)
            created.append(str(d))
    session.commit()

    return {"blocked": created, "listing_id": listing_id}


@router.delete("/listings/{listing_id}/blocked-dates")
def unblock_dates(
    listing_id: int,
    dates: str = Query(...),
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    date_list = [d.strip() for d in dates.split(",")]
    removed = []
    for date_str in date_list:
        d = date.fromisoformat(date_str)
        existing = session.exec(
            select(BlockedDate).where(
                BlockedDate.listing_id == listing_id,
                BlockedDate.date == d,
            )
        ).first()
        if existing:
            session.delete(existing)
            removed.append(str(d))
    session.commit()

    return {"unblocked": removed, "listing_id": listing_id}


# ===================================================================
# ADDITIONAL CRUD ENDPOINTS
# ===================================================================

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None


@router.put("/help/tickets/{ticket_id}")
def update_ticket(ticket_id: int, body: TicketUpdate, session: Session = Depends(get_session)):
    ticket = session.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return {"id": ticket.id, "subject": ticket.subject, "status": ticket.status, "category": ticket.category, "description": ticket.description}


@router.delete("/help/tickets/{ticket_id}")
def delete_ticket(ticket_id: int, session: Session = Depends(get_session)):
    ticket = session.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    session.delete(ticket)
    session.commit()
    return {"message": "Ticket deleted"}


@router.delete("/messages/{message_id}")
def delete_message(message_id: int, session: Session = Depends(get_session)):
    msg = session.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    session.delete(msg)
    session.commit()
    return {"message": "Message deleted"}


@router.delete("/messages/threads/{thread_id}")
def delete_thread(thread_id: int, session: Session = Depends(get_session)):
    thread = session.get(MessageThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    messages = session.exec(select(Message).where(Message.thread_id == thread_id)).all()
    for m in messages:
        session.delete(m)
    session.delete(thread)
    session.commit()
    return {"message": "Thread deleted"}


@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int, session: Session = Depends(get_session)):
    notif = session.get(Notification, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    session.delete(notif)
    session.commit()
    return {"message": "Notification deleted"}
