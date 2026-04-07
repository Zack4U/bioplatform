import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* Prevent Turbopack from failing to resolve CSS-only packages
       that are handled by the @tailwindcss/postcss plugin */
    turbopack: {
        resolveAlias: {
            tailwindcss: require.resolve("tailwindcss"),
        },
    },

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
            {
                protocol: "https",
                hostname: "images.unsplash.com", // Mock/placeholder images
            },
            {
                protocol: "https",
                hostname: "res.cloudinary.com", // Cloudinary CDN
            },
        ],
    },

    /* Strict mode for better dev experience */
    reactStrictMode: true,

    /* Powered by header disabled for security */
    poweredByHeader: false,

    /* Environment variables exposed to the browser */
    env: {
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
            process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    },
};

export default nextConfig;
