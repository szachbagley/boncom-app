import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { IconButton } from '../IconButton.js';
import { EstimateCard } from './EstimateCard.js';
import type { DashboardGroup } from '../../utils/dashboardGrouping.js';
import type { EstimateSummary } from '../../api/types.js';

export interface ClientGroupProps {
  group: DashboardGroup;
  onDeleteEstimate: (estimate: EstimateSummary) => void;
}

export function ClientGroup({ group, onDeleteEstimate }: ClientGroupProps) {
  const navigate = useNavigate();
  return (
    <section className="mb-[44px]">
      <div className="mb-[18px] flex items-center gap-3">
        <h2 className="m-0 text-[21px] font-bold tracking-[-0.3px] text-navy">{group.clientName}</h2>
        <IconButton
          label={`Add estimate for ${group.clientName}`}
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/estimates/new?clientId=${group.clientId}`)}
        >
          <Plus size={16} strokeWidth={1.75} />
        </IconButton>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(258px,1fr))] gap-4">
        {group.estimates.map((estimate) => (
          <EstimateCard key={estimate.id} estimate={estimate} onDelete={onDeleteEstimate} />
        ))}
      </div>
    </section>
  );
}
