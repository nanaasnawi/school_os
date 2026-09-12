'use client';

import React, { createContext, useContext } from 'react';

interface PermissionContextType {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  hasPermission: () => false,
});

export function PermissionProvider({
  permissions = [],
  children,
}: {
  permissions?: string[];
  children: React.ReactNode;
}) {
  const hasPermission = (permission: string) => {
    if (permissions.includes('*') || permissions.includes('admin:all')) {
      return true;
    }
    return permissions.includes(permission);
  };

  return (
    <PermissionContext.Provider value={{ permissions, hasPermission }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
