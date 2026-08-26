import React from 'react';
import { Badge } from './badge';

export type EntityStatus = 'draft' | 'published' | 'archived' | 'closed' | 'late' | string;

interface StatusBadgeProps {
  status: EntityStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case 'published':
    case 'active':
      return <Badge variant="success" className={className}>Published</Badge>;
    case 'draft':
      return <Badge variant="warning" className={className}>Draft</Badge>;
    case 'archived':
      return <Badge variant="default" className={className}>Archived</Badge>;
    case 'closed':
      return <Badge variant="purple" className={className}>Closed</Badge>;
    case 'late':
      return <Badge variant="danger" className={className}>Late</Badge>;
    default:
      return <Badge variant="default" className={className}>{status}</Badge>;
  }
}
