import { useEffect, useState } from 'react';
import { API_BASE_URL } from './config';

interface HealthResponse {
  status: string;
  timestamp: string;
}

type FetchState =
  | { kind: 'loading' }
  | { kind: 'success'; data: HealthResponse }
  | { kind: 'error'; message: string };

export function App() {
  const [state, setState] = useState<FetchState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function checkHealth(): Promise<void> {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
          throw new Error(`Backend responded with ${response.status}`);
        }
        const data = (await response.json()) as HealthResponse;
        if (!cancelled) {
          setState({ kind: 'success', data });
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Unknown error';
          setState({ kind: 'error', message });
        }
      }
    }

    void checkHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Boncom Estimates</h1>
      <p>
        Backend connectivity check against <code>{API_BASE_URL}/health</code>
      </p>

      {state.kind === 'loading' && <p>Checking backend…</p>}

      {state.kind === 'success' && (
        <div style={{ color: 'green' }}>
          <p>✓ Backend reachable</p>
          <p>status: {state.data.status}</p>
          <p>timestamp: {state.data.timestamp}</p>
        </div>
      )}

      {state.kind === 'error' && (
        <div style={{ color: 'crimson' }}>
          <p>✗ Could not reach backend</p>
          <p>{state.message}</p>
        </div>
      )}
    </main>
  );
}
