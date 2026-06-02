import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'surface',
        'surface-elevated',
        'surface-app',
        'sidebar-bg',
        'sidebar-hover',
        'sidebar-active',
      ],
    },
  },
});

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
