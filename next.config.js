/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },

  // GitHub Pages repo name: z-avlod
  basePath: process.env.NODE_ENV === "production" ? "/z-avlod" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/z-avlod/" : "",
};

module.exports = nextConfig;
