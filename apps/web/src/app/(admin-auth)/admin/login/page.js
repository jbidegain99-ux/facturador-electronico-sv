'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminLoginPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
function AdminLoginPage() {
    const router = (0, navigation_1.useRouter)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [checkingAuth, setCheckingAuth] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Check if already logged in as super admin
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.rol === 'SUPER_ADMIN') {
                            router.push('/admin');
                            return;
                        }
                    }
                }
                catch (err) {
                    // Token invalid, continue to login
                }
            }
            setCheckingAuth(false);
        };
        checkAuth();
    }, [router]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Credenciales invalidas');
            }
            const data = await res.json();
            // Verify it's a super admin
            if (data.user?.rol !== 'SUPER_ADMIN') {
                throw new Error('Acceso denegado. Esta página es solo para Super Administradores.');
            }
            localStorage.setItem('token', data.access_token);
            router.push('/admin');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        }
        finally {
            setLoading(false);
        }
    };
    if (checkingAuth) {
        return (<div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <lucide_react_1.Loader2 className="w-6 h-6 animate-spin text-primary"/>
          <span className="text-muted-foreground">Verificando sesión...</span>
        </div>
      </div>);
    }
    return (<div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4">
            <lucide_react_1.Shield className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <p className="text-muted-foreground mt-2">Facturador Electrónico SV</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (<div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <lucide_react_1.AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0"/>
                <p className="text-sm text-red-400">{error}</p>
              </div>)}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Correo electrónico
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ejemplo.com" className="input-rc"/>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Contraseña
              </label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-rc pr-10"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                  {showPassword ? <lucide_react_1.EyeOff className="w-4 h-4"/> : <lucide_react_1.Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? (<>
                  <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/>
                  Verificando...
                </>) : (<>
                  <lucide_react_1.Shield className="w-4 h-4"/>
                  Ingresar al Panel
                </>)}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Acceso restringido a Super Administradores
        </p>
      </div>
    </div>);
}
