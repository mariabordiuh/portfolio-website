import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StableApp from './StableApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StableApp />
  </StrictMode>,
);
