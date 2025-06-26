import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports for S3 deployment
  output: 'export',
  trailingSlash: true,
  
  // Image optimization settings for static export
  images: {
    unoptimized: true,
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_API_GATEWAY_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
    NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
  },

  // Development settings
  ...(process.env.NODE_ENV === 'development' && {
    output: undefined, // Disable static export in development
  }),
};

export default nextConfig;
