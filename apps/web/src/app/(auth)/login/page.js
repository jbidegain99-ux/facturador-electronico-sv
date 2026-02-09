'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const brand_1 = require("@/components/brand");
function LoginPage() {
    const router = (0, navigation_1.useRouter)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
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
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Credenciales invalidas');
            }
            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            // Redirect based on user role
            if (data.user?.rol === 'SUPER_ADMIN') {
                router.push('/admin');
            }
            else {
                router.push('/dashboard');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <brand_1.FacturoLogo variant="full" size="lg"/>
        </div>

        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          Iniciar Sesión
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (<div className={`rounded-md p-4 border ${error.includes('bloqueada') ? 'bg-amber-500/10 border-amber-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
              <p className={`text-sm ${error.includes('bloqueada') ? 'text-amber-500' : 'text-destructive'}`}>{error}</p>
            </div>)}

          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
              Correo electrónico
            </label>
            <div className="mt-2">
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-lg border border-input bg-background py-2.5 px-4 text-foreground shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors" placeholder="tu@email.com"/>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-foreground">
                Contraseña
              </label>
              <link_1.default href="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                ¿Olvidaste tu contraseña?
              </link_1.default>
            </div>
            <div className="mt-2">
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-lg border border-input bg-background py-2.5 px-4 text-foreground shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors" placeholder="••••••••"/>
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-all hover:shadow-[0_4px_20px_rgba(139,92,246,0.4)]">
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          No tienes cuenta?{' '}
          <link_1.default href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Registra tu empresa
          </link_1.default>
        </p>

        {/* Powered by */}
        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-center text-xs text-muted-foreground">
            powered by <span className="font-medium text-foreground/70">Republicode</span>
          </p>
        </div>
      </div>
    </div>);
}
