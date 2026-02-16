const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://facturador-api-sv-gvavh8heb5c5gkc9.eastus2-01.azurewebsites.net/api/v1'
  }
}
module.exports = withNextIntl(nextConfig)
