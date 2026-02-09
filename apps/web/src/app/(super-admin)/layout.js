'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SuperAdminLayout;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const navigation = [
    { name: 'Dashboard', href: '/admin', icon: lucide_react_1.LayoutDashboard },
    { name: 'Empresas', href: '/admin/tenants', icon: lucide_react_1.Building2 },
    { name: 'Soporte', href: '/admin/support', icon: lucide_react_1.Ticket },
    { name: 'Catalogos', href: '/admin/catalogos', icon: lucide_react_1.Database },
    { name: 'Planes', href: '/admin/planes', icon: lucide_react_1.CreditCard },
    { name: 'Notificaciones', href: '/admin/notificaciones', icon: lucide_react_1.Bell },
    { name: 'Logs', href: '/admin/logs', icon: lucide_react_1.ScrollText },
    { name: 'Backups', href: '/admin/backups', icon: lucide_react_1.HardDrive },
    { name: 'Webhooks', href: '/admin/webhooks', icon: lucide_react_1.Webhook },
    { name: 'Administradores', href: '/admin/admins', icon: lucide_react_1.Users },
    { name: 'Configuracion', href: '/admin/settings', icon: lucide_react_1.Settings },
];
function SuperAdminLayout({ children, }) {
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(false);
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/admin/login');
                return;
            }
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    throw new Error('Unauthorized');
                }
                const userData = await res.json();
                if (userData.rol !== 'SUPER_ADMIN') {
                    localStorage.removeItem('token');
                    router.push('/admin/login');
                    return;
                }
                setUser(userData);
            }
            catch (err) {
                localStorage.removeItem('token');
                router.push('/admin/login');
                return;
            }
            finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);
    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/admin/login');
    };
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <lucide_react_1.Loader2 className="w-6 h-6 animate-spin text-primary"/>
          <span className="text-muted-foreground">Cargando panel de administracion...</span>
        </div>
      </div>);
    }
    if (!user) {
        return null;
    }
    return (<div className="min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (<div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}/>)}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 glass-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <lucide_react_1.FileText className="w-6 h-6 text-white"/>
              </div>
              <div>
                <div className="font-bold text-white">Super Admin</div>
                <div className="text-xs text-muted-foreground">Facturador SV</div>
              </div>
            </div>
            <button className="lg:hidden text-muted-foreground hover:text-white" onClick={() => setSidebarOpen(false)}>
              <lucide_react_1.X className="w-6 h-6"/>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (<link_1.default key={item.name} href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                  <item.icon className="w-5 h-5"/>
                  {item.name}
                </link_1.default>);
        })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <lucide_react_1.LogOut className="w-5 h-5"/>
              Cerrar Sesion
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-card border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <button className="lg:hidden text-muted-foreground hover:text-white" onClick={() => setSidebarOpen(true)}>
              <lucide_react_1.Menu className="w-6 h-6"/>
            </button>
            <div className="flex-1"/>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-medium">
                  {user.nombre?.charAt(0).toUpperCase() || 'SA'}
                </div>
                <span className="text-sm text-white">{user.nombre || 'Super Admin'}</span>
                <lucide_react_1.ChevronDown className="w-4 h-4 text-muted-foreground"/>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>);
}
