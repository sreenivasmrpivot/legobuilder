import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-gray-400">Please refresh the page to try again.</p>
          </div>
        </div>
      }
    >
      <AppShell />
    </ErrorBoundary>
  );
}
