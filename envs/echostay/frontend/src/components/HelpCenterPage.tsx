import React, { useEffect, useState } from 'react';
import { FiSearch, FiChevronDown, FiChevronUp, FiPlus, FiClock } from 'react-icons/fi';
import { Calendar, User, CreditCard, Shield, Home } from 'lucide-react';
import type { HelpArticle, SupportTicket } from '../types';
import { getHelpArticles, createSupportTicket, getSupportTickets, updateTicket, deleteTicket } from '../api';

const CATEGORIES = [
  { key: 'booking', label: 'Booking', icon: <Calendar className="w-6 h-6" /> },
  { key: 'account', label: 'Account', icon: <User className="w-6 h-6" /> },
  { key: 'payments', label: 'Payments', icon: <CreditCard className="w-6 h-6" /> },
  { key: 'safety', label: 'Safety', icon: <Shield className="w-6 h-6" /> },
  { key: 'hosting', label: 'Hosting', icon: <Home className="w-6 h-6" /> },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || colors.open}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function HelpCenterPage() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCategory, setTicketCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await getHelpArticles({
        category: selectedCategory || undefined,
        q: searchQuery || undefined,
      });
      setArticles(data);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const data = await getSupportTickets();
      setTickets(data);
    } catch {
      setTickets([]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadArticles();
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;
    setSubmitting(true);
    try {
      await createSupportTicket({
        subject: ticketSubject,
        description: ticketDescription,
        category: ticketCategory,
      });
      setTicketSubject('');
      setTicketDescription('');
      setTicketCategory('general');
      setShowTicketForm(false);
      setFormSubmitted(false);
      loadTickets();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pt-[160px] pb-12">
      <h1 className="text-3xl font-bold mb-2">Help Centre</h1>
      <p className="text-gray-500 mb-8">Find answers to common questions or contact support</p>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800 transition"
          />
        </div>
      </form>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${
              selectedCategory === cat.key
                ? 'border-gray-800 bg-gray-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <span className="text-gray-700">{cat.icon}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          {selectedCategory
            ? `${CATEGORIES.find((c) => c.key === selectedCategory)?.label || ''} Articles`
            : 'All Articles'}
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No articles found.</p>
        ) : (
          <div className="space-y-2">
            {articles.map((article) => (
              <div key={article.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{article.title}</p>
                    <span className="text-xs text-gray-400 capitalize">{article.category}</span>
                  </div>
                  {expandedArticle === article.id ? (
                    <FiChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  )}
                </button>
                {expandedArticle === article.id && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-100">
                    {article.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Still need help */}
      <div className="border-t pt-8 mb-8">
        <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
        <p className="text-gray-500 text-sm mb-4">Create a support ticket and we'll get back to you.</p>
        {!showTicketForm ? (
          <button
            onClick={() => setShowTicketForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:brightness-95"
            style={{ backgroundColor: '#FF385C' }}
          >
            <FiPlus className="w-4 h-4" />
            Create Support Ticket
          </button>
        ) : (
          <form onSubmit={handleSubmitTicket} className="border border-gray-200 rounded-xl p-5 space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-800 ${formSubmitted && !ticketSubject.trim() ? 'border-red-400' : 'border-gray-300'}`}
              />
              {formSubmitted && !ticketSubject.trim() && (
                <p className="text-red-500 text-xs mt-1">Subject is required</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-800"
              >
                <option value="general">General</option>
                <option value="booking">Booking</option>
                <option value="account">Account</option>
                <option value="payments">Payments</option>
                <option value="safety">Safety</option>
                <option value="hosting">Hosting</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
              <textarea
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={4}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-800 resize-none ${formSubmitted && !ticketDescription.trim() ? 'border-red-400' : 'border-gray-300'}`}
              />
              {formSubmitted && !ticketDescription.trim() && (
                <p className="text-red-500 text-xs mt-1">Description is required</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowTicketForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition hover:brightness-95"
                style={{ backgroundColor: '#FF385C' }}
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Existing tickets */}
      {tickets.length > 0 && (
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Your Support Tickets</h2>
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const isExpanded = expandedTicketId === ticket.id;
              return (
                <div key={ticket.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-gray-400">Ticket #{ticket.id}</p>
                        <p className="font-medium text-sm">{ticket.subject}</p>
                        {!isExpanded && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={ticket.status} />
                        {isExpanded ? (
                          <FiChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <FiChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {!isExpanded && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <FiClock className="w-3 h-3" />
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        <p><span className="font-semibold text-gray-700">Subject:</span> {ticket.subject}</p>
                        <p><span className="font-semibold text-gray-700">Category:</span> <span className="capitalize">{ticket.category}</span></p>
                        <p><span className="font-semibold text-gray-700">Status:</span> <StatusBadge status={ticket.status} /></p>
                        <p><span className="font-semibold text-gray-700">Created:</span> {new Date(ticket.created_at).toLocaleString()}</p>
                        <div>
                          <span className="font-semibold text-gray-700">Description:</span>
                          <p className="mt-1 whitespace-pre-line">{ticket.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const updated = await updateTicket(ticket.id, { status: 'resolved' });
                                setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
                              } catch { /* ignore */ }
                            }}
                            className="px-4 py-1.5 text-sm font-medium text-white rounded-lg transition hover:brightness-95"
                            style={{ backgroundColor: '#FF385C' }}
                          >
                            Close Ticket
                          </button>
                        )}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await deleteTicket(ticket.id);
                              setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
                              if (expandedTicketId === ticket.id) setExpandedTicketId(null);
                            } catch { /* ignore */ }
                          }}
                          className="text-sm font-medium text-red-500 hover:text-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
