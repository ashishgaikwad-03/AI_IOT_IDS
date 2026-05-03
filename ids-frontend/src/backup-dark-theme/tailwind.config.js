/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SOC Dark Theme — custom color palette
        'soc-bg':      '#080d14',   // Near-black background
        'soc-surface': '#0f1923',   // Panel surface
        'soc-card':    '#131f2e',   // Card background
        'soc-border':  '#1e3a52',   // Panel borders
        'soc-cyan':    '#00d4ff',   // Primary accent / benign
        'soc-cyan-dim':'#0099bb',   // Dimmed cyan for secondary elements
        'soc-red':     '#ff3b3b',   // Alert / attack
        'soc-red-dim': '#cc2222',   // Dark red background for alerts
        'soc-amber':   '#f59e0b',   // Warning / medium severity
        'soc-green':   '#22d3a5',   // Safe / online
        'soc-purple':  '#a855f7',   // Accent for ML/AI elements
        'soc-text':    '#c9d8e8',   // Primary text
        'soc-muted':   '#4d6b8a',   // Muted / secondary text
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-red':   'pulseRed 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-cyan':  'pulseCyan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line':   'scanLine 3s linear infinite',
        'fade-in':     'fadeIn 0.3s ease-in-out',
        'glow':        'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 5px #ff3b3b, 0 0 20px #ff3b3b', backgroundColor: '#2d0f0f' },
          '50%':      { boxShadow: '0 0 20px #ff3b3b, 0 0 60px #ff3b3b', backgroundColor: '#4d1515' },
        },
        pulseCyan: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%':   { textShadow: '0 0 4px #00d4ff' },
          '100%': { textShadow: '0 0 12px #00d4ff, 0 0 24px #00d4ff' },
        },
      },
      boxShadow: {
        'panel':    '0 0 0 1px #1e3a52, 0 4px 24px rgba(0,0,0,0.4)',
        'cyan':     '0 0 16px rgba(0, 212, 255, 0.35)',
        'red':      '0 0 16px rgba(255, 59, 59, 0.5)',
        'inner-top':'inset 0 1px 0 rgba(0,212,255,0.15)',
      },
    },
  },
  plugins: [],
}
