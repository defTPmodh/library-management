/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      appDir: true,
      serverActions: {
        bodySizeLimit: '10mb',
      },
    },
    webpack: (config, { isServer }) => {
      // Add any webpack configurations if needed
      return config;
    },
    api: {
      responseLimit: false,
      bodyParser: {
        sizeLimit: '10mb',
      },
    },
  }
  
  module.exports = nextConfig 