/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  experimental: { typedRoutes: false },
  // Keep trailing slashes so rewrites fire. Next normally 308-normalizes
  // /api/foo -> /api/foo/ BEFORE rewrites run, causing an infinite loop
  // with Django's slash-terminated URLs.
  trailingSlash: true,
  // Match /api/* with optional trailing slash and forward to Django.
  // Next 14 strips/normalizes the trailing slash BEFORE rewrites run, so we
  // provide two rules: one for /api/:path (no slash) -> Django /api/:path/
  // and one for /api/:path*/ (with slash)  -> Django /api/:path*/
  // This avoids the 308 ping-pong that the single-pattern version causes.
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    return [
      { source: '/api/:path*/', destination: `${api}/api/:path*/` },
      { source: '/api/:path*',  destination: `${api}/api/:path*`  },
    ];
  },
};
export default nextConfig;
