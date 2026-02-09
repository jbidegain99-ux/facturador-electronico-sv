'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminsPage;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
function AdminsPage() {
    const [admins, setAdmins] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    const [showModal, setShowModal] = (0, react_1.useState)(false);
    const [formData, setFormData] = (0, react_1.useState)({ email: '', password: '', nombre: '' });
    const [saving, setSaving] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        fetchAdmins();
    }, []);
    const fetchAdmins = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/admins`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error('Error al cargar administradores');
            const data = await res.json();
            setAdmins(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/admins`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (!res.ok)
                throw new Error('Error al crear administrador');
            setShowModal(false);
            setFormData({ email: '', password: '', nombre: '' });
            fetchAdmins();
        }
        catch (err) {
            alert('Error al crear administrador');
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Super Administradores</h1>
          <p className="text-muted-foreground mt-1">Gestiona los administradores del sistema</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <lucide_react_1.Plus className="w-4 h-4"/>
          Nuevo Admin
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (<div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
          </div>) : error ? (<div className="flex flex-col items-center justify-center h-64">
            <lucide_react_1.AlertCircle className="w-12 h-12 text-red-500 mb-4"/>
            <p className="text-red-400">{error}</p>
          </div>) : (<table className="table-rc">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (<tr key={admin.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-medium">
                        {admin.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{admin.nombre}</span>
                    </div>
                  </td>
                  <td>{admin.email}</td>
                  <td className="text-muted-foreground">
                    {new Date(admin.createdAt).toLocaleDateString('es')}
                  </td>
                </tr>))}
              {admins.length === 0 && (<tr>
                  <td colSpan={3} className="text-center py-12 text-muted-foreground">
                    No hay administradores
                  </td>
                </tr>)}
            </tbody>
          </table>)}
      </div>

      {/* Modal */}
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}/>
          <div className="relative glass-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Nuevo Super Administrador</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Nombre</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required className="input-rc"/>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="input-rc"/>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Contrasena</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} className="input-rc"/>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Creando...' : 'Crear Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
