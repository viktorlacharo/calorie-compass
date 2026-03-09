/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAF9",
        surface: "#FFFFFF",
        primary: "#0C0A09",
        secondary: "#78716C",
        border: "#E7E5E4",
        accent: {
          green: "#16A34A",
          blue: "#2563EB",
          amber: "#D97706",
          red: "#DC2626",
        },
        muted: "#A8A29E",
      },
      fontFamily: {
        mono: ["JetBrainsMono_400Regular"],
        "mono-medium": ["JetBrainsMono_500Medium"],
        "mono-bold": ["JetBrainsMono_700Bold"],
        sans: ["DMSans_400Regular"],
        "sans-medium": ["DMSans_500Medium"],
        "sans-bold": ["DMSans_700Bold"],
      },
    },
  },
  plugins: [],
};
