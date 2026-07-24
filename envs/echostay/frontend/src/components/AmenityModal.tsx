import React from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import type { AmenityItem } from '../types';

interface AmenityModalProps {
  amenities: AmenityItem[];
  onClose: () => void;
}

export default function AmenityModal({ amenities, onClose }: AmenityModalProps) {
  // Group amenities by category
  const grouped = amenities.reduce<Record<string, AmenityItem[]>>((acc, a) => {
    const cat = a.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[85vh] rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center p-4 border-b">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6">
          <h2 className="text-2xl font-semibold mb-6">What this place offers</h2>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
              <ul className="space-y-4">
                {items.map((amenity) => (
                  <li
                    key={amenity.id}
                    className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                  >
                    {amenity.icon ? (
                      <span className="text-xl flex-shrink-0">{amenity.icon}</span>
                    ) : (
                      <FiCheck className="w-5 h-5 text-gray-700 flex-shrink-0" />
                    )}
                    <span className="text-gray-700">{amenity.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
