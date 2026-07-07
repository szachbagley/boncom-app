import { Route, Routes } from 'react-router-dom';
import { DashboardView } from './views/DashboardView';
import { EstimateDetailView } from './views/EstimateDetailView';
import { EstimateFormView } from './views/EstimateFormView';
import { NotFoundView } from './views/NotFoundView';

export function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[var(--border-hairline)] px-6 py-5">
        <h1 className="m-0 text-h2 font-light tracking-[var(--ls-heading)] text-navy">
          Boncom Estimates
        </h1>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/estimates/new" element={<EstimateFormView />} />
          <Route path="/estimates/:id" element={<EstimateDetailView />} />
          <Route path="/estimates/:id/edit" element={<EstimateFormView />} />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </main>
    </div>
  );
}
