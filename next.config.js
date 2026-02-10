/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === "production" ? "/z-avlod" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/z-avlod/" : "",
};

module.exports = nextConfig;
