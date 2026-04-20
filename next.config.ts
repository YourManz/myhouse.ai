import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/myhouse.ai',
  images: { unoptimized: true },
  turbopack: {},
}

export default nextConfig
