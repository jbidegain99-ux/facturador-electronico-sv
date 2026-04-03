const withSerwist = require('@serwist/next').default({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.core.windows.net',
      },
    ],
  },
};

module.exports = withSerwist(withNextIntl(nextConfig));
