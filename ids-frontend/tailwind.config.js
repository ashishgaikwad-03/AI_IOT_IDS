/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Theme — clean white background with professional accents
        'soc-bg':      '#f5f7fa',   // Light grey-white background
        'soc-surface': '#ffffff',   // Pure white panel surface
        'soc-card':    '#f0f2f5',   // Slightly off-white card background
        'soc-border':  '#e2e8f0',   // Soft grey borders
        'soc-cyan':    '#0284c7',   // Professional blue accent (sky-700)
        'soc-cyan-dim':'#0369a1',   // Deeper blue for secondary elements
        'soc-red':     '#dc2626',   // Clean red for attacks
        'soc-red-dim': '#b91c1c',   // Dark red for alert backgrounds
        'soc-amber':   '#d97706',   // Amber for warnings
        'soc-green':   '#16a34a',   // Green for safe/benign
        'soc-purple':  '#7c3aed',   // Purple for ML/AI elements
        'soc-text':    '#1e293b',   // Dark slate text (near black)
        'soc-muted':   '#64748b',   // Muted grey text
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
          '0%, 100%': { boxShadow: '0 0 5px #dc262644, 0 0 15px #dc262622', backgroundColor: '#fef2f2' },
          '50%':      { boxShadow: '0 0 15px #dc262666, 0 0 30px #dc262633', backgroundColor: '#fee2e2' },
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
          '0%':   { textShadow: '0 0 4px #0284c744' },
          '100%': { textShadow: '0 0 8px #0284c744' },
        },
      },
      boxShadow: {
        'panel':    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'cyan':     '0 0 8px rgba(2, 132, 199, 0.15)',
        'red':      '0 0 8px rgba(220, 38, 38, 0.2)',
        'inner-top':'inset 0 1px 0 rgba(2,132,199,0.08)',
      },
    },
  },
  plugins: [],
}
