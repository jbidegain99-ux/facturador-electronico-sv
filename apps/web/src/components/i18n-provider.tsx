'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { useAppStore } from '@/store';
import { defaultLocale, type Locale } from '@/i18n/config';

import esMessages from '../../messages/es.json';
import enMessages from '../../messages/en.json';

const messagesMap: Record<Locale, typeof esMessages> = {
  es: esMessages,
  en: enMessages,
};

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const locale = useAppStore((s) => s.locale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before hydration, use default locale to match server render
  const activeLocale = mounted ? locale : defaultLocale;
  const messages = messagesMap[activeLocale];

  useEffect(() => {
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  return (
    <NextIntlClientProvider locale={activeLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
