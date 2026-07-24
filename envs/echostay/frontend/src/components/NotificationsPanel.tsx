import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { FiMessageSquare, FiCalendar, FiStar, FiX, FiBell } from 'react-icons/fi';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api';
import type { NotificationItem } from '../types';

const typeIcons: Record<string, React.ReactNode> = {
  booking_confirmed: <FiCalendar className="w-4 h-4 text-green-600" />,
  booking_requested: <FiCalendar className="w-4 h-4 text-orange-500" />,
  booking_cancelled: <FiCalendar className="w-4 h-4 text-red-500" />,
  booking_declined: <FiCalendar className="w-4 h-4 text-red-500" />,
  message_received: <FiMessageSquare className="w-4 h-4 text-blue-500" />,
  review_posted: <FiStar className="w-4 h-4 text-yellow-500" />,
};

interface Props {
  onClose: () => void;
}

export default function NotificationsPanel({ onClose }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id).catch(() => {});
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[480px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-rose-500 font-medium hover:text-rose-600"
          >
            Mark all as read
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <FiBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 flex items-start gap-3 ${
                !notif.is_read ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {typeIcons[notif.type] || <FiBell className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </p>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className={`text-xs mt-0.5 line-clamp-2 ${!notif.is_read ? 'text-gray-700' : 'text-gray-500'}`}>{notif.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {formatDistanceToNow(parseISO(notif.created_at), { addSuffix: true })}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
