import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiPlus, FiX, FiChevronLeft, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import { useAppContext } from '../App';
import { getWishlists, getWishlist, createWishlist, updateWishlist, deleteWishlist, removeFromWishlist } from '../api';
import type { Wishlist } from '../types';
import ListingCard from './ListingCard';

export default function WishlistPage() {
  const { user, addToast } = useAppContext();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedWishlist, setExpandedWishlist] = useState<Wishlist | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchWishlists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWishlists();
      // Fetch details for each wishlist to get cover images
      const detailed = await Promise.all(
        data.map(async (w) => {
          try {
            const full = await getWishlist(w.id);
            return full;
          } catch {
            return w;
          }
        })
      );
      setWishlists(detailed);
    } catch {
      addToast('error', 'Failed to load wishlists');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (user) {
      void fetchWishlists();
    } else {
      setLoading(false);
    }
  }, [user, fetchWishlists]);

  useEffect(() => {
    if (expandedId != null) {
      getWishlist(expandedId)
        .then(setExpandedWishlist)
        .catch(() => addToast('error', 'Failed to load wishlist details'));
    } else {
      setExpandedWishlist(null);
    }
  }, [expandedId, addToast]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await createWishlist(newName.trim());
      setWishlists((prev) => [...prev, created]);
      setNewName('');
      setShowCreateForm(false);
      addToast('success', 'Wishlist created!');
    } catch {
      addToast('error', 'Failed to create wishlist');
    } finally {
      setCreating(false);
    }
  }

  if (!user) {
    return (
      <div className="pt-[160px] min-h-screen flex flex-col items-center justify-center px-4">
        <FiHeart className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Log in to view wishlists</h2>
        <p className="text-gray-500 mb-6">You can create, view, and edit wishlists once you log in.</p>
        <Link
          to="/login"
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-[160px] min-h-screen px-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  async function handleRename() {
    if (!expandedWishlist || !renameValue.trim()) return;
    try {
      const updated = await updateWishlist(expandedWishlist.id, { name: renameValue.trim() });
      setExpandedWishlist({ ...expandedWishlist, name: updated.name });
      setWishlists((prev) => prev.map((w) => (w.id === updated.id ? { ...w, name: updated.name } : w)));
      setIsRenaming(false);
      addToast('success', 'Wishlist renamed');
    } catch {
      addToast('error', 'Failed to rename wishlist');
    }
  }

  async function handleDelete() {
    if (!expandedWishlist) return;
    try {
      await deleteWishlist(expandedWishlist.id);
      setWishlists((prev) => prev.filter((w) => w.id !== expandedWishlist.id));
      setExpandedId(null);
      setExpandedWishlist(null);
      setShowDeleteConfirm(false);
      addToast('success', 'Wishlist deleted');
    } catch {
      addToast('error', 'Failed to delete wishlist');
    }
  }

  // Expanded wishlist view
  if (expandedId != null && expandedWishlist) {
    return (
      <div className="pt-[160px] min-h-screen px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => { setExpandedId(null); setIsRenaming(false); setShowDeleteConfirm(false); }}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 font-medium mb-6"
          >
            <FiChevronLeft className="w-4 h-4" />
            Back to wishlists
          </button>
          <div className="flex items-center gap-3 mb-1">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                  className="text-3xl font-bold text-gray-900 border-b-2 border-rose-500 outline-none bg-transparent"
                  autoFocus
                />
                <button onClick={() => void handleRename()} className="text-rose-500 hover:text-rose-600">
                  <FiCheck className="w-6 h-6" />
                </button>
                <button onClick={() => setIsRenaming(false)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">{expandedWishlist.name}</h1>
                <button
                  onClick={() => { setRenameValue(expandedWishlist.name); setIsRenaming(true); }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  title="Rename wishlist"
                >
                  <FiEdit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-gray-400 hover:text-red-500 transition"
                  title="Delete wishlist"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {showDeleteConfirm && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <p className="text-sm text-red-700">Are you sure you want to delete this wishlist?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleDelete()}
                  className="px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-8">
            {expandedWishlist.item_count} {expandedWishlist.item_count === 1 ? 'stay' : 'stays'} saved
          </p>
          {expandedWishlist.listings && expandedWishlist.listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {expandedWishlist.listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onRemove={async (listingId) => {
                    try {
                      await removeFromWishlist(expandedWishlist.id, listingId);
                      setExpandedWishlist((prev) =>
                        prev ? {
                          ...prev,
                          listings: prev.listings?.filter((l) => l.id !== listingId),
                          item_count: Math.max(0, (prev.item_count || 0) - 1),
                        } : prev
                      );
                      setWishlists((prev) =>
                        prev.map((w) =>
                          w.id === expandedWishlist.id
                            ? { ...w, item_count: Math.max(0, (w.item_count || 0) - 1) }
                            : w
                        )
                      );
                      addToast('success', 'Removed from wishlist');
                    } catch {
                      addToast('error', 'Failed to remove from wishlist');
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FiHeart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No listings in this wishlist yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[160px] min-h-screen px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wishlists</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
          >
            <FiPlus className="w-4 h-4" />
            Create wishlist
          </button>
        </div>

        {/* Create form modal */}
        {showCreateForm && (
          <div className="mb-8 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Create wishlist</h3>
              <button
                onClick={() => { setShowCreateForm(false); setNewName(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                autoFocus
              />
              <button
                onClick={() => void handleCreate()}
                disabled={creating || !newName.trim()}
                className="bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Wishlist grid */}
        {wishlists.length === 0 ? (
          <div className="text-center py-16">
            <FiHeart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create your first wishlist</h2>
            <p className="text-gray-500 mb-6">
              As you search, tap the heart icon to save your favourite places and experiences.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Create wishlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((wishlist) => {
              const coverImage = wishlist.listings?.[0]?.images?.[0]?.url;
              return (
                <button
                  key={wishlist.id}
                  onClick={() => setExpandedId(wishlist.id)}
                  className="text-left group"
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={wishlist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiHeart className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{wishlist.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {wishlist.item_count} {wishlist.item_count === 1 ? 'stay' : 'stays'} saved
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
