import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* Image optimization — allow external image domains for species/products */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.blob.core.windows.net", // Azure Blob Storage
            },
            {
                protocol: "https",
                hostname: "**.amazonaws.com", // AWS S3
            },
        ],
    },

    /* Strict mode for better dev experience */
    reactStrictMode: true,

    /* Powered by header disabled for security */
    poweredByHeader: false,
};

export default nextConfig;
