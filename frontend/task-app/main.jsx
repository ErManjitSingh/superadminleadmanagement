import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import AppProviders from '../src/providers/AppProviders';
import ErrorBoundary from '../src/components/ErrorBoundary';
import TaskApp from './TaskApp';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <TaskApp />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);
