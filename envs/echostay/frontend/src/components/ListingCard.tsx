import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAppContext } from '../App';
import type { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
  onRemove?: (listingId: number) => void;
}

export default function ListingCard({ listing, onRemove }: ListingCardProps) {
  const { selectedCurrency, wishedListingIds, toggleWish } = useAppContext();
  const [currentImage, setCurrentImage] = useState(0);
  const [hovered, setHovered] = useState(false);

  const images = [...listing.images].sort((a, b) => a.sort_order - b.sort_order).slice(0, 5);
  const imageCount = images.length;

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  };

  const handleWishClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWish(listing.id);
    if (onRemove && wishedListingIds.has(listing.id)) {
      onRemove(listing.id);
    }
  };

  const isWished = wishedListingIds.has(listing.id);

  const convertedPrice = selectedCurrency
    ? (listing.price_per_night * selectedCurrency.exchange_rate).toFixed(2)
    : listing.price_per_night.toFixed(2);

  const currencySymbol = selectedCurrency?.symbol || '$';

  // Generate a realistic date range based on listing id for visual consistency
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = (listing.id * 3 + 2) % 12;
  const startDay = ((listing.id * 7 + 1) % 25) + 1;
  const endDay = startDay + 3 + (listing.id % 4);
  const dateRange = `${months[monthIdx]} ${startDay}–${endDay > 28 ? 28 : endDay}`;

  return (
    <Link to={`/listings/${listing.id}`} className="group block">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image carousel */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200">
          {images.length > 0 ? (
            <img
              src={images[currentImage].url}
              alt={images[currentImage].caption || listing.title}
              className="w-full h-full object-cover transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="%23e5e7eb" width="400" height="400"/><text fill="%239ca3af" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="200">Image unavailable</text></svg>';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}

          {/* Guest favourite badge — dark/teal semi-transparent pill */}
          {listing.is_guest_favourite && (
            <div className="absolute top-3 left-3 bg-gray-900/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Guest favourite
            </div>
          )}

          {/* Wish button */}
          <button
            onClick={handleWishClick}
            className="absolute top-3 right-3 p-1 transition-transform hover:scale-110"
            aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWished ? (
              <FaHeart className="w-6 h-6 text-red-500 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]" />
            ) : (
              <FaRegHeart className="w-6 h-6 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]" />
            )}
          </button>

          {/* Navigation arrows */}
          {hovered && imageCount > 1 && (
            <>
              {currentImage > 0 && (
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-opacity"
                >
                  <FiChevronLeft className="w-4 h-4 text-gray-800" />
                </button>
              )}
              {currentImage < imageCount - 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-opacity"
                >
                  <FiChevronRight className="w-4 h-4 text-gray-800" />
                </button>
              )}
            </>
          )}

          {/* Dot indicators */}
          {imageCount > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    i === currentImage ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details below image */}
        <div className="pt-2.5 pb-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-gray-900 truncate">
              {listing.title}
            </h3>
            {listing.avg_rating > 0 && (
              <span className="text-[15px] text-gray-900 flex items-center gap-0.5 flex-shrink-0 ml-1">
                ★ {listing.avg_rating.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {listing.city}{listing.state ? `, ${listing.state}` : ''}{listing.property_type ? ` · ${listing.property_type}` : ''}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {dateRange}
          </p>
          <p className="text-sm text-gray-900 mt-1">
            <span className="font-semibold">
              {currencySymbol}{convertedPrice}
            </span>
            {' '}
            <span className="font-normal text-gray-500">night</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
