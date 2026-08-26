import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // This react-hooks v6 rule flags the standard "fetch/read on mount"
      // effect pattern used throughout the app (including hydration-safe
      // localStorage restores) as an error. Kept as a warning rather than
      // silenced so it stays visible for gradual cleanup.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
