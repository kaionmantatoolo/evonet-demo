import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  experimental: {
    useWasmBinary: true,
  },
  env: {
    NEXT_PUBLIC_EVONET_DROPIN_VERSION:
      process.env.NEXT_PUBLIC_EVONET_DROPIN_VERSION?.trim() || "1.2.0",
  },
};

export default nextConfig;

