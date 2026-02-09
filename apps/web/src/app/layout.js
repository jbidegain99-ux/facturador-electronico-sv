"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewport = exports.metadata = void 0;
exports.default = RootLayout;
const toast_1 = require("@/components/ui/toast");
const theme_provider_1 = require("@/components/theme-provider");
require("./globals.css");
require("@/styles/design-tokens.css");
exports.metadata = {
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
exports.viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
    ],
    width: 'device-width',
    initialScale: 1,
};
function RootLayout({ children, }) {
    return (<html lang="es" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <theme_provider_1.ThemeProvider>
          <toast_1.ToastProvider>{children}</toast_1.ToastProvider>
        </theme_provider_1.ThemeProvider>
      </body>
    </html>);
}
