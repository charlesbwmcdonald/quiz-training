import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "mculvoqivnqggbbmeqay.supabase.co", pathname: "/storage/v1/object/public/manufacturer-branding/**" }],
  },
};

export default nextConfig;
