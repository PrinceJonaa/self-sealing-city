import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CityApp } from './CityApp';
import './styles.css';

createRoot(document.getElementById('city-root')!).render(
  <StrictMode>
    <CityApp />
  </StrictMode>,
);

const standaloneWindow = window as typeof window & { __SELF_SEALING_STANDALONE__?: boolean };

if ('serviceWorker' in navigator && window.location.protocol !== 'file:' && !standaloneWindow.__SELF_SEALING_STANDALONE__) {
  const register = () => navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', register, { once: true });
}
