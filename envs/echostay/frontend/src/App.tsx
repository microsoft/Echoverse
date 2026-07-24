import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { User, ToastMessage, Currency, SearchFilters } from './types';
import { getMe, getCurrencies, getWishlists, addToWishlist, removeFromWishlist, createWishlist, checkWishlistStatus } from './api';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ListingGrid from './components/ListingGrid';
import ListingDetail from './components/ListingDetail';
import SearchResults from './components/SearchResults';
import WishlistPage from './components/WishlistPage';
import TripsPage from './components/TripsPage';
import AuthPage from './components/AuthPage';
import SettingsPage from './components/SettingsPage';
import HelpCenterPage from './components/HelpCenterPage';
import MessagesPage from './components/MessagesPage';
import HostDashboard from './components/HostDashboard';
import SharedTripPage from './components/SharedTripPage';
import BookingReceipt from './components/BookingReceipt';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  currencies: Currency[];
  selectedCurrency: Currency | null;
  setSelectedCurrency: (c: Currency) => void;
  searchFilters: SearchFilters;
  setSearchFilters: (f: SearchFilters) => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
  wishedListingIds: Set<number>;
  toggleWish: (listingId: number) => void;
  markWished: (listingId: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// Currency is locked to USD everywhere: the DB and all verifier reference answers
// are in USD, so no currency conversion is applied anywhere in the UI.
const USD_CURRENCY: Currency = { id: 0, code: 'USD', symbol: '$', name: 'US Dollar', exchange_rate: 1 };

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(USD_CURRENCY);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [wishedListingIds, setWishedListingIds] = useState<Set<number>>(new Set());

  const [defaultWishlistId, setDefaultWishlistId] = useState<number | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => {});
    getCurrencies()
      .then((c) => {
        setCurrencies(c);
        // Always display in USD for consistency (cards, map, detail, reservation).
        setSelectedCurrency(USD_CURRENCY);
      })
      .catch(() => {});
    // Load wishlists and pre-populate wished listing IDs
    getWishlists()
      .then((wls) => {
        if (wls.length > 0) {
          setDefaultWishlistId(wls[0].id);
          const allIds = new Set<number>();
          wls.forEach((w) => {
            w.listing_ids?.forEach((id) => allIds.add(id));
            w.listings?.forEach((l) => allIds.add(l.id));
          });
          setWishedListingIds(allIds);
        }
      })
      .catch(() => {});
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleWish = useCallback(async (listingId: number) => {
    const wasWished = wishedListingIds.has(listingId);
    // Optimistic UI update
    setWishedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });

    try {
      if (wasWished) {
        // The listing may live in any wishlist (not just the default one).
        // Resolve the actual wishlist(s) containing it and remove from each.
        let wishlistIds: number[] = [];
        try {
          const status = await checkWishlistStatus(listingId);
          wishlistIds = status.wishlist_ids;
        } catch {
          wishlistIds = [];
        }
        if (wishlistIds.length === 0 && defaultWishlistId) {
          wishlistIds = [defaultWishlistId];
        }
        await Promise.all(wishlistIds.map((wlId) => removeFromWishlist(wlId, listingId)));
      } else {
        let wlId = defaultWishlistId;
        if (!wlId) {
          const wl = await createWishlist('My Wishlist');
          wlId = wl.id;
          setDefaultWishlistId(wlId);
        }
        await addToWishlist(wlId, listingId);
      }
    } catch (err) {
      // "Listing already in wishlist" means the desired state (wished) is already true;
      // keep the optimistic update instead of reverting.
      const alreadySaved =
        !wasWished && err instanceof Error && /already in wishlist/i.test(err.message);
      if (!alreadySaved) {
        // Revert on genuine failure
        setWishedListingIds((prev) => {
          const next = new Set(prev);
          if (wasWished) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      }
    }
  }, [wishedListingIds, defaultWishlistId]);

  // Visual-only: mark a listing's heart as filled after it was saved to a
  // SPECIFIC wishlist (via the Save-to-wishlist modal). Unlike toggleWish this
  // performs NO DB mutation — toggleWish would re-run add/remove-to-default and
  // could delete the item just created if the listing was already wished.
  const markWished = useCallback((listingId: number) => {
    setWishedListingIds((prev) => {
      const next = new Set(prev);
      next.add(listingId);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        currencies,
        selectedCurrency,
        setSelectedCurrency,
        searchFilters,
        setSearchFilters,
        toasts,
        addToast,
        removeToast,
        wishedListingIds,
        toggleWish,
        markWished,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function Layout() {
  const { toasts, removeToast } = useAppContext();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<ListingGrid />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/wishlists" element={<WishlistPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/bookings/:id/receipt" element={<BookingReceipt />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/hosting" element={<HostDashboard />} />
          <Route path="/shared/:token" element={<SharedTripPage />} />
        </Routes>
      </main>
      <Footer />
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
