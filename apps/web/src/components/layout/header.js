'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = Header;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const store_1 = require("@/store");
const button_1 = require("@/components/ui/button");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
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
const priorityStyles = {
    LOW: 'border-l-2 border-l-gray-400',
    MEDIUM: 'border-l-2 border-l-blue-400',
    HIGH: 'border-l-2 border-l-orange-400',
    URGENT: 'border-l-2 border-l-red-400',
};
function Header() {
    const router = (0, navigation_1.useRouter)();
    const { tenant, user, theme, setTheme, setUser, setTenant } = (0, store_1.useAppStore)();
    const [notifications, setNotifications] = React.useState([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);
    React.useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);
    React.useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);
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
                    console.warn(`[Header] /notifications/count returned ${res.status}`);
                return;
            }
            const data = await res.json().catch(() => null);
            if (data && typeof data.count === 'number') {
                setUnreadCount(data.count);
            }
        }
        catch (err) {
            console.warn('[Header] Error fetching notification count:', err);
        }
    };
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token)
                return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                if (res.status !== 404)
                    console.warn(`[Header] /notifications returned ${res.status}`);
                return;
            }
            const data = await res.json().catch(() => null);
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        }
        catch (err) {
            console.warn('[Header] Error fetching notifications:', err);
        }
    };
    const dismissNotification = async (e, id) => {
        e.stopPropagation();
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
            console.warn('[Header] Error dismissing notification:', err);
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
            console.warn('[Header] Error dismissing all notifications:', err);
        }
    };
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };
    const getThemeIcon = () => {
        return theme === 'dark' ? <lucide_react_1.Moon className="h-5 w-5"/> : <lucide_react_1.Sun className="h-5 w-5"/>;
    };
    const getThemeLabel = () => {
        return theme === 'dark' ? 'Oscuro' : 'Claro';
    };
    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setTenant(null);
        router.push('/login');
    };
    const getNotificationIcon = (type) => {
        const Icon = typeIcons[type] || lucide_react_1.Info;
        return <Icon className="h-4 w-4 text-primary"/>;
    };
    return (<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-6">
      {/* Company Name */}
      <div className="min-w-0">
        {tenant?.nombre ? (<>
            <h1 className="text-lg font-semibold truncate">
              {tenant.nombre}
            </h1>
            <p className="text-xs text-muted-foreground">
              NIT: {tenant.nit}
            </p>
          </>) : (<div className="space-y-2">
            <div className="h-5 w-48 bg-muted animate-pulse rounded"/>
            <div className="h-3 w-32 bg-muted animate-pulse rounded"/>
          </div>)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications Dropdown */}
        <dropdown_menu_1.DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <dropdown_menu_1.DropdownMenuTrigger asChild>
            <button_1.Button variant="ghost" size="icon" className="relative">
              <lucide_react_1.Bell className="h-5 w-5"/>
              {unreadCount > 0 && (<span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>)}
            </button_1.Button>
          </dropdown_menu_1.DropdownMenuTrigger>
          <dropdown_menu_1.DropdownMenuContent align="end" className="w-96">
            <dropdown_menu_1.DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              {notifications.length > 0 && (<button onClick={dismissAll} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <lucide_react_1.CheckCheck className="w-3 h-3"/>
                  Marcar todas como leidas
                </button>)}
            </dropdown_menu_1.DropdownMenuLabel>
            <dropdown_menu_1.DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (<div className="py-8 text-center">
                  <lucide_react_1.Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2"/>
                  <p className="text-sm text-muted-foreground">
                    No hay notificaciones
                  </p>
                </div>) : (notifications.map((notification) => (<div key={notification.id} className={`p-3 hover:bg-muted/50 ${priorityStyles[notification.priority] || priorityStyles.MEDIUM}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          {notification.isDismissable && (<button onClick={(e) => dismissNotification(e, notification.id)} className="text-muted-foreground hover:text-foreground p-1 -m-1">
                              <lucide_react_1.X className="w-3 h-3"/>
                            </button>)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.actionUrl && (<a href={notification.actionUrl} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2" onClick={() => setIsOpen(false)}>
                            {notification.actionLabel || 'Ver mas'}
                            <lucide_react_1.ExternalLink className="w-3 h-3"/>
                          </a>)}
                      </div>
                    </div>
                  </div>)))}
            </div>
          </dropdown_menu_1.DropdownMenuContent>
        </dropdown_menu_1.DropdownMenu>

        {/* Theme Toggle */}
        <button_1.Button variant="ghost" size="icon" onClick={toggleTheme} title={`Tema: ${getThemeLabel()}`}>
          {getThemeIcon()}
        </button_1.Button>

        {/* User Menu */}
        <dropdown_menu_1.DropdownMenu>
          <dropdown_menu_1.DropdownMenuTrigger asChild>
            <button_1.Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <lucide_react_1.User className="h-4 w-4"/>
              </div>
              <span className="hidden md:inline-block">
                {user?.name || 'Usuario'}
              </span>
            </button_1.Button>
          </dropdown_menu_1.DropdownMenuTrigger>
          <dropdown_menu_1.DropdownMenuContent align="end" className="w-56">
            <dropdown_menu_1.DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Usuario'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
              </div>
            </dropdown_menu_1.DropdownMenuLabel>
            <dropdown_menu_1.DropdownMenuSeparator />
            <dropdown_menu_1.DropdownMenuItem onClick={() => router.push('/configuracion')}>
              <lucide_react_1.Settings className="mr-2 h-4 w-4"/>
              Configuracion
            </dropdown_menu_1.DropdownMenuItem>
            <dropdown_menu_1.DropdownMenuSeparator />
            <dropdown_menu_1.DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <lucide_react_1.LogOut className="mr-2 h-4 w-4"/>
              Cerrar Sesion
            </dropdown_menu_1.DropdownMenuItem>
          </dropdown_menu_1.DropdownMenuContent>
        </dropdown_menu_1.DropdownMenu>
      </div>
    </header>);
}
