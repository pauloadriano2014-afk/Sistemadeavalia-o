import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        // AQUI ESTÁ A MÁGICA:
        // O Tailwind agora entende 'bg-brand', 'text-brand', 'border-brand'
        // E ele aplica a cor que estiver na variável --brand-rgb (Verde ou Roxo)
        brand: "rgb(var(--brand-rgb) / <alpha-value>)", 
      },
    },
  },
  plugins: [],
};
export default config;