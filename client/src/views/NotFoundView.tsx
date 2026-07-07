import { AppHeader } from '../components/AppHeader';

export function NotFoundView() {
  return (
    <div>
      <AppHeader />
      <div className="px-6 py-8">
        <p className="text-body-sm text-[var(--text-secondary)]">Page not found.</p>
      </div>
    </div>
  );
}
