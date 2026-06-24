/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-f8ab8.up.railway.app',
  },
}

module.exports = nextConfig
