import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../Badge.js';
import { IconButton } from '../IconButton.js';
import type { EstimateSummary } from '../../api/types.js';

export interface EstimateCardProps {
  estimate: EstimateSummary;
  onDelete: (estimate: EstimateSummary) => void;
}

const MENU_ITEM_CLASSES =
  'flex cursor-pointer items-center gap-[10px] px-[14px] py-[11px] font-sans text-[14px] outline-none';

export function EstimateCard({ estimate, onDelete }: EstimateCardProps) {
  const navigate = useNavigate();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/estimates/${estimate.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          navigate(`/estimates/${estimate.id}`);
        }
      }}
      className="relative flex min-h-[132px] cursor-pointer flex-col justify-between border border-[var(--border-hairline)] bg-white p-[22px] transition-colors duration-150 ease-[var(--ease-standard)] hover:border-[var(--border-strong)]"
    >
      <div className="flex items-start justify-between gap-[10px]">
        <div className="text-[17px] font-semibold leading-[1.3] text-navy">{estimate.projectName}</div>
        <div className="-mr-2 -mt-[6px] flex-shrink-0" onClick={(event) => event.stopPropagation()}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <IconButton label="Estimate actions" variant="ghost" size="sm">
                <MoreHorizontal size={18} strokeWidth={1.75} className="text-[var(--text-secondary)]" />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-30 min-w-[178px] border border-[var(--border-strong)] border-t-[3px] border-t-cyan bg-white"
              >
                <DropdownMenu.Item
                  onSelect={() => navigate(`/estimates/${estimate.id}`)}
                  className={`${MENU_ITEM_CLASSES} border-b border-[var(--border-hairline)] text-[var(--text-primary)] data-[highlighted]:bg-[var(--surface-subtle)]`}
                >
                  <Eye size={15} strokeWidth={1.75} className="text-[var(--text-secondary)]" /> View estimate
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => navigate(`/estimates/${estimate.id}/edit`)}
                  className={`${MENU_ITEM_CLASSES} border-b border-[var(--border-hairline)] text-[var(--text-primary)] data-[highlighted]:bg-[var(--surface-subtle)]`}
                >
                  <Pencil size={15} strokeWidth={1.75} className="text-[var(--text-secondary)]" /> Edit estimate
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => onDelete(estimate)}
                  className={`${MENU_ITEM_CLASSES} text-[var(--color-danger)] data-[highlighted]:bg-[var(--color-danger-bg)]`}
                >
                  <Trash2 size={15} strokeWidth={1.75} /> Delete estimate
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      <div className="mt-[20px]">
        <Badge status={estimate.status} />
      </div>
    </div>
  );
}
