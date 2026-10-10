import path from "node:path";
import { fileURLToPath } from "node:url";
const directory = path.dirname(fileURLToPath(import.meta.url));
/** @type {import('next').NextConfig} */
const config = {
  outputFileTracingRoot: path.resolve(directory, "../.."),
  webpack(config) {
    // Shared packages use NodeNext .js specifiers backed by TypeScript source.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".js", ".ts", ".tsx"],
    };
    return config;
  },
};
export default config;
