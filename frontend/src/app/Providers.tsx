'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppQueryProvider } from '@/providers/query-provider';
import { PermissionProvider } from '@/shared/auth/permission-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppQueryProvider>
      <AuthProvider>
        <PermissionProvider permissions={['*']}>
          {children}
        </PermissionProvider>
      </AuthProvider>
    </AppQueryProvider>
  );
}
