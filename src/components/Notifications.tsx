import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  items: Notification[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Context (optional global unread count) ──────────────────────────────────

interface NotifContextValue {
  unreadCount: number;
  refresh: () => void;
}

const NotifContext = React.createContext<NotifContextValue>({
  unreadCount: 0,
  refresh: () => {},
});

export const useNotifications = () => useContext(NotifContext);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const API = import.meta.env.VITE_API_URL as string;

// ─── NotificationsModal ───────────────────────────────────────────────────────

interface NotificationsModalProps {
  /** Custom trigger element. If omitted, a default bell button is rendered. */
  trigger?: (props: {
    onClick: () => void;
    unreadCount: number;
  }) => React.ReactNode;
  /** Alignment of the popover relative to the trigger */
  align?: "left" | "right";
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  trigger,
  align = "right",
}) => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(
    async (pg = 1, unreadOnly = onlyUnread, replace = true) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API}/notifications?page=${pg}&pageSize=20&onlyUnread=${unreadOnly}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("Failed to load notifications");
        const data: NotificationsResponse = await res.json();
        setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
        setUnreadCount(data.unreadCount);
        setTotalCount(data.totalCount);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [token, onlyUnread],
  );

  // Fetch on open
  useEffect(() => {
    if (open) fetchNotifications(1, onlyUnread, true);
  }, [open, onlyUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll unread count every 60s even when closed
  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API}/notifications?page=1&pageSize=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: NotificationsResponse = await res.json();
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // silent
      }
    };
    poll();
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, [token]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const markRead = async (id: string) => {
    if (!token) return;
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // revert optimistically if needed
      fetchNotifications(1, onlyUnread, true);
    }
  };

  const markAllRead = async () => {
    if (!token || markingAll) return;
    setMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      fetchNotifications(1, onlyUnread, true);
    } finally {
      setMarkingAll(false);
    }
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      fetchNotifications(page + 1, onlyUnread, false);
    }
  };

  const toggleFilter = () => {
    setOnlyUnread((v) => !v);
  };

  // ── Render trigger ─────────────────────────────────────────────────────────

  const handleToggle = () => setOpen((v) => !v);

  const defaultTrigger = (
    <button
      ref={triggerRef}
      onClick={handleToggle}
      className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]"
      aria-label="Notifications"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#6d28d9] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );

  const customTriggerEl = trigger ? (
    <span onClick={handleToggle} className="inline-flex cursor-pointer">
      {trigger({ onClick: handleToggle, unreadCount })}
    </span>
  ) : null;

  // ── Panel ──────────────────────────────────────────────────────────────────

  return (
    <NotifContext.Provider
      value={{ unreadCount, refresh: () => fetchNotifications(1, false, true) }}
    >
      <style>{`
        @keyframes notif-slide-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
        .notif-panel { animation: notif-slide-in 0.18s cubic-bezier(.22,1,.36,1) both; }
        .notif-item  { transition: background 0.12s; }
        .notif-item:hover { background: #f9f7ff; }
        .notif-scroll::-webkit-scrollbar { width: 4px; }
        .notif-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 999px; }
      `}</style>

      <div className="relative inline-flex items-center">
        {customTriggerEl ?? defaultTrigger}

        {open && (
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            className={`notif-panel absolute top-full mt-2 z-50 w-[380px] max-w-[calc(100vw-1rem)]
              bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col
              ${align === "right" ? "right-0" : "left-0"}`}
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900 text-sm">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#6d28d9] text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Filter toggle */}
                <button
                  onClick={toggleFilter}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                    onlyUnread
                      ? "bg-purple-50 text-[#6d28d9]"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {onlyUnread ? "All" : "Unread"}
                </button>
                {/* Mark all read */}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={markingAll}
                    className="text-xs font-medium text-[#6d28d9] hover:text-[#5b21b6] px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}
                {/* Close */}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="notif-scroll flex-1 overflow-y-auto">
              {loading && items.length === 0 ? (
                /* Skeleton loader */
                <div className="p-3 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-xl animate-pulse"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-full" />
                        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-sm text-gray-500">{error}</p>
                  <button
                    onClick={() => fetchNotifications(1, onlyUnread, true)}
                    className="text-xs font-semibold text-[#6d28d9] hover:underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-[#6d28d9] opacity-60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {onlyUnread ? "All caught up!" : "No notifications yet"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {onlyUnread
                        ? "You have no unread notifications."
                        : "We'll let you know when something happens."}
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="p-2 space-y-0.5">
                  {items.map((n) => (
                    <li key={n.id}>
                      <div
                        className={`notif-item flex gap-3 px-3 py-3 rounded-xl cursor-default ${
                          !n.isRead ? "bg-purple-50/60" : ""
                        }`}
                      >
                        {/* Dot indicator */}
                        <div className="shrink-0 pt-1">
                          <span
                            className={`block w-2.5 h-2.5 rounded-full mt-0.5 transition-colors ${
                              !n.isRead ? "bg-[#6d28d9]" : "bg-gray-200"
                            }`}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-snug truncate ${
                              !n.isRead
                                ? "font-semibold text-gray-900"
                                : "font-medium text-gray-700"
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>

                        {/* Mark read button */}
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n.id)}
                            title="Mark as read"
                            className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-[#6d28d9] hover:bg-purple-100 rounded-lg transition-colors self-start mt-0.5"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </li>
                  ))}

                  {/* Load more */}
                  {page < totalPages && (
                    <li className="pt-1">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="w-full py-2.5 text-xs font-semibold text-[#6d28d9] hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {loading ? "Loading…" : "Load more"}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-gray-100 px-4 py-2.5 flex items-center justify-between bg-gray-50/70">
              <span className="text-xs text-gray-400">{totalCount} total</span>
              <button
                onClick={() => fetchNotifications(1, onlyUnread, true)}
                disabled={loading}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-40"
              >
                <svg
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </NotifContext.Provider>
  );
};

export default NotificationsModal;
