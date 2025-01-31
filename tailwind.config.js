import daisyui from 'daisyui';
import typography from '@tailwindcss/typography';
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: 'class',
  //darkMode: ['selector','[data-theme="dark"]'],
  theme: {
    extend: {}
  },
  daisyui: {
    themes: ["light", "dark", "forest"]

  },
  plugins: [daisyui, typography]
};
