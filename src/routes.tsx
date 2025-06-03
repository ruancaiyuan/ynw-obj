import { createBrowserRouter, useLocation } from 'react-router-dom';
import React from 'react';
import { MainTab } from './tabs/MainTab';
import { DecryptPage } from './pages/DecryptPage';
import { RemoveVocalsPage } from './pages/RemoveVocalsPage';
import { accessLogger } from './util/accessLogger';

function RouteLogger({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  React.useEffect(() => {
    accessLogger.logAccess(location.pathname);
  }, [location]);

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RouteLogger>
        <MainTab />
      </RouteLogger>
    ),
  },
  {
    path: '/decrypt',
    element: (
      <RouteLogger>
        <DecryptPage />
      </RouteLogger>
    ),
  },
  {
    path: '/remove-vocals',
    element: (
      <RouteLogger>
        <RemoveVocalsPage />
      </RouteLogger>
    ),
  },
]); 