'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationBell = NotificationBell;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const typeIcons = {
    SYSTEM_ANNOUNCEMENT: lucide_react_1.Megaphone,
    MAINTENANCE: lucide_react_1.Settings,
    NEW_FEATURE: lucide_react_1.Zap,
    PLAN_LIMIT_WARNING: lucide_react_1.AlertTriangle,
    PLAN_EXPIRED: lucide_react_1.AlertCircle,
    SECURITY_ALERT: lucide_react_1.Shield,
    GENERAL: lucide_react_1.Info,
};
const priorityColors = {
    LOW: 'border-l-gray-400',
    MEDIUM: 'border-l-blue-400',
    HIGH: 'border-l-orange-400',
    URGENT: 'border-l-red-400',
};
function NotificationBell() {
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const [unreadCount, setUnreadCount] = (0, react_1.useState)(0);
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const dropdownRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);
    (0, react_1.useEffect)(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token)
                return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                if (res.status !== 404)
                    console.warn(`[NotificationBell] /notifications/count returned ${res.status}`);
                return;
            }
            const data = await res.json().catch(() => null);
            if (data && typeof data.count === 'number') {
                setUnreadCount(data.count);
            }
        }
        catch (err) {
            console.warn('[NotificationBell] Error fetching notification count:', err);
        }
    };
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token)
                return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                if (res.status !== 404)
                    console.warn(`[NotificationBell] /notifications returned ${res.status}`);
                return;
            }
            const data = await res.json().catch(() => null);
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        }
        catch (err) {
            console.warn('[NotificationBell] Error fetching notifications:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const dismissNotification = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token)
                return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/dismiss`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }
        catch (err) {
            console.warn('[NotificationBell] Error dismissing notification:', err);
        }
    };
    const dismissAll = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token)
                return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/dismiss-all`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setNotifications([]);
                setUnreadCount(0);
            }
        }
        catch (err) {
            console.warn('[NotificationBell] Error dismissing all notifications:', err);
        }
    };
    const getIcon = (type) => {
        const Icon = typeIcons[type] || lucide_react_1.Info;
        return <Icon className="w-4 h-4"/>;
    };
    return (<div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
        <lucide_react_1.Bell className="w-5 h-5 text-muted-foreground"/>
        {unreadCount > 0 && (<span className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>)}
      </button>

      {isOpen && (<div className="absolute right-0 mt-2 w-96 max-h-[80vh] glass-card rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-white">Notificaciones</h3>
            {notifications.length > 0 && (<button onClick={dismissAll} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <lucide_react_1.CheckCheck className="w-3 h-3"/>
                Marcar todas como leídas
              </button>)}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (<div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
              </div>) : notifications.length === 0 ? (<div className="text-center py-8">
                <lucide_react_1.Bell className="w-10 h-10 text-muted-foreground mx-auto mb-2"/>
                <p className="text-sm text-muted-foreground">
                  No tienes notificaciones
                </p>
              </div>) : (<div className="divide-y divide-border">
                {notifications.map((notification) => (<div key={notification.id} className={`p-4 hover:bg-white/5 border-l-2 ${priorityColors[notification.priority] || priorityColors.MEDIUM}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-white">
                            {notification.title}
                          </h4>
                          {notification.isDismissable && (<button onClick={() => dismissNotification(notification.id)} className="text-muted-foreground hover:text-white p-1 -m-1">
                              <lucide_react_1.X className="w-3 h-3"/>
                            </button>)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.actionUrl && (<a href={notification.actionUrl} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                            {notification.actionLabel || 'Ver más'}
                            <lucide_react_1.ExternalLink className="w-3 h-3"/>
                          </a>)}
                      </div>
                    </div>
                  </div>))}
              </div>)}
          </div>
        </div>)}
    </div>);
}
