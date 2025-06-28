import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment settings
  output: undefined, // Use default output for Vercel
  trailingSlash: false,
  
  // Image optimization (Vercel supports this natively)
  images: {
    domains: ['d7g820aejy2tq.cloudfront.net'], // CloudFront domain for backward compatibility
    formats: ['image/avif', 'image/webp'],
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_API_GATEWAY_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
    NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
  },

  // Vercel-specific optimizations
  serverExternalPackages: ['aws-amplify'],
};

export default nextConfig;
