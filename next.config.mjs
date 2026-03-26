/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow long-running API routes for SSE streaming
  serverExternalPackages: ["dotenv"],
};

export default nextConfig;
