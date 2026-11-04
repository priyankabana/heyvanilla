import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass-card card-hover p-5', className)} {...props} />;
}
