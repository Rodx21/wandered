/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        rust: '#c4501a',
        gold: '#c8a84b',
        olive: '#5a6642',
        cream: '#f5f0e8',
        ink: '#0f0e0c',
        'dark-bg': '#0f0e0c',
        'dark-surface': '#1a1917',
        'dark-border': '#2a2825',
      },
      fontFamily: {
        'playfair': ['PlayfairDisplay_400Regular'],
        'playfair-italic': ['PlayfairDisplay_400Regular_Italic'],
        'playfair-bold': ['PlayfairDisplay_700Bold'],
        'dm': ['DMSans_400Regular'],
        'dm-medium': ['DMSans_500Medium'],
        'dm-bold': ['DMSans_700Bold'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
        'pill': '100px',
      },
    },
  },
  plugins: [],
};
