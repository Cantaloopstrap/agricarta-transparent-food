/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'agri-amber': '#FFBF00',
        'agri-cream': '#FFF78D',
        'agri-forest': '#467235',
        'agri-dark': '#283F24',
      },
      boxShadow: {
        'brutal-base': '8px 8px 0 0 #283F24',
        'brutal-hover': '10px 10px 0 0 #283F24',
        'brutal-sm': '4px 4px 0 0 #000000',
        'brutal-card': '6px 6px 0 0 #283F24',
        'brutal-modal': '12px 12px 0 0 #FFBF00',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '4': '4px',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
}
