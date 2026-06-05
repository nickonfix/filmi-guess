/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
    // Images are loaded directly by the browser (unoptimized), so no server-side proxy needed
  },
};

module.exports = nextConfig;
