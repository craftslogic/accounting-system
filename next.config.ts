import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow Supabase storage images if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
