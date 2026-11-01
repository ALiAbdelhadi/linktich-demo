import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'cyan' | 'gold' | 'success' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variantStyles = {
    default:
      'bg-[#4A00E0]/20 text-indigo-300 border border-[#4A00E0]/40',
    cyan:
      'bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/35 shadow-2xs',
    gold:
      'bg-amber-400/15 text-amber-300 border border-amber-400/40 glow-gold font-bold',
    success:
      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    destructive:
      'bg-red-500/15 text-red-400 border border-red-500/30',
    outline:
      'text-slate-300 border border-white/15 bg-white/5',
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)} {...props} />
  );
}

export { Badge };
