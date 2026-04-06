import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider } from '@/components/i18n-provider';
import { Providers } from './providers';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';
import { SwUpdatePrompt } from '@/components/pwa/sw-update-prompt';
import './globals.css';
import '@/styles/design-tokens.css';

export const metadata: Metadata = {
  title: {
    default: 'Facturo by Republicode',
    template: '%s | Facturo',
  },
  description: 'Plataforma de facturación electrónica para El Salvador. Emite facturas, créditos fiscales y otros documentos tributarios electrónicos de forma rápida y segura.',
  keywords: ['facturación electrónica', 'El Salvador', 'DTE', 'factura', 'crédito fiscal', 'Hacienda'],
  authors: [{ name: 'Republicode' }],
  creator: 'Republicode',
  publisher: 'Republicode',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Facturo',
  },
  openGraph: {
    type: 'website',
    locale: 'es_SV',
    siteName: 'Facturo by Republicode',
    title: 'Facturo by Republicode',
    description: 'Plataforma de facturación electrónica para El Salvador',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Facturo by Republicode',
    description: 'Plataforma de facturación electrónica para El Salvador',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        <SwUpdatePrompt />
        <ThemeProvider>
          <I18nProvider>
            <Providers>
              <ToastProvider>
                {children}
              </ToastProvider>
            </Providers>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
