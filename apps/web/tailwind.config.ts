import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'flex', 'grid', 'hidden', 'block', 'inline', 'inline-flex', 'inline-block',
    'items-center', 'items-start', 'items-end', 'justify-center', 'justify-between', 'justify-start', 'justify-end',
    'flex-col', 'flex-row', 'flex-wrap', 'flex-1', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8',
    'w-full', 'w-auto', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-64', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-40', 'h-64', 'h-full', 'h-screen',
    'min-h-screen', 'max-w-7xl', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl',
    'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8', 'py-1', 'py-2', 'py-3', 'py-4', 'py-6', 'py-8', 'py-12', 'py-24',
    'm-0', 'm-1', 'm-2', 'm-4', 'mx-auto', 'mt-1', 'mt-2', 'mt-4', 'mt-6', 'mt-8', 'mb-2', 'mb-4', 'mb-6', 'mb-8', 'ml-2', 'ml-4', 'mr-2', 'mr-4',
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl',
    'font-normal', 'font-medium', 'font-semibold', 'font-bold',
    'text-white', 'text-black', 'text-gray-400', 'text-gray-500', 'text-gray-600',
    'text-primary', 'text-secondary', 'text-muted-foreground', 'text-red-400', 'text-red-500', 'text-green-400', 'text-green-500', 'text-yellow-500', 'text-blue-500',
    'bg-white', 'bg-black', 'bg-transparent', 'bg-primary', 'bg-secondary', 'bg-muted', 'bg-card',
    'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-purple-500/20',
    'border', 'border-0', 'border-2', 'border-b', 'border-t', 'border-r', 'border-border', 'border-input', 'border-transparent',
    'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full', 'rounded-t',
    'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl',
    'opacity-50', 'opacity-75', 'opacity-100',
    'transition', 'transition-all', 'transition-colors', 'duration-200', 'duration-300',
    'hover:bg-primary', 'hover:bg-muted', 'hover:text-primary', 'hover:opacity-80', 'hover:scale-105',
    'focus:outline-none', 'focus:ring-2', 'focus:ring-primary',
    'disabled:opacity-50', 'disabled:cursor-not-allowed',
    'cursor-pointer', 'cursor-not-allowed',
    'overflow-hidden', 'overflow-auto', 'overflow-x-auto', 'overflow-y-auto',
    'absolute', 'relative', 'fixed', 'sticky', 'top-0', 'left-0', 'right-0', 'bottom-0', 'inset-0',
    'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
    'transform', 'translate-x-0', '-translate-x-full', 'translate-x-full',
    'space-y-1', 'space-y-2', 'space-y-4', 'space-y-6', 'space-x-2', 'space-x-4',
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4',
    'animate-spin', 'animate-pulse',
    'lg:flex', 'lg:hidden', 'lg:grid', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:pl-64', 'lg:translate-x-0',
    'md:flex', 'md:hidden', 'md:grid', 'md:grid-cols-2', 'md:grid-cols-3',
    'sm:flex', 'sm:hidden',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
