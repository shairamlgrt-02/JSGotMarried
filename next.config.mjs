/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // the sandboxed live preview reaches the dev server as https://{port}-{sandbox}.e2b.app
  allowedDevOrigins: ["*.e2b.app"],
};
export default nextConfig;
