import React, { useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import type { AmenityItem } from '../types';
import AmenityModal from './AmenityModal';

interface AmenityListProps {
  amenities: AmenityItem[];
}

export default function AmenityList({ amenities }: AmenityListProps) {
  const [showModal, setShowModal] = useState(false);

  const visible = amenities.slice(0, 10);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map((amenity) => (
          <div key={amenity.id} className="flex items-center gap-3">
            {amenity.icon ? (
              <span className="text-xl flex-shrink-0">{amenity.icon}</span>
            ) : (
              <FiCheck className="w-5 h-5 text-gray-600 flex-shrink-0" />
            )}
            <span className="text-gray-700">{amenity.name}</span>
          </div>
        ))}
      </div>
      {amenities.length > 10 && (
        <button
          onClick={() => setShowModal(true)}
          className="mt-6 px-6 py-3 border border-gray-800 rounded-lg font-medium text-gray-800 hover:bg-gray-100 transition"
        >
          Show all {amenities.length} amenities
        </button>
      )}
      {showModal && (
        <AmenityModal
          amenities={amenities}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
