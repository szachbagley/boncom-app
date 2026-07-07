import { useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';

export function EstimateFormView() {
  const { id } = useParams();
  return (
    <div>
      <AppHeader />
      <div className="px-6 py-8">
        <p className="text-body-sm text-[var(--text-secondary)]">
          {id ? `Edit estimate ${id}` : 'Create estimate'} — coming soon.
        </p>
      </div>
    </div>
  );
}
