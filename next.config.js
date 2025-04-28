/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Configure redirects if needed
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  
  // Configure domain patterns for external images (needed for Google user images)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig; 