'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { TemplateConfig } from '../lib/constants';
import { DEFAULT_TEMPLATE_CONFIG } from '../lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export function useTemplateConfig(templateId: string, initialConfig?: TemplateConfig) {
  const [config, setConfig] = useState<TemplateConfig>(initialConfig ?? DEFAULT_TEMPLATE_CONFIG);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // Auto-save with debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/invoice-templates/${templateId}/config`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(config),
        });
        if (!res.ok) throw new Error('Error al guardar');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config, templateId]);

  const updateColor = useCallback((key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  }, []);

  const updateFont = useCallback((key: 'heading' | 'body', value: string) => {
    setConfig((prev) => ({
      ...prev,
      fonts: { ...prev.fonts, [key]: value },
    }));
  }, []);

  const toggleSection = useCallback((key: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: {
          ...prev.sections[key],
          visible: !prev.sections[key]?.visible,
        },
      },
    }));
  }, []);

  const updateLogoPosition = useCallback((position: 'left' | 'center' | 'right') => {
    setConfig((prev) => ({
      ...prev,
      logo: { ...prev.logo, position },
    }));
  }, []);

  const resetColors = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      colors: { ...DEFAULT_TEMPLATE_CONFIG.colors },
    }));
  }, []);

  const reorderSections = useCallback((sections: Record<string, { visible: boolean; order: number }>) => {
    setConfig((prev) => ({
      ...prev,
      sections,
    }));
  }, []);

  const updatePageSettings = useCallback((pageSettings: Partial<TemplateConfig['pageSettings']>) => {
    setConfig((prev) => ({
      ...prev,
      pageSettings: { ...prev.pageSettings, ...pageSettings },
    }));
  }, []);

  const updateConfig = useCallback((partial: Partial<TemplateConfig>) => {
    setConfig((prev) => deepMerge(prev as unknown as Record<string, unknown>, partial as unknown as Record<string, unknown>) as unknown as TemplateConfig);
  }, []);

  return {
    config,
    saveStatus,
    updateColor,
    updateFont,
    toggleSection,
    updateLogoPosition,
    resetColors,
    reorderSections,
    updatePageSettings,
    updateConfig,
  };
}
