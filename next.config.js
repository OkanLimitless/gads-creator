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

  // Configure webpack to handle Node.js modules used by google-ads-api
  webpack: (config, { isServer }) => {
    // If it's a client-side bundle, ignore server-only imports
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    return config;
  },
  
  // Disable TypeScript and ESLint errors during builds
  // but keep them in development for better developer experience
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 