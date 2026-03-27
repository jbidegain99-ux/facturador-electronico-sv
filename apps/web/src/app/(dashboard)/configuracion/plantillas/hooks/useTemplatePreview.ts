'use client';

import { useState, useEffect, useRef } from 'react';
import type { TemplateConfig } from '../lib/constants';
import { compileTemplate } from '../lib/handlebars-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useTemplatePreview(
  htmlTemplate: string | undefined,
  config: TemplateConfig,
) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!htmlTemplate) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const html = compileTemplate(htmlTemplate, config);
      setPreviewHtml(html);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [htmlTemplate, config]);

  return { previewHtml };
}

export async function downloadPreviewPdf(templateId: string): Promise<void> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/invoice-templates/${templateId}/preview`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al generar preview PDF');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
