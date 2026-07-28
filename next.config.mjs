/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Non possiamo usare "headers()" con output="export"
  // ma non ci servono più perché useremo la compressione nativa!
};

export default nextConfig;
