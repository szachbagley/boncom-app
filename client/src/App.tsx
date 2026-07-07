import { Route, Routes } from 'react-router-dom';
import { DashboardView } from './views/DashboardView';
import { EstimateDetailView } from './views/EstimateDetailView';
import { EstimateFormView } from './views/EstimateFormView';
import { NotFoundView } from './views/NotFoundView';

export function App() {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/estimates/new" element={<EstimateFormView />} />
        <Route path="/estimates/:id" element={<EstimateDetailView />} />
        <Route path="/estimates/:id/edit" element={<EstimateFormView />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </div>
  );
}
