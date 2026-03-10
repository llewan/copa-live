import React from 'react';
import { cn } from '@/lib/utils';

type SurfaceCardVariant = 'default' | 'elevated' | 'muted';

type SurfaceCardProps<T extends React.ElementType> = {
  as?: T;
  variant?: SurfaceCardVariant;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className'>;

const variantClassMap: Record<SurfaceCardVariant, string> = {
  default: 'bg-white border border-gray-200/80 rounded-surface shadow-card',
  elevated: 'bg-white border border-gray-100 rounded-surface shadow-card-lg',
  muted: 'bg-gray-50 border border-gray-100 rounded-surface shadow-card',
};

export const SurfaceCard = <T extends React.ElementType = 'div'>({
  as,
  className,
  variant = 'default',
  ...props
}: SurfaceCardProps<T>) => {
  const Component = as || 'div';
  return <Component className={cn(variantClassMap[variant], className)} {...props} />;
};

export default SurfaceCard;
