'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DTE {
  id: string;
  tipoDte: string;
  numeroControl: string;
  estado: string;
  totalPagar: number;
  createdAt: string;
  cliente?: {
    nombre: string;
  };
}

export default function FacturasPage() {
  const [dtes, setDtes] = useState<DTE[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDtes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setDtes(data.data || []);
      } catch (error) {
        console.error('Error fetching DTEs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDtes();
  }, []);

  const getTipoDteLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      '01': 'Factura',
      '03': 'CCF',
      '05': 'Nota Credito',
      '06': 'Nota Debito',
    };
    return tipos[tipo] || tipo;
  };

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      FIRMADO: 'bg-blue-100 text-blue-800',
      ENVIADO: 'bg-purple-100 text-purple-800',
      PROCESADO: 'bg-green-100 text-green-800',
      RECHAZADO: 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Facturas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de todos los documentos tributarios electronicos
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/facturas/nueva"
            className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            Nueva Factura
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Numero Control
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tipo
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Cliente
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Estado
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {dtes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                        No hay facturas registradas
                      </td>
                    </tr>
                  ) : (
                    dtes.map((dte) => (
                      <tr key={dte.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {dte.numeroControl}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getTipoDteLabel(dte.tipoDte)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {dte.cliente?.nombre || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${Number(dte.totalPagar).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getEstadoBadge(dte.estado)}`}
                          >
                            {dte.estado}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(dte.createdAt).toLocaleDateString('es-SV')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
