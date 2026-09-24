import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// Local development runs from apps/web, while the shared service settings live
// at the repository root. Deployed containers keep using their injected env.
const repositoryEnv = path.resolve(process.cwd(), "..", "..", ".env");
if (fs.existsSync(repositoryEnv)) process.loadEnvFile(repositoryEnv);

const nextConfig: NextConfig = {
  output: "standalone",
  agentRules: false,
};

export default nextConfig;
