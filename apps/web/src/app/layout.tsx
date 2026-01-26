import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

// Use system fonts to avoid network dependency during build
const fontClassName = 'font-sans';

export const metadata: Metadata = {
  title: 'Facturador Electronico SV',
  description: 'Sistema de Facturacion Electronica para El Salvador',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={fontClassName}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
