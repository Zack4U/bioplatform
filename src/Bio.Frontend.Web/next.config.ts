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
        unoptimized: true,
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
            {
                protocol: "https",
                hostname: "upload.wikimedia.org", // Wikimedia Commons
            },
            {
                protocol: "http",
                hostname: "upload.wikimedia.org", // Wikimedia Commons
            },
            {
                protocol: "https",
                hostname: "images.mushroomobserver.org", // Mushroom Observer
            },
            {
                protocol: "https",
                hostname: "inaturalist-open-data.s3.amazonaws.com", // iNaturalist
            },
            {
                protocol: "https",
                hostname: "storage.googleapis.com", // Google Cloud Storage
            },
            {
                protocol: "https",
                hostname: "v3.boldsystems.org", // BOLD Systems
            },
            {
                protocol: "https",
                hostname: "www.inaturalist.org", // iNaturalist
            },
            {
                protocol: "https",
                hostname: "images.phylopic.org", // Phylopic
            },
            {
                protocol: "https",
                hostname: "static.inaturalist.org", // iNaturalist
            },
            {
                protocol: "http",
                hostname: "sweetgum.nybg.org", // New York Botanical Garden
            },
            {
                protocol: "https",
                hostname: "natusfera.gbif.es", // GBIF
            },
            {
                protocol: "https",
                hostname: "www.mockupworld.co", // Mock/placeholder images
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
