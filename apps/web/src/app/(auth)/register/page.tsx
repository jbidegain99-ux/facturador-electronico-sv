'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Datos de la empresa
    nombre: '',
    nit: '',
    nrc: '',
    actividadEcon: '',
    telefono: '',
    correo: '',
    nombreComercial: '',
    // Direccion
    departamento: '',
    municipio: '',
    complemento: '',
    // Usuario administrador
    adminNombre: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      setError('Las contrasenas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: {
            nombre: formData.nombre,
            nit: formData.nit,
            nrc: formData.nrc,
            actividadEcon: formData.actividadEcon,
            telefono: formData.telefono,
            correo: formData.correo,
            nombreComercial: formData.nombreComercial || null,
            direccion: {
              departamento: formData.departamento,
              municipio: formData.municipio,
              complemento: formData.complemento,
            },
          },
          user: {
            nombre: formData.adminNombre,
            email: formData.adminEmail,
            password: formData.adminPassword,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al registrar');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-center text-green-700">
              Registro exitoso! Redirigiendo al login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Registrar Empresa
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Complete los datos de su empresa para comenzar a facturar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <form className="space-y-6 bg-white p-8 shadow rounded-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Datos de la Empresa */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Datos de la Empresa</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Razon Social *
                </label>
                <input
                  type="text"
                  name="nombre"
                  id="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="nombreComercial" className="block text-sm font-medium text-gray-700">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  name="nombreComercial"
                  id="nombreComercial"
                  value={formData.nombreComercial}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="nit" className="block text-sm font-medium text-gray-700">
                  NIT *
                </label>
                <input
                  type="text"
                  name="nit"
                  id="nit"
                  required
                  placeholder="0000-000000-000-0"
                  value={formData.nit}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="nrc" className="block text-sm font-medium text-gray-700">
                  NRC *
                </label>
                <input
                  type="text"
                  name="nrc"
                  id="nrc"
                  required
                  placeholder="000000-0"
                  value={formData.nrc}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="actividadEcon" className="block text-sm font-medium text-gray-700">
                  Actividad Economica *
                </label>
                <input
                  type="text"
                  name="actividadEcon"
                  id="actividadEcon"
                  required
                  placeholder="Codigo de actividad"
                  value={formData.actividadEcon}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                  Telefono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  id="telefono"
                  required
                  placeholder="0000-0000"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
                  Correo de la Empresa *
                </label>
                <input
                  type="email"
                  name="correo"
                  id="correo"
                  required
                  value={formData.correo}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
          </div>

          {/* Direccion */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Direccion</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="departamento" className="block text-sm font-medium text-gray-700">
                  Departamento *
                </label>
                <input
                  type="text"
                  name="departamento"
                  id="departamento"
                  required
                  value={formData.departamento}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="municipio" className="block text-sm font-medium text-gray-700">
                  Municipio *
                </label>
                <input
                  type="text"
                  name="municipio"
                  id="municipio"
                  required
                  value={formData.municipio}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="complemento" className="block text-sm font-medium text-gray-700">
                  Direccion Completa *
                </label>
                <input
                  type="text"
                  name="complemento"
                  id="complemento"
                  required
                  placeholder="Calle, numero, colonia, etc."
                  value={formData.complemento}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
          </div>

          {/* Usuario Administrador */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Usuario Administrador</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="adminNombre" className="block text-sm font-medium text-gray-700">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="adminNombre"
                  id="adminNombre"
                  required
                  value={formData.adminNombre}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                  Correo Electronico *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  id="adminEmail"
                  required
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                  Contrasena *
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  id="adminPassword"
                  required
                  minLength={8}
                  value={formData.adminPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="adminPasswordConfirm" className="block text-sm font-medium text-gray-700">
                  Confirmar Contrasena *
                </label>
                <input
                  type="password"
                  name="adminPasswordConfirm"
                  id="adminPasswordConfirm"
                  required
                  minLength={8}
                  value={formData.adminPasswordConfirm}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Empresa'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold leading-6 text-primary hover:text-primary/80">
            Iniciar Sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
