/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Support serverless or standalone as needed
  output: undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
