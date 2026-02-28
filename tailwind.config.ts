import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            /* ── Couleurs Floupet ──────────────────────── */
            colors: {
                cream: "#FDF8F2",
                "warm-white": "#FFFCF8",
                sand: { DEFAULT: "#F5EDE0", dark: "#E8D9C4" },
                coral: { light: "#FFE8E2", DEFAULT: "#FF6B4A", dark: "#E5522F" },
                teal: { light: "#CCFBF1", DEFAULT: "#2DD4BF", dark: "#0F9488" },
                plum: { light: "#EDE9FE", DEFAULT: "#6C3FC5", dark: "#4C2A9A" },
                ink: { DEFAULT: "#1A1208", soft: "#3D2E1A" },
                gray: { light: "#C4B9AE", DEFAULT: "#8A7E72" },
                success: "#22C55E",
                warning: "#F59E0B",
            },

            /* ── Typographie ───────────────────────────── */
            fontFamily: {
                display: ["var(--font-fraunces)", "Georgia", "serif"],
                body: ["var(--font-nunito)", "sans-serif"],
            },

            /* ── Border Radius ─────────────────────────── */
            borderRadius: {
                sm: "8px",
                md: "16px",
                lg: "24px",
                xl: "40px",
                full: "999px",
            },

            /* ── Box Shadows ───────────────────────────── */
            boxShadow: {
                sm: "0 2px 8px rgba(26, 18, 8, 0.08)",
                md: "0 8px 24px rgba(26, 18, 8, 0.12)",
                coral: "0 8px 30px rgba(255, 107, 74, 0.35)",
                teal: "0 8px 30px rgba(45, 212, 191, 0.30)",
                plum: "0 8px 30px rgba(108, 63, 197, 0.30)",
            },
        },
    },
    plugins: [],
};

export default config;
