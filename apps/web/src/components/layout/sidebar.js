'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = Sidebar;
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const utils_1 = require("@/lib/utils");
const store_1 = require("@/store");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const brand_1 = require("@/components/brand");
const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: lucide_react_1.LayoutDashboard },
    { name: 'Facturas', href: '/facturas', icon: lucide_react_1.FileText },
    { name: 'Recurrentes', href: '/facturas/recurrentes', icon: lucide_react_1.Repeat },
    { name: 'Reportes', href: '/reportes', icon: lucide_react_1.BarChart3 },
    { name: 'Clientes', href: '/clientes', icon: lucide_react_1.Users },
    { name: 'Soporte', href: '/soporte', icon: lucide_react_1.HelpCircle },
    { name: 'Configuracion', href: '/configuracion', icon: lucide_react_1.Settings },
];
function Sidebar() {
    const pathname = (0, navigation_1.usePathname)();
    const { sidebarOpen, toggleSidebar } = (0, store_1.useAppStore)();
    return (<aside className={(0, utils_1.cn)('fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300', sidebarOpen ? 'w-64' : 'w-16')}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {sidebarOpen ? (<link_1.default href="/dashboard" className="flex items-center">
            <brand_1.FacturoLogo variant="full" size="md"/>
          </link_1.default>) : (<link_1.default href="/dashboard" className="mx-auto">
            <brand_1.FacturoIcon size={32}/>
          </link_1.default>)}
        <button_1.Button variant="ghost" size="icon" onClick={toggleSidebar} className={(0, utils_1.cn)(!sidebarOpen && 'hidden')}>
          <lucide_react_1.ChevronLeft className="h-4 w-4"/>
        </button_1.Button>
      </div>

      {/* Expand button when collapsed */}
      {!sidebarOpen && (<div className="flex justify-center py-2 border-b">
          <button_1.Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            <lucide_react_1.ChevronRight className="h-4 w-4"/>
          </button_1.Button>
        </div>)}

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        {navigation.map((item) => {
            // Para Dashboard, solo activo si es exactamente /dashboard
            // Para otras rutas, activo si es exacta o es subruta
            const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            return (<link_1.default key={item.name} href={item.href} className={(0, utils_1.cn)('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground', !sidebarOpen && 'justify-center px-2')}>
              <item.icon className="h-5 w-5 shrink-0"/>
              {sidebarOpen && <span>{item.name}</span>}
            </link_1.default>);
        })}
      </nav>

      {/* Version */}
      {sidebarOpen && (<div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs text-muted-foreground">
            v1.0.0 - El Salvador
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            by Republicode
          </p>
        </div>)}
    </aside>);
}
