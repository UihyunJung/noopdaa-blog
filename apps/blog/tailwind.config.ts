import type { Config } from "tailwindcss";
import sharedConfig from "@noopdaa/config/tailwind";
import typography from "@tailwindcss/typography";

const config: Config = {
  ...sharedConfig,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [typography],
};

export default config;
