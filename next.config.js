/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output as a static site for better performance on Vercel
  output: 'standalone',
  
  // Enable strict mode for better development experience
  reactStrictMode: true,
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Add any additional configuration here
};

module.exports = nextConfig; 