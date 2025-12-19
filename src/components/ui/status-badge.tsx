import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

type StatusType = 'success' | 'pending' | 'warning' | 'loading' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    className: 'bg-accent/10 text-accent border-accent/20',
  },
  pending: {
    icon: Clock,
    className: 'bg-muted text-muted-foreground border-border',
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  loading: {
    icon: Loader2,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'loading' && 'animate-spin')} />
      <span>{label}</span>
    </div>
  );
}
