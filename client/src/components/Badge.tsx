import type { EstimateStatus } from '../api/types';

/**
 * Badge — flat, sharp, uppercase status chip. Values match the Claude Design bundle's
 * Badge (components/feedback/Badge.jsx), restricted to the two statuses this app has.
 */

const STATUS_CLASSES: Record<EstimateStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  sent: 'bg-transparent text-cyan border-cyan',
};

const STATUS_LABEL: Record<EstimateStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
};

export interface BadgeProps {
  status: EstimateStatus;
  className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-[22px] items-center whitespace-nowrap border px-[9px] font-sans text-[11px] font-bold uppercase leading-none tracking-[1.4px] rounded-none ${STATUS_CLASSES[status]} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
