'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Bell, User, LogOut, Settings, Info, X, ExternalLink, Megaphone, Zap, Shield, AlertTriangle, AlertCircle, CheckCheck } from 'lucide-react';

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isDismissable: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SYSTEM_ANNOUNCEMENT: Megaphone,
  MAINTENANCE: Settings,
  NEW_FEATURE: Zap,
  PLAN_LIMIT_WARNING: AlertTriangle,
  PLAN_EXPIRED: AlertCircle,
  SECURITY_ALERT: Shield,
  GENERAL: Info,
};

const priorityStyles: Record<string, string> = {
  LOW: 'border-l-2 border-l-gray-400',
  MEDIUM: 'border-l-2 border-l-blue-400',
  HIGH: 'border-l-2 border-l-orange-400',
  URGENT: 'border-l-2 border-l-red-400',
};

export function Header() {
  const router = useRouter();
  const { tenant, user, theme, setTheme, setUser, setTenant } = useAppStore();
  const [notifications, setNotifications] = React.useState<SystemNotification[]>([]);
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
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const dismissNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/dismiss`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  const dismissAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/dismiss-all`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error dismissing all notifications:', err);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getThemeIcon = () => {
    return theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
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

  const getNotificationIcon = (type: string) => {
    const Icon = typeIcons[type] || Info;
    return <Icon className="h-4 w-4 text-primary" />;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-6">
      {/* Company Name */}
      <div className="min-w-0">
        {tenant?.nombre ? (
          <>
            <h1 className="text-lg font-semibold truncate">
              {tenant.nombre}
            </h1>
            <p className="text-xs text-muted-foreground">
              NIT: {tenant.nit}
            </p>
          </>
        ) : (
          <div className="space-y-2">
            <div className="h-5 w-48 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications Dropdown */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              {notifications.length > 0 && (
                <button
                  onClick={dismissAll}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todas como leidas
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay notificaciones
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 ${priorityStyles[notification.priority] || priorityStyles.MEDIUM}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          {notification.isDismissable && (
                            <button
                              onClick={(e) => dismissNotification(e, notification.id)}
                              className="text-muted-foreground hover:text-foreground p-1 -m-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                            onClick={() => setIsOpen(false)}
                          >
                            {notification.actionLabel || 'Ver mas'}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={`Tema: ${getThemeLabel()}`}
        >
          {getThemeIcon()}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden md:inline-block">
                {user?.name || 'Usuario'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Usuario'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/configuracion')}>
              <Settings className="mr-2 h-4 w-4" />
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
