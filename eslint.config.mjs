import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      // Dependencies
      "node_modules/**",
      ".pnp/**",
      ".pnp.js",
      // Testing
      "coverage/**",
      // Next.js
      ".next/**",
      "out/**",
      "build/**",
      // Production
      "dist/**",
      // Misc
      ".DS_Store",
      "*.pem",
      // Debug
      "npm-debug.log*",
      "yarn-debug.log*",
      "yarn-error.log*",
      ".pnpm-debug.log*",
      // Local env files
      ".env*.local",
      // Vercel
      ".vercel/**",
      // TypeScript
      "*.tsbuildinfo",
      "next-env.d.ts",
      // Cursor IDE
      ".cursor/**",
    ],
  },
];

export default eslintConfig;
