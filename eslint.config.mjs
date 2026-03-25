// eslint.config.mjs
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  // Next.js recommended rules (includes React, JSX, etc.)
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];