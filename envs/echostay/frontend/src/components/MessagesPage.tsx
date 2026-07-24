import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiSearch, FiTrash2 } from 'react-icons/fi';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAppContext } from '../App';
import { getMessageThreads, getThread, sendMessage, markRead, deleteThread } from '../api';
import type { MessageThread, ThreadDetail } from '../types';

export default function MessagesPage() {
  const { user, addToast } = useAppContext();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');

  const fetchThreads = useCallback(async () => {
    try {
      const data = await getMessageThreads();
      setThreads(data);
    } catch {
      addToast('error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (user) void fetchThreads();
    else setLoading(false);
  }, [user, fetchThreads]);

  const openThread = async (threadId: number) => {
    try {
      const detail = await getThread(threadId);
      setSelectedThread(detail);
      // Mark unread messages as read
      const unreadMessages = detail.messages.filter((m) => !m.is_read && m.sender_id !== user?.id);
      await Promise.all(unreadMessages.map((m) => markRead(m.id).catch(() => {})));
      if (unreadMessages.length > 0) {
        setSelectedThread({
          ...detail,
          messages: detail.messages.map((m) => unreadMessages.some((u) => u.id === m.id) ? { ...m, is_read: true } : m),
        });
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t))
        );
      }
    } catch {
      addToast('error', 'Failed to load conversation');
    }
  };

  const handleDeleteThread = async (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteThread(threadId);
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (selectedThread?.thread.id === threadId) setSelectedThread(null);
      addToast('success', 'Conversation deleted');
    } catch {
      addToast('error', 'Failed to delete conversation');
    }
  };

  const filteredThreads = threads.filter(
    (t) => !threadSearch || (t.other_user?.name || '').toLowerCase().includes(threadSearch.toLowerCase())
  );

  const handleSend = async () => {
    if (!input.trim() || !selectedThread) return;
    setSending(true);
    try {
      await sendMessage({ thread_id: selectedThread.thread.id, content: input.trim() });
      setInput('');
      const detail = await getThread(selectedThread.thread.id);
      setSelectedThread(detail);
      void fetchThreads();
    } catch {
      addToast('error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-[160px] min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Log in to view messages</h2>
        <Link to="/login" className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg transition">
          Log in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-[160px] min-h-screen px-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[160px] min-h-screen flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex px-4 pb-4" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Thread list sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
          <h1 className="text-xl font-bold text-gray-900 p-4">Messages</h1>
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
          </div>
          {filteredThreads.length === 0 ? (
            <p className="text-gray-500 text-sm px-4 py-3">{threads.length === 0 ? 'No messages yet' : 'No matching conversations'}</p>
          ) : (
            filteredThreads.map((t) => (
              <button
                key={t.id}
                onClick={() => openThread(t.id)}
                className={`group relative w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                  selectedThread?.thread.id === t.id ? 'bg-gray-50' : ''
                }`}
              >
                <button
                  onClick={(e) => handleDeleteThread(t.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete conversation"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {t.other_user?.avatar_url ? (
                      <img src={t.other_user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      t.other_user?.name?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {t.other_user?.name || 'Unknown'}
                      </span>
                      {t.last_message && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatDistanceToNow(parseISO(t.last_message.created_at), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {t.listing && (
                      <p className="text-xs text-gray-500 truncate">{t.listing.title}</p>
                    )}
                    {t.last_message && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{t.last_message.content}</p>
                    )}
                  </div>
                  {t.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {t.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Conversation panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedThread ? (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs font-semibold">
                    {selectedThread.thread.other_user?.avatar_url ? (
                      <img src={selectedThread.thread.other_user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      selectedThread.thread.other_user?.name?.charAt(0) || '?'
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{selectedThread.thread.other_user?.name}</p>
                    {selectedThread.thread.listing && (
                      <Link to={`/listings/${selectedThread.thread.listing.id}`} className="text-xs text-rose-500 hover:underline">
                        {selectedThread.thread.listing.title}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedThread.messages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? 'bg-rose-500 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-rose-200' : 'text-gray-400'}`}>
                          {formatDistanceToNow(parseISO(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 disabled:opacity-50 transition"
                  >
                    <FiSend className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
