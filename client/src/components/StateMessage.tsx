import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type StateTone = 'error' | 'neutral';

interface StateMessageProps {
  tone?: StateTone;
  title?: string;
  message: string;
  className?: string;
  actions?: React.ReactNode;
}

const toneClassMap: Record<StateTone, string> = {
  error: 'bg-red-50 text-red-700 border-red-100',
  neutral: 'bg-gray-50 text-gray-600 border-gray-100',
};

export const StateMessage: React.FC<StateMessageProps> = ({
  tone = 'neutral',
  title,
  message,
  className,
  actions,
}) => {
  const Icon = tone === 'error' ? AlertCircle : Info;

  return (
    <div className={cn('rounded-surface border p-4 text-sm', toneClassMap[tone], className)}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          {title ? <p className="font-semibold mb-1">{title}</p> : null}
          <p>{message}</p>
          {actions ? <div className="mt-3">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
};

export default StateMessage;
