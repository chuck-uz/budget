import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // googleapis — тяжёлый Node-пакет; не бандлить, брать из node_modules в рантайме.
  serverExternalPackages: ["googleapis", "google-auth-library", "gaxios"],
};

export default nextConfig;
