import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer';

    const variantStyles = {
      primary:
        'bg-[#4A00E0] hover:bg-[#5E17EB] text-white shadow-indigo hover:shadow-indigo/80 border border-indigo-400/20',
      secondary:
        'bg-[#00D4FF] hover:bg-[#38BDF8] text-[#0A0A0F] font-bold shadow-cyan hover:shadow-cyan/80',
      gold:
        'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold shadow-gold border border-yellow-300/30',
      outline:
        'border border-white/15 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md hover:border-white/25',
      ghost:
        'hover:bg-white/10 text-slate-300 hover:text-white',
      destructive:
        'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    };

    const sizeStyles = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-lg px-3 text-xs',
      lg: 'h-12 rounded-xl px-6 text-base font-bold',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
