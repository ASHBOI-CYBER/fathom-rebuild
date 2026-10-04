import type { NextConfig } from 'next';

// Static export for GitHub Pages. BASE_PATH is set by the deploy workflow to
// the repository name (e.g. /fathom-rebuild); it's empty locally.
const basePath = process.env.BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  devIndicators: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
