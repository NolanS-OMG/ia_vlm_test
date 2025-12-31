/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb'
    }
  },
  // Asegurar que las rutas con Server Actions usen Node.js runtime
  serverRuntimeConfig: {},
  publicRuntimeConfig: {}
};

export default nextConfig;
