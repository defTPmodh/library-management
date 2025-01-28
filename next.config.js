/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
  httpAgentOptions: {
    keepAlive: true,
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    timeoutSeconds: 300, // 5 minutes
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    apiTimeout: 300000, // 5 minutes in milliseconds
  },
}

module.exports = nextConfig 
