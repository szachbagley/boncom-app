import { useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';

export function EstimateDetailView() {
  const { id } = useParams();
  return (
    <div>
      <AppHeader />
      <div className="px-6 py-8">
        <p className="text-body-sm text-[var(--text-secondary)]">
          Estimate detail (id: {id}) — coming soon.
        </p>
      </div>
    </div>
  );
}
