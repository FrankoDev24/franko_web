import withMT from "@material-tailwind/react/utils/withMT";
import scrollbarHide from "tailwind-scrollbar-hide"; // 👈 import the plugin

export default withMT({
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui'],
      },
    },

  },
  plugins: [
    scrollbarHide, // 👈 use the imported plugin
  ],
});
