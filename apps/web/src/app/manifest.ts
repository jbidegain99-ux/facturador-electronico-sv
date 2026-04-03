import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Facturo by Republicode',
    short_name: 'Facturo',
    description: 'Facturación electrónica para El Salvador — crea facturas desde tu celular, incluso sin internet.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#7C3AED',
    orientation: 'portrait-primary',
    categories: ['business', 'finance'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Nueva Factura',
        short_name: 'Facturar',
        url: '/es/facturas/nueva',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
