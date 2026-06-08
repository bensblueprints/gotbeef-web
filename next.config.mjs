/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Netlify/serverless: bundle Prisma query engines (rhel-openssl-3.0.x) into lambdas.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
    "/api/**/*": ["./node_modules/.prisma/client/**/*"]
  },
  experimental: { serverActions: { bodySizeLimit: '2mb' } }
};
export default nextConfig;
