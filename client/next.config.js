/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
    // No server-side image optimization on Cloudflare Pages edge runtime
    unoptimized: true,
  },
};

module.exports = nextConfig;
