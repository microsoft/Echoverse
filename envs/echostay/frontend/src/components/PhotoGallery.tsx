import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import type { ListingImage } from '../types';

interface PhotoGalleryProps {
  images: ListingImage[];
}

const cornerStyles: Record<number, string> = {
  0: 'rounded-tl-xl rounded-bl-xl',
  1: 'rounded-tr-xl',
  2: '',
  3: '',
  4: 'rounded-br-xl',
};

function getCornerClass(index: number, total: number): string {
  if (total <= 1) return 'rounded-xl';
  if (index === 0) return 'rounded-tl-xl rounded-bl-xl';
  if (index === 1) return total <= 2 ? 'rounded-tr-xl rounded-br-xl' : 'rounded-tr-xl';
  if (index === 4 || index === total - 1) return 'rounded-br-xl';
  return '';
}

export default function PhotoGallery({ images }: PhotoGalleryProps) {
  const [showModal, setShowModal] = useState(false);

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const main = sorted[0];
  const side = sorted.slice(1, 5);

  return (
    <>
      {/* Desktop 5-image grid */}
      <div className="hidden md:grid grid-cols-2 gap-[2px] h-[400px] relative">
        {/* Left: large image taking 50% width, full height */}
        {main && (
          <div className="row-span-1 overflow-hidden">
            <img
              src={main.url}
              alt={main.caption || 'Listing photo'}
              className={`w-full h-full object-cover ${getCornerClass(0, sorted.length)}`}
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="%23e5e7eb" width="400" height="400"/><text fill="%239ca3af" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="200">Image unavailable</text></svg>';
              }}
            />
          </div>
        )}

        {/* Right: 2×2 grid of 4 smaller images */}
        <div className="grid grid-cols-2 grid-rows-2 gap-[2px]">
          {side.map((img, idx) => (
            <div key={img.id} className="overflow-hidden">
              <img
                src={img.url}
                alt={img.caption || 'Listing photo'}
                className={`w-full h-full object-cover ${getCornerClass(idx + 1, sorted.length)}`}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="%23e5e7eb" width="400" height="400"/><text fill="%239ca3af" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="200">Image unavailable</text></svg>';
                }}
              />
            </div>
          ))}
        </div>

        {/* Show all photos button */}
        {sorted.length > 5 && (
          <button
            onClick={() => setShowModal(true)}
            className="absolute bottom-4 right-4 bg-white border border-gray-800 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            Show all photos
          </button>
        )}
      </div>

      {/* Mobile: horizontal scrollable carousel */}
      <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-2 scrollbar-hide">
        {sorted.map((img) => (
          <div key={img.id} className="flex-shrink-0 w-[85%] snap-center">
            <img
              src={img.url}
              alt={img.caption || 'Listing photo'}
              className="w-full h-64 object-cover rounded-xl"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="%23e5e7eb" width="400" height="400"/><text fill="%239ca3af" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="200">Image unavailable</text></svg>';
              }}
            />
          </div>
        ))}
      </div>

      {/* Full photos modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl overflow-y-auto p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sorted.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.caption || 'Listing photo'}
                  className="w-full rounded-lg object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="%23e5e7eb" width="400" height="400"/><text fill="%239ca3af" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="200">Image unavailable</text></svg>';
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
