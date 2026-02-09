'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminSetupPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
function AdminSetupPage() {
    const router = (0, navigation_1.useRouter)();
    const [canBootstrap, setCanBootstrap] = (0, react_1.useState)(null);
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [nombre, setNombre] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)('');
    const [success, setSuccess] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [checking, setChecking] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        checkBootstrapStatus();
    }, []);
    const checkBootstrapStatus = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/bootstrap/status`);
            const data = await res.json();
            setCanBootstrap(data.canBootstrap);
        }
        catch (err) {
            setError('Error al verificar estado del sistema');
        }
        finally {
            setChecking(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/bootstrap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nombre }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al crear administrador');
            }
            setSuccess('Super Administrador creado exitosamente. Redirigiendo al login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear administrador');
        }
        finally {
            setLoading(false);
        }
    };
    if (checking) {
        return (<div className="flex min-h-screen flex-col justify-center items-center px-6 py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
        <p className="mt-4 text-gray-600">Verificando estado del sistema...</p>
      </div>);
    }
    if (canBootstrap === false) {
        return (<div className="flex min-h-screen flex-col justify-center items-center px-6 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <lucide_react_1.CheckCircle className="w-8 h-8 text-green-600"/>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema ya configurado</h2>
          <p className="text-gray-600 mb-6">
            Ya existe un Super Administrador. Para crear mas administradores, ingresa al panel de administracion.
          </p>
          <link_1.default href="/login" className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
            Ir al Login
          </link_1.default>
        </div>
      </div>);
    }
    return (<div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <lucide_react_1.Shield className="w-8 h-8 text-blue-600"/>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Configuracion Inicial
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Crea el primer Super Administrador del sistema
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (<div className="rounded-md bg-red-50 p-4 flex items-start gap-3">
                <lucide_react_1.AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>
                <p className="text-sm text-red-700">{error}</p>
              </div>)}

            {success && (<div className="rounded-md bg-green-50 p-4 flex items-start gap-3">
                <lucide_react_1.CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"/>
                <p className="text-sm text-green-700">{success}</p>
              </div>)}

            <div>
              <label htmlFor="nombre" className="block text-sm font-medium leading-6 text-gray-900">
                Nombre completo
              </label>
              <div className="mt-2">
                <input id="nombre" name="nombre" type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3" placeholder="Juan Perez"/>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Correo electronico
              </label>
              <div className="mt-2">
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3" placeholder="admin@empresa.com"/>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Contrasena
              </label>
              <div className="mt-2">
                <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3" placeholder="Minimo 8 caracteres"/>
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading || !!success} className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">
                {loading ? 'Creando...' : 'Crear Super Administrador'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Este formulario solo funciona una vez. Despues de crear el primer administrador, deberas usar el panel de administracion.
        </p>
      </div>
    </div>);
}
