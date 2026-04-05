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
        canvas: "#07110A",
        surface: "#142113",
        primary: "#F5F7F2",
        secondary: "#A9B8A8",
        border: "#243723",
        foreground: "#F5F7F2",
        icon: "#F5F7F2",
        "muted-foreground": "#7C8B7C",
        ring: "#EC5B13",
        brand: {
          DEFAULT: "#EC5B13",
          dark: "#C94709",
          soft: "#F28B55",
        },
        protein: "#4ADE80",
        carbs: "#60A5FA",
        fat: "#FBBF24",
        forest: {
          bg: "#07110A",
          panel: "#142113",
          panelAlt: "#1B2D18",
          line: "#2A4128",
          bright: "#5DE619",
          accent: "#A7F3D0",
          mist: "#D8E4D7",
          shadow: "#0B160C",
        },
        accent: {
          green: "#5DE619",
          blue: "#60A5FA",
          amber: "#FBBF24",
          red: "#FB7185",
        },
        muted: "#70806E",
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
