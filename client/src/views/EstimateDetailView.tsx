import { useParams } from 'react-router-dom';

export function EstimateDetailView() {
  const { id } = useParams();
  return (
    <div className="px-6 py-8">
      <p className="text-body-sm text-[var(--text-secondary)]">
        Estimate detail (id: {id}) — coming soon.
      </p>
    </div>
  );
}
