'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, Suspense } from 'react';
import { DemoProvider } from './components/demo/demo-context';
import { DemoPlayer } from './components/demo/demo-player';
import { DemoOverlay } from './components/demo/demo-overlay';
import { DemoInitializer } from './components/demo/demo-initializer';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <DemoProvider>
        <Suspense fallback={null}>
          <DemoInitializer />
        </Suspense>
        <DemoPlayer />
        <DemoOverlay />
        {children}
      </DemoProvider>
    </SessionProvider>
  );
}
