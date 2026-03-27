'use client';

import { useState, useCallback } from 'react';
import type { InvoiceTemplate } from '../lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export function useTemplates() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/invoice-templates`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al cargar plantillas');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const cloneTemplate = useCallback(async (sourceTemplateId: string, name?: string): Promise<InvoiceTemplate | null> => {
    try {
      const res = await fetch(`${API_URL}/invoice-templates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sourceTemplateId, name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al clonar plantilla');
      }
      const newTemplate = await res.json();
      await fetchTemplates();
      return newTemplate;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al clonar');
      return null;
    }
  }, [fetchTemplates]);

  const setDefault = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/invoice-templates/${id}/default`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al cambiar plantilla predeterminada');
      }
      await fetchTemplates();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/invoice-templates/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al eliminar plantilla');
      }
      await fetchTemplates();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    }
  }, [fetchTemplates]);

  return { templates, loading, error, fetchTemplates, cloneTemplate, setDefault, deleteTemplate };
}
