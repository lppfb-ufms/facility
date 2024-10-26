import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "InterVariable",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      // @ts-ignore
      typography: ({ theme }) => ({
        facility: {
          css: {
            "--tw-prose-body": theme("colors.neutral[900]"),
            "--tw-prose-headings": theme("colors.cyan[600]"),
            "--tw-prose-lead": theme("colors.neutral[800]"),
            "--tw-prose-links": theme("colors.cyan[600]"),
            "--tw-prose-bold": theme("colors.neutral[900]"),
            "--tw-prose-counters": theme("colors.neutral[700]"),
            "--tw-prose-bullets": theme("colors.cyan[600]"),
            "--tw-prose-hr": theme("colors.neutral[400]"),
            "--tw-prose-quotes": theme("colors.neutral[700]"),
            "--tw-prose-quote-borders": theme("colors.cyan[700]"),
            "--tw-prose-captions": theme("colors.neutral[700]"),
            "--tw-prose-kbd": theme("colors.neutral[900]"),
            "--tw-prose-kbd-shadows": theme("hexToRgb(colors.neutral[900])"),
            "--tw-prose-code": theme("colors.neutral[800]"),
            "--tw-prose-pre-code": theme("colors.neutral[200]"),
            "--tw-prose-pre-bg": theme("colors.neutral[700]"),
            "--tw-prose-th-borders": theme("colors.neutral[500]"),
            "--tw-prose-td-borders": theme("colors.neutral[400]"),
            "--tw-prose-invert-body": theme("colors.neutral[100]"),
            "--tw-prose-invert-headings": theme("colors.white"),
            "--tw-prose-invert-lead": theme("colors.neutral[200]"),
            "--tw-prose-invert-links": theme("colors.white"),
            "--tw-prose-invert-bold": theme("colors.white"),
            "--tw-prose-invert-counters": theme("colors.neutral[200]"),
            "--tw-prose-invert-bullets": theme("colors.neutral[400]"),
            "--tw-prose-invert-hr": theme("colors.neutral[500]"),
            "--tw-prose-invert-quotes": theme("colors.neutral[100]"),
            "--tw-prose-invert-quote-borders": theme("colors.neutral[500]"),
            "--tw-prose-invert-captions": theme("colors.neutral[200]"),
            "--tw-prose-invert-kbd": theme("colors.white"),
            "--tw-prose-invert-kbd-shadows": theme("hexToRgb(colors.white)"),
            "--tw-prose-invert-code": theme("colors.white"),
            "--tw-prose-invert-pre-code": theme("colors.neutral[100]"),
            "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)",
            "--tw-prose-invert-th-borders": theme("colors.neutral[400]"),
            "--tw-prose-invert-td-borders": theme("colors.neutral[500]"),
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
} satisfies Config;
