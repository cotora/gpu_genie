import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'neu-orange': '#ff9800',
                'neu-bg': '#F0F0F3',
                'neu-light': '#ffffff',
                'neu-dark': '#d9d9d9',
                'neu-text': '#5a5a5a',
            },
            boxShadow: {
                'neu-inset': 'inset 6px 6px 12px #d9d9d9, inset -6px -6px 12px #ffffff',
                'neu-outset': '6px 6px 12px #d9d9d9, -6px -6px 12px #ffffff',
                'neumorphism': '9px 9px 16px #d1d1d1, -9px -9px 16px #ffffff',
                'neumorphism-inset': 'inset 9px 9px 16px #d1d1d1, inset -9px -9px 16px #ffffff',
                'neumorphism-button': '5px 5px 10px #d1d1d1, -5px -5px 10px #ffffff',
                'neumorphism-button-orange': '5px 5px 10px #f0a062, -5px -5px 10px #ffc88a',
                'neumorphism-button-orange-inset': 'inset 5px 5px 10px #d97706, inset -5px -5px 10px #fb923c',
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
}
export default config
