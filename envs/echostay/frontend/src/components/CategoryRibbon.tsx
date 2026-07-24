import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../api';
import type { CategoryItem } from '../types';

/* SVG icon map — reliable cross-platform rendering (emoji fallback for unmapped) */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Icons: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="16,2 20.9,11.9 31.7,13.5 23.8,21.1 25.8,31.8 16,26.6 6.2,31.8 8.2,21.1 0.3,13.5 11.1,11.9" />
    </svg>
  ),
  'Amazing views': (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 28 L12 14 L18 22 L22 18 L28 28 Z" />
      <circle cx="22" cy="8" r="3" />
    </svg>
  ),
  Rooms: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 24 V14 H28 V24" />
      <path d="M4 14 Q4 8, 16 8 Q28 8, 28 14" />
      <line x1="2" y1="24" x2="30" y2="24" />
    </svg>
  ),
  Beachfront: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4 V18 M16 4 Q8 10, 8 18 M16 4 Q24 10, 24 18" />
      <path d="M2 28 Q8 22, 16 28 Q24 22, 30 28" />
    </svg>
  ),
  Cabins: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 18 L16 6 L28 18 V28 H4 Z" />
      <rect x="12" y="20" width="8" height="8" />
    </svg>
  ),
  'OMG!': (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="16" cy="16" r="13" />
      <path d="M10 20 Q16 26, 22 20" />
      <circle cx="11" cy="13" r="1.5" fill="currentColor" />
      <circle cx="21" cy="13" r="1.5" fill="currentColor" />
    </svg>
  ),
  Lakefront: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20 Q8 16, 16 20 Q24 24, 30 20" />
      <path d="M2 24 Q8 20, 16 24 Q24 28, 30 24" />
      <path d="M10 18 V8 L22 8 V18" />
    </svg>
  ),
  Trending: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4 C16 4 20 12 20 18 C20 22 18 26 16 28 C14 26 12 22 12 18 C12 12 16 4 16 4 Z" />
    </svg>
  ),
  Countryside: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 28 L8 14 L14 28" />
      <path d="M10 28 L18 8 L26 28" />
      <path d="M22 28 L28 16 L30 28" />
    </svg>
  ),
  Mansions: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="12" width="20" height="16" />
      <path d="M4 12 L16 4 L28 12" />
      <rect x="13" y="20" width="6" height="8" />
      <rect x="8" y="14" width="4" height="4" />
      <rect x="20" y="14" width="4" height="4" />
    </svg>
  ),
  Treehouses: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="16" y1="18" x2="16" y2="30" />
      <circle cx="16" cy="12" r="8" />
      <rect x="12" y="14" width="8" height="6" />
    </svg>
  ),
  Castles: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 28 V10 H10 V6 H14 V10 H18 V6 H22 V10 H26 V28 Z" />
      <rect x="13" y="20" width="6" height="8" />
    </svg>
  ),
  Pools: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 22 Q8 18, 16 22 Q24 26, 30 22" />
      <path d="M2 26 Q8 22, 16 26 Q24 30, 30 26" />
      <path d="M10 20 V8" />
      <path d="M22 20 V8" />
      <path d="M10 8 H22" />
      <path d="M10 14 H22" />
    </svg>
  ),
  Farms: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 28 V14 L16 6 L28 14 V28 Z" />
      <path d="M4 14 L16 22 L28 14" />
      <rect x="13" y="22" width="6" height="6" />
    </svg>
  ),
  Tropical: (
    <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 30 V14" />
      <path d="M16 14 Q8 4, 4 8 Q2 14, 16 14" />
      <path d="M16 14 Q24 4, 28 8 Q30 14, 16 14" />
    </svg>
  ),
};

interface CategoryRibbonProps {
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
}

export default function CategoryRibbon({ selectedCategory, onSelectCategory }: CategoryRibbonProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [showTaxToggle, setShowTaxToggle] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, categories]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  if (categories.length === 0) return null;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-4 py-3">
          {/* Scrollable category icons */}
          <div className="relative flex-1 min-w-0 group/ribbon">
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition"
                aria-label="Scroll categories left"
              >
                <FiChevronLeft className="w-3.5 h-3.5 text-gray-700" />
              </button>
            )}

            <div
              ref={scrollRef}
              className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const icon = CATEGORY_ICONS[cat.name];
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(isActive ? null : cat.id)}
                    className={`flex flex-col items-center gap-1.5 min-w-[56px] py-2 border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                    }`}
                    aria-label={cat.name}
                    title={cat.name}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                      {icon || <span className="text-xl leading-none">{cat.icon}</span>}
                    </span>
                    <span className="text-[11px] font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition"
                aria-label="Scroll categories right"
              >
                <FiChevronRight className="w-3.5 h-3.5 text-gray-700" />
              </button>
            )}
          </div>

          {/* Display total before taxes toggle */}
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-200 flex-shrink-0">
            <button
              onClick={() => navigate('/search?openFilters=1')}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-500 transition whitespace-nowrap"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M4 8h8M6 12h4" />
              </svg>
              Filters
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
              <span>Display total before taxes</span>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  showTaxToggle ? 'bg-gray-900' : 'bg-gray-300'
                }`}
                onClick={(e) => { e.preventDefault(); setShowTaxToggle(!showTaxToggle); }}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    showTaxToggle ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
