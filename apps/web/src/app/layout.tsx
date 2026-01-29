import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
import '@/styles/design-tokens.css';

export const metadata: Metadata = {
  title: {
    default: 'Facturo by Republicode',
    template: '%s | Facturo',
  },
  description: 'Plataforma de facturacion electronica para El Salvador. Emite facturas, creditos fiscales y otros documentos tributarios electronicos de forma rapida y segura.',
  keywords: ['facturacion electronica', 'El Salvador', 'DTE', 'factura', 'credito fiscal', 'Hacienda'],
  authors: [{ name: 'Republicode' }],
  creator: 'Republicode',
  publisher: 'Republicode',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'es_SV',
    siteName: 'Facturo by Republicode',
    title: 'Facturo by Republicode',
    description: 'Plataforma de facturacion electronica para El Salvador',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Facturo by Republicode',
    description: 'Plataforma de facturacion electronica para El Salvador',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
