import React, { useState, useEffect, useCallback } from 'react';
import { getListings } from '../api';
import type { ListingsResponse } from '../types';
import ListingCard from './ListingCard';
import CategoryRibbon from './CategoryRibbon';

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-xl" />
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function ListingGrid() {
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const fetchListings = useCallback(async (pageNum: number, categoryId: number | null, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params: Record<string, unknown> = { page: pageNum, limit: LIMIT, sort_by: 'rating' };
      if (categoryId !== null) {
        params.category_id = categoryId;
      }
      const result = await getListings(params as Parameters<typeof getListings>[0]);
      if (append && data) {
        setData({
          ...result,
          listings: [...data.listings, ...result.listings],
        });
      } else {
        setData(result);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [data]);

  useEffect(() => {
    setPage(1);
    fetchListings(1, selectedCategory, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleShowMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage, selectedCategory, true);
  };

  const hasMore = data ? data.page < data.total_pages : false;

  return (
    <div className="pt-[160px]">
      {/* Category ribbon — sticky below header */}
      <div className="sticky top-[140px] left-0 right-0 z-40 bg-white">
        <CategoryRibbon
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Listing grid */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 mt-6">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Listings grid */}
        {!loading && data && data.listings.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 mt-6">
              {data.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Show more button */}
            {hasMore && (
              <div className="flex justify-center py-10">
                <button
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Show more'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && data && data.listings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-xl font-semibold text-gray-800 mb-2">No listings found</p>
            <p className="text-gray-500">
              Try selecting a different category or adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
